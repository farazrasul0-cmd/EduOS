-- Atomic timetable CRUD with school-scoped authorization and clash detection.
create or replace function save_timetable_slot(
  target_slot_id uuid,
  target_class_id uuid,
  target_subject_id uuid,
  target_teacher_id uuid,
  target_day smallint,
  target_period smallint,
  target_start time,
  target_end time,
  target_room text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  sid uuid := auth_school_id();
  slot_id uuid;
  role_name user_role := auth_role();
begin
  if sid is null or role_name not in ('owner', 'admin', 'teacher') then
    raise exception 'not_authorized';
  end if;
  if target_day not between 1 and 6 or target_period not between 1 and 8 then
    raise exception 'invalid_day_or_period';
  end if;
  if (target_start is null) <> (target_end is null) or (target_start is not null and target_start >= target_end) then
    raise exception 'invalid_time_range';
  end if;
  if not exists (select 1 from classes where id = target_class_id and school_id = sid)
     or not exists (select 1 from subjects where id = target_subject_id and school_id = sid) then
    raise exception 'invalid_class_or_subject';
  end if;
  if target_teacher_id is not null and not exists (
    select 1 from profiles where id = target_teacher_id and school_id = sid and role in ('owner','admin','teacher')
  ) then raise exception 'invalid_teacher'; end if;
  if role_name = 'teacher' and (
    target_teacher_id is distinct from auth.uid() or not exists (
      select 1 from class_subjects where school_id = sid and class_id = target_class_id
        and subject_id = target_subject_id and teacher_id = auth.uid()
    )
  ) then raise exception 'not_authorized'; end if;

  perform pg_advisory_xact_lock(hashtext(sid::text || ':' || target_day::text));
  if exists (
    select 1 from timetable_slots t
    where t.school_id = sid and t.day_of_week = target_day
      and t.id is distinct from target_slot_id
      and (t.period = target_period or (
        target_start is not null and t.start_time is not null
        and target_start < t.end_time and target_end > t.start_time
      ))
      and (t.class_id = target_class_id
        or (target_teacher_id is not null and t.teacher_id = target_teacher_id)
        or (nullif(trim(target_room), '') is not null and lower(trim(t.room)) = lower(trim(target_room))))
  ) then raise exception 'timetable_clash'; end if;

  if target_slot_id is null then
    insert into timetable_slots(school_id,class_id,subject_id,teacher_id,day_of_week,period,start_time,end_time,room)
    values(sid,target_class_id,target_subject_id,target_teacher_id,target_day,target_period,target_start,target_end,nullif(trim(target_room),''))
    returning id into slot_id;
  else
    update timetable_slots set class_id=target_class_id, subject_id=target_subject_id, teacher_id=target_teacher_id,
      day_of_week=target_day, period=target_period, start_time=target_start, end_time=target_end, room=nullif(trim(target_room),'')
    where id=target_slot_id and school_id=sid
      and (role_name in ('owner','admin') or teacher_id=auth.uid()) returning id into slot_id;
    if slot_id is null then raise exception 'not_authorized'; end if;
  end if;
  return slot_id;
end; $$;

create or replace function delete_timetable_slot(target_slot_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare sid uuid := auth_school_id(); role_name user_role := auth_role();
begin
  delete from timetable_slots where id=target_slot_id and school_id=sid
    and (role_name in ('owner','admin') or (role_name='teacher' and teacher_id=auth.uid()));
  if not found then raise exception 'not_authorized'; end if;
end; $$;

revoke all on function save_timetable_slot(uuid,uuid,uuid,uuid,smallint,smallint,time,time,text) from public;
revoke all on function delete_timetable_slot(uuid) from public;
grant execute on function save_timetable_slot(uuid,uuid,uuid,uuid,smallint,smallint,time,time,text) to authenticated;
grant execute on function delete_timetable_slot(uuid) to authenticated;
