-- Atomically create/reuse a guardian and link them to a student. Invitation
-- delivery is a separate integration; this function owns the school records.

create or replace function link_guardian_to_student(
  target_student_id uuid,
  guardian_name text,
  guardian_email text default null,
  guardian_phone text default null,
  guardian_relationship text default null,
  make_primary boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_school_id uuid;
  linked_guardian_id uuid;
begin
  if not is_school_admin() then
    raise exception 'owner or admin role required' using errcode = '42501';
  end if;
  if nullif(btrim(guardian_name), '') is null then
    raise exception 'guardian name is required' using errcode = '22023';
  end if;

  select school_id into target_school_id
  from students
  where id = target_student_id and school_id = auth_school_id();
  if not found then
    raise exception 'student not found' using errcode = 'P0002';
  end if;

  if nullif(btrim(guardian_email), '') is not null then
    select id into linked_guardian_id
    from guardians
    where school_id = target_school_id
      and lower(email) = lower(btrim(guardian_email))
    limit 1;
  end if;

  if linked_guardian_id is null then
    insert into guardians (school_id, full_name, email, phone, relationship)
    values (
      target_school_id,
      btrim(guardian_name),
      nullif(btrim(guardian_email), ''),
      nullif(btrim(guardian_phone), ''),
      nullif(btrim(guardian_relationship), '')
    )
    returning id into linked_guardian_id;
  else
    update guardians
    set full_name = btrim(guardian_name),
        phone = coalesce(nullif(btrim(guardian_phone), ''), phone),
        relationship = coalesce(nullif(btrim(guardian_relationship), ''), relationship)
    where id = linked_guardian_id;
  end if;

  if make_primary then
    update student_guardians set is_primary = false where student_id = target_student_id;
  end if;

  insert into student_guardians (student_id, guardian_id, is_primary)
  values (target_student_id, linked_guardian_id, make_primary)
  on conflict (student_id, guardian_id) do update
  set is_primary = excluded.is_primary;

  return linked_guardian_id;
end;
$$;

revoke all on function link_guardian_to_student(uuid, text, text, text, text, boolean) from public;
grant execute on function link_guardian_to_student(uuid, text, text, text, text, boolean) to authenticated;
