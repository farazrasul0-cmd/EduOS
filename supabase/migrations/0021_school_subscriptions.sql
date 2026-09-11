-- Persisted school plan management. Payment collection remains provider-specific.
create table school_subscriptions (
  id uuid primary key default gen_random_uuid(), school_id uuid not null unique references schools(id) on delete cascade,
  plan text not null default 'starter' check(plan in ('starter','growth','school')),
  status text not null default 'trialing' check(status in ('trialing','active','past_due','cancelled')),
  price_per_student numeric(10,2) not null default 29 check(price_per_student>=0),
  billing_email text, current_period_start date not null default current_date,
  current_period_end date not null default (current_date + interval '1 month')::date,
  cancel_at_period_end boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
insert into school_subscriptions(school_id,billing_email)
select s.id,p.email from schools s left join profiles p on p.school_id=s.id and p.role='owner'
on conflict(school_id) do nothing;
alter table school_subscriptions enable row level security;
create policy school_subscriptions_admin_select on school_subscriptions for select to authenticated using(school_id=auth_school_id() and is_school_admin());

create or replace function update_school_subscription(target_plan text,target_billing_email text,target_cancel boolean default false)
returns void language plpgsql security definer set search_path=public as $$
declare sid uuid:=auth_school_id(); price numeric;
begin
  if not is_school_admin() then raise exception 'not_authorized'; end if;
  price:=case target_plan when 'starter' then 29 when 'growth' then 49 when 'school' then 79 else null end;
  if price is null then raise exception 'invalid_plan'; end if;
  if nullif(trim(target_billing_email),'') is null or position('@' in target_billing_email)<2 then raise exception 'invalid_email'; end if;
  insert into school_subscriptions(school_id,plan,status,price_per_student,billing_email,cancel_at_period_end)
  values(sid,target_plan,'active',price,lower(trim(target_billing_email)),target_cancel)
  on conflict(school_id) do update set plan=excluded.plan,price_per_student=excluded.price_per_student,
    billing_email=excluded.billing_email,cancel_at_period_end=excluded.cancel_at_period_end,status=case when school_subscriptions.status='cancelled' then 'active' else school_subscriptions.status end,updated_at=now();
end; $$;
revoke all on function update_school_subscription(text,text,boolean) from public;
grant execute on function update_school_subscription(text,text,boolean) to authenticated;
