-- Notify linked guardian portal accounts when their child is marked absent.
-- The function is security-definer because normal notification RLS only lets a
-- user insert their own rows. Authorization is checked explicitly here.
create or replace function notify_absent_guardians(
  target_school_id uuid,
  target_date date,
  absent_student_ids uuid[]
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer := 0;
begin
  if auth.uid() is null or target_school_id is distinct from auth_school_id() then
    raise exception 'Not authorized for this school';
  end if;

  if auth_role() not in ('owner', 'admin', 'teacher') then
    raise exception 'Only school staff may notify guardians';
  end if;

  with recipients as (
    select distinct g.profile_id as user_id, s.id as student_id, s.full_name
    from students s
    join student_guardians sg on sg.student_id = s.id
    join guardians g on g.id = sg.guardian_id
    where s.school_id = target_school_id
      and s.id = any(coalesce(absent_student_ids, array[]::uuid[]))
      and g.profile_id is not null
      and (is_school_admin() or (auth_role() = 'teacher' and teacher_has_student(s.id)))
      and exists (
        select 1 from attendance_records ar
        where ar.student_id = s.id and ar.date = target_date and ar.status = 'absent'
      )
  ), inserted as (
    insert into notifications (school_id, user_id, type, title, body)
    select target_school_id, r.user_id, 'attendance_absent',
      r.full_name || ' was marked absent',
      json_build_object('student_id', r.student_id, 'name', r.full_name, 'date', target_date)::text
    from recipients r
    where not exists (
      select 1 from notifications n
      where n.user_id = r.user_id
        and n.type = 'attendance_absent'
        and n.body::jsonb ->> 'student_id' = r.student_id::text
        and n.body::jsonb ->> 'date' = target_date::text
    )
    returning 1
  )
  select count(*) into inserted_count from inserted;

  return inserted_count;
end;
$$;

revoke all on function notify_absent_guardians(uuid, date, uuid[]) from public;
grant execute on function notify_absent_guardians(uuid, date, uuid[]) to authenticated;
