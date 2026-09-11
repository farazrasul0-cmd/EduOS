-- Per-user notification preferences and an auditable retryable delivery outbox.
create table notification_preferences (
  user_id uuid primary key references profiles(id) on delete cascade,
  school_id uuid not null references schools(id) on delete cascade,
  absent boolean not null default true, fees boolean not null default true,
  reply boolean not null default true, ai boolean not null default false,
  email boolean not null default true, sms boolean not null default false,
  whatsapp boolean not null default false, updated_at timestamptz not null default now()
);
alter table notification_preferences enable row level security;
create policy notification_preferences_own on notification_preferences for all to authenticated
  using(user_id=auth.uid() and school_id=auth_school_id()) with check(user_id=auth.uid() and school_id=auth_school_id());

create type notification_delivery_channel as enum ('email','sms','whatsapp');
create type notification_delivery_status as enum ('pending','processing','sent','failed');
create table notification_deliveries (
  id uuid primary key default gen_random_uuid(), notification_id uuid not null references notifications(id) on delete cascade,
  school_id uuid not null references schools(id) on delete cascade, user_id uuid not null references profiles(id) on delete cascade,
  channel notification_delivery_channel not null, destination text, status notification_delivery_status not null default 'pending',
  attempts smallint not null default 0, next_retry_at timestamptz not null default now(), last_error text,
  sent_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(notification_id,channel)
);
create index notification_delivery_queue_idx on notification_deliveries(status,next_retry_at);
alter table notification_deliveries enable row level security;
create policy notification_deliveries_own_select on notification_deliveries for select to authenticated
  using(user_id=auth.uid() and school_id=auth_school_id());

create or replace function enqueue_notification_deliveries() returns trigger language plpgsql security definer set search_path=public as $$
declare p notification_preferences%rowtype; email_address text; phone_number text; enabled boolean;
begin
  select * into p from notification_preferences where user_id=new.user_id;
  if not found then p.email:=true; p.sms:=false; p.whatsapp:=false; p.absent:=true; p.fees:=true; p.reply:=true; p.ai:=false; end if;
  enabled := case when new.type='attendance_absent' then p.absent when new.type='fee_paid' then p.fees when new.type='message_reply' then p.reply when new.type='ai_insight' then p.ai else true end;
  if not enabled then return new; end if;
  select email,phone into email_address,phone_number from profiles where id=new.user_id;
  if p.email and nullif(email_address,'') is not null then insert into notification_deliveries(notification_id,school_id,user_id,channel,destination) values(new.id,new.school_id,new.user_id,'email',email_address) on conflict do nothing; end if;
  if p.sms and nullif(phone_number,'') is not null then insert into notification_deliveries(notification_id,school_id,user_id,channel,destination) values(new.id,new.school_id,new.user_id,'sms',phone_number) on conflict do nothing; end if;
  if p.whatsapp and nullif(phone_number,'') is not null then insert into notification_deliveries(notification_id,school_id,user_id,channel,destination) values(new.id,new.school_id,new.user_id,'whatsapp',phone_number) on conflict do nothing; end if;
  return new;
end; $$;
create trigger notifications_enqueue_delivery after insert on notifications for each row execute function enqueue_notification_deliveries();

create or replace function record_notification_delivery(target_id uuid, delivered boolean, error_message text default null) returns void
language plpgsql security definer set search_path=public as $$
begin
  update notification_deliveries set attempts=attempts+1, updated_at=now(), last_error=case when delivered then null else left(error_message,1000) end,
    status=case when delivered then 'sent'::notification_delivery_status when attempts+1>=5 then 'failed'::notification_delivery_status else 'pending'::notification_delivery_status end,
    sent_at=case when delivered then now() else null end,
    next_retry_at=case when delivered then now() else now() + make_interval(mins => least(60, power(2,attempts)::int)) end
  where id=target_id and user_id=auth.uid();
  if not found then raise exception 'not_authorized'; end if;
end; $$;
revoke all on function record_notification_delivery(uuid,boolean,text) from public;
grant execute on function record_notification_delivery(uuid,boolean,text) to authenticated;
