create or replace function save_exam_schedule(
  target_exam_id uuid,
  target_class_id uuid,
  target_subject_id uuid,
  target_name text,
  target_date date,
  target_total_marks integer,
  target_state exam_state
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  sid uuid := auth_school_id();
  saved_id uuid;
begin
  if auth.uid() is null or auth_role() not in ('owner', 'admin', 'teacher') then raise exception 'Only school staff may manage exams'; end if;
  if nullif(trim(target_name), '') is null then raise exception 'Exam name is required'; end if;
  if target_total_marks <= 0 or target_total_marks > 1000 then raise exception 'Total marks must be between 1 and 1000'; end if;
  if not exists (select 1 from classes where id = target_class_id and school_id = sid) then raise exception 'Class is outside this school'; end if;
  if not exists (select 1 from subjects where id = target_subject_id and school_id = sid) then raise exception 'Subject is outside this school'; end if;
  if auth_role() = 'teacher' and not teacher_has_subject(target_class_id, target_subject_id) then raise exception 'Teacher is not assigned to this class and subject'; end if;

  if target_exam_id is null then
    insert into exams (school_id, class_id, subject_id, name, exam_date, total_marks, state, created_by)
    values (sid, target_class_id, target_subject_id, trim(target_name), target_date, target_total_marks, target_state, auth.uid()) returning id into saved_id;
  else
    if exists (select 1 from exams where id = target_exam_id and school_id = sid and state = 'published') then raise exception 'Published exams cannot be edited'; end if;
    update exams set class_id = target_class_id, subject_id = target_subject_id, name = trim(target_name), exam_date = target_date, total_marks = target_total_marks, state = target_state
    where id = target_exam_id and school_id = sid
      and (is_school_admin() or created_by = auth.uid() or teacher_has_subject(target_class_id, target_subject_id))
    returning id into saved_id;
    if saved_id is null then raise exception 'Exam not found or not editable'; end if;
  end if;
  return saved_id;
end;
$$;

create or replace function delete_exam_schedule(target_exam_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare sid uuid := auth_school_id();
begin
  if auth.uid() is null or auth_role() not in ('owner', 'admin', 'teacher') then raise exception 'Only school staff may manage exams'; end if;
  if exists (select 1 from exams where id = target_exam_id and school_id = sid and (state = 'published' or exists (select 1 from results where exam_id = target_exam_id))) then
    raise exception 'Published exams or exams with results cannot be deleted';
  end if;
  delete from exams where id = target_exam_id and school_id = sid and (is_school_admin() or created_by = auth.uid());
  if not found then raise exception 'Exam not found or not deletable'; end if;
end;
$$;

revoke all on function save_exam_schedule(uuid, uuid, uuid, text, date, integer, exam_state) from public;
revoke all on function delete_exam_schedule(uuid) from public;
grant execute on function save_exam_schedule(uuid, uuid, uuid, text, date, integer, exam_state) to authenticated;
grant execute on function delete_exam_schedule(uuid) to authenticated;
