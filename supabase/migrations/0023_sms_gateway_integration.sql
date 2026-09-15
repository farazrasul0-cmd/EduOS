-- Support Bangladesh SMS Gateway (BulkSMSBD / SMS Gateway) in school integrations.
alter table school_integrations drop constraint if exists school_integrations_provider_check;
alter table school_integrations add constraint school_integrations_provider_check
  check (provider in ('classroom', 'sslcommerz', 'whatsapp', 'zoom', 'bulksmsbd', 'sms_gateway'));

insert into school_integrations(school_id, provider)
select s.id, p.provider from schools s cross join (values('bulksmsbd')) p(provider)
on conflict(school_id, provider) do nothing;

create or replace function configure_school_integration(
  target_provider text,
  target_account_label text,
  target_enabled boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  sid uuid := auth_school_id();
begin
  if not is_school_admin() then raise exception 'not_authorized'; end if;
  if target_provider not in ('classroom', 'sslcommerz', 'whatsapp', 'zoom', 'bulksmsbd', 'sms_gateway') then
    raise exception 'invalid_provider';
  end if;
  if target_enabled and nullif(trim(target_account_label), '') is null then
    raise exception 'account_required';
  end if;

  insert into school_integrations(school_id, provider, status, account_label, configured_by, configured_at)
  values(
    sid,
    target_provider,
    case when target_enabled then 'configured' else 'disconnected' end,
    case when target_enabled then trim(target_account_label) else null end,
    case when target_enabled then auth.uid() else null end,
    case when target_enabled then now() else null end
  )
  on conflict(school_id, provider) do update set
    status = excluded.status,
    account_label = excluded.account_label,
    configured_by = excluded.configured_by,
    configured_at = excluded.configured_at,
    updated_at = now();
end;
$$;
