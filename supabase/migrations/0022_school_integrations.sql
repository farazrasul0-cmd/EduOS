-- Persist integration setup state without storing provider secrets in the browser/database.
create table school_integrations (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references schools(id) on delete cascade,
  provider text not null check(provider in ('classroom','sslcommerz','whatsapp','zoom')),
  status text not null default 'disconnected' check(status in ('disconnected','configured')),
  account_label text, configured_by uuid references profiles(id) on delete set null,
  configured_at timestamptz, updated_at timestamptz not null default now(), unique(school_id,provider)
);
insert into school_integrations(school_id,provider)
select s.id,p.provider from schools s cross join (values('classroom'),('sslcommerz'),('whatsapp'),('zoom')) p(provider)
on conflict(school_id,provider) do nothing;
alter table school_integrations enable row level security;
create policy school_integrations_admin_select on school_integrations for select to authenticated using(school_id=auth_school_id() and is_school_admin());

create or replace function configure_school_integration(target_provider text,target_account_label text,target_enabled boolean)
returns void language plpgsql security definer set search_path=public as $$
declare sid uuid:=auth_school_id();
begin
  if not is_school_admin() then raise exception 'not_authorized'; end if;
  if target_provider not in ('classroom','sslcommerz','whatsapp','zoom') then raise exception 'invalid_provider'; end if;
  if target_enabled and nullif(trim(target_account_label),'') is null then raise exception 'account_required'; end if;
  insert into school_integrations(school_id,provider,status,account_label,configured_by,configured_at)
  values(sid,target_provider,case when target_enabled then 'configured' else 'disconnected' end,
    case when target_enabled then trim(target_account_label) else null end,
    case when target_enabled then auth.uid() else null end,case when target_enabled then now() else null end)
  on conflict(school_id,provider) do update set status=excluded.status,account_label=excluded.account_label,
    configured_by=excluded.configured_by,configured_at=excluded.configured_at,updated_at=now();
end; $$;
revoke all on function configure_school_integration(text,text,boolean) from public;
grant execute on function configure_school_integration(text,text,boolean) to authenticated;
