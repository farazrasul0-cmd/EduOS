create or replace function save_exam_results(result_rows jsonb, publish_now boolean)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  sid uuid := auth_school_id();
  target_exam exams%rowtype;
  row_count integer;
  roster_count integer;
  completed_count integer;
begin
  if auth.uid() is null or auth_role() not in ('owner', 'admin', 'teacher') then
    raise exception 'Only school staff may save results';
  end if;
  if jsonb_array_length(result_rows) = 0 then raise exception 'No result rows supplied'; end if;

  select e.* into target_exam from exams e
  where e.id = (result_rows -> 0 ->> 'exam_id')::uuid and e.school_id = sid;
  if not found then raise exception 'Exam not found'; end if;
  if auth_role() = 'teacher' and not teacher_has_subject(target_exam.class_id, target_exam.subject_id) then
    raise exception 'Teacher is not assigned to this exam';
  end if;

  if exists (
    select 1 from jsonb_to_recordset(result_rows) as r(exam_id uuid, student_id uuid, marks_obtained numeric)
    where r.exam_id <> target_exam.id or r.marks_obtained < 0 or r.marks_obtained > target_exam.total_marks
      or not exists (select 1 from students s where s.id = r.student_id and s.school_id = sid and s.active and (target_exam.class_id is null or s.class_id = target_exam.class_id))
  ) then raise exception 'One or more result rows are invalid'; end if;

  insert into results (school_id, exam_id, student_id, marks_obtained, grade, published)
  select sid, target_exam.id, r.student_id, r.marks_obtained, r.grade, false
  from jsonb_to_recordset(result_rows) as r(student_id uuid, marks_obtained numeric, grade text)
  on conflict (exam_id, student_id) do update set marks_obtained = excluded.marks_obtained, grade = excluded.grade, published = false;
  get diagnostics row_count = row_count;

  if publish_now then
    select count(*) into roster_count from students s where s.school_id = sid and s.active and (target_exam.class_id is null or s.class_id = target_exam.class_id);
    select count(*) into completed_count from results r join students s on s.id = r.student_id
      where r.exam_id = target_exam.id and r.marks_obtained is not null and s.active and (target_exam.class_id is null or s.class_id = target_exam.class_id);
    if completed_count <> roster_count then raise exception 'Every active student must have valid marks before publication'; end if;
    update results set published = true where exam_id = target_exam.id;
    update exams set state = 'published' where id = target_exam.id;
  end if;
  return row_count;
end;
$$;

revoke all on function save_exam_results(jsonb, boolean) from public;
grant execute on function save_exam_results(jsonb, boolean) to authenticated;
