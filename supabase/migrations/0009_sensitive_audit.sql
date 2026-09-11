-- Record sensitive mutations independently of application code. The trigger
-- is SECURITY DEFINER so audit creation cannot be suppressed by table RLS.

create or replace function write_sensitive_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_row jsonb;
  new_row jsonb;
  row_school_id uuid;
  row_entity_id uuid;
begin
  old_row := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
  new_row := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;
  row_school_id := nullif(coalesce(new_row ->> 'school_id', old_row ->> 'school_id'), '')::uuid;
  row_entity_id := nullif(coalesce(new_row ->> 'id', old_row ->> 'id'), '')::uuid;

  insert into audit_logs (school_id, actor_id, action, entity, entity_id, meta)
  values (
    row_school_id,
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    row_entity_id,
    jsonb_strip_nulls(jsonb_build_object('old', old_row, 'new', new_row))
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'attendance_records', 'results', 'invoices', 'payments', 'students',
    'assignments', 'submissions'
  ]
  loop
    execute format('drop trigger if exists audit_sensitive_change on %I', t);
    execute format(
      'create trigger audit_sensitive_change after insert or update or delete on %I '
      'for each row execute function write_sensitive_audit_log()', t
    );
  end loop;
end $$;

-- Profile edits are frequent; audit only changes that affect authorization or
-- tenant membership rather than ordinary name/phone edits.
drop trigger if exists audit_profile_membership_change on profiles;
create trigger audit_profile_membership_change
  after update of school_id, role on profiles
  for each row
  when (old.school_id is distinct from new.school_id or old.role is distinct from new.role)
  execute function write_sensitive_audit_log();

-- Audit rows are append-only from the client. Admins may read them, but even
-- admins cannot update or delete history through the API.
drop policy if exists admin_all on audit_logs;
create policy audit_admin_select on audit_logs for select to authenticated
  using (school_id = auth_school_id() and is_school_admin());
