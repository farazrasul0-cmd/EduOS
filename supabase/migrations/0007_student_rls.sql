-- Restrict students to the student row linked through students.profile_id and
-- to that student's own academic/financial records.

create or replace function student_is_self(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth_role() = 'student' and exists (
    select 1 from students s
    where s.id = target_student_id
      and s.profile_id = auth.uid()
      and s.school_id = auth_school_id()
  ), false);
$$;

create or replace function student_has_class(target_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth_role() = 'student' and exists (
    select 1 from students s
    where s.profile_id = auth.uid()
      and s.class_id = target_class_id
      and s.school_id = auth_school_id()
  ), false);
$$;

-- Remove the temporary tenant-wide student policies introduced while the
-- teacher and parent policies were being staged.
do $$
declare
  t text;
begin
  foreach t in array array[
    'subjects', 'classes', 'guardians', 'students', 'class_subjects',
    'timetable_slots', 'attendance_records', 'assignments', 'submissions',
    'exams', 'exam_questions', 'results', 'fee_plans', 'invoices', 'payments',
    'calendar_events', 'message_threads', 'messages'
  ]
  loop
    execute format('drop policy if exists legacy_student on %I', t);
  end loop;
end $$;

create policy student_subjects_select on subjects for select to authenticated
  using (school_id = auth_school_id() and exists (
    select 1 from class_subjects cs
    where cs.subject_id = subjects.id and student_has_class(cs.class_id)
  ));
create policy student_classes_select on classes for select to authenticated
  using (school_id = auth_school_id() and student_has_class(id));
create policy student_class_subjects_select on class_subjects for select to authenticated
  using (school_id = auth_school_id() and student_has_class(class_id));
create policy student_timetable_select on timetable_slots for select to authenticated
  using (school_id = auth_school_id() and student_has_class(class_id));

create policy student_self_select on students for select to authenticated
  using (school_id = auth_school_id() and student_is_self(id));
create policy student_guardians_select on guardians for select to authenticated
  using (school_id = auth_school_id() and exists (
    select 1 from student_guardians sg
    where sg.guardian_id = guardians.id and student_is_self(sg.student_id)
  ));
create policy student_attendance_select on attendance_records for select to authenticated
  using (school_id = auth_school_id() and student_is_self(student_id));

create policy student_assignments_select on assignments for select to authenticated
  using (school_id = auth_school_id() and state <> 'draft' and student_has_class(class_id));
create policy student_submissions_select on submissions for select to authenticated
  using (school_id = auth_school_id() and student_is_self(student_id));
create policy student_submissions_insert on submissions for insert to authenticated
  with check (school_id = auth_school_id() and student_is_self(student_id) and exists (
    select 1 from assignments a
    where a.id = submissions.assignment_id
      and a.school_id = auth_school_id()
      and a.state = 'open'
      and student_has_class(a.class_id)
  ));
create policy student_submissions_update on submissions for update to authenticated
  using (school_id = auth_school_id() and student_is_self(student_id) and exists (
    select 1 from assignments a
    where a.id = submissions.assignment_id and a.state = 'open'
  ))
  with check (school_id = auth_school_id() and student_is_self(student_id) and exists (
    select 1 from assignments a
    where a.id = submissions.assignment_id
      and a.school_id = auth_school_id()
      and a.state = 'open'
      and student_has_class(a.class_id)
  ));

-- RLS controls rows, not individual columns. This trigger prevents a student
-- with legitimate submission-row access from writing grading fields or moving
-- the submission to another assignment/student/school.
create or replace function protect_student_submission_grading()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth_role() <> 'student' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.grade is not null or new.feedback is not null or new.graded_by is not null
       or new.graded_at is not null or new.status not in ('in_progress', 'submitted') then
      raise exception 'students cannot set grading fields' using errcode = '42501';
    end if;
  else
    if new.school_id is distinct from old.school_id
       or new.assignment_id is distinct from old.assignment_id
       or new.student_id is distinct from old.student_id
       or new.grade is distinct from old.grade
       or new.feedback is distinct from old.feedback
       or new.graded_by is distinct from old.graded_by
       or new.graded_at is distinct from old.graded_at
       or new.status not in ('in_progress', 'submitted') then
      raise exception 'students may only update their submission content' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_student_submission_grading on submissions;
create trigger protect_student_submission_grading
  before insert or update on submissions
  for each row execute function protect_student_submission_grading();

create policy student_exams_select on exams for select to authenticated
  using (school_id = auth_school_id() and state <> 'draft' and student_has_class(class_id));
create policy student_exam_questions_select on exam_questions for select to authenticated
  using (school_id = auth_school_id() and exists (
    select 1 from exams e
    where e.id = exam_questions.exam_id
      and e.state = 'published'
      and student_has_class(e.class_id)
  ));
create policy student_results_select on results for select to authenticated
  using (school_id = auth_school_id() and published and student_is_self(student_id));

create policy student_fee_plans_select on fee_plans for select to authenticated
  using (school_id = auth_school_id() and exists (
    select 1 from invoices i
    where i.fee_plan_id = fee_plans.id and student_is_self(i.student_id)
  ));
create policy student_invoices_select on invoices for select to authenticated
  using (school_id = auth_school_id() and student_is_self(student_id));
create policy student_payments_select on payments for select to authenticated
  using (school_id = auth_school_id() and exists (
    select 1 from invoices i
    where i.id = payments.invoice_id and student_is_self(i.student_id)
  ));

create policy student_calendar_select on calendar_events for select to authenticated
  using (school_id = auth_school_id() and (class_id is null or student_has_class(class_id)));

drop policy if exists legacy_student on student_guardians;
create policy student_student_guardians_select on student_guardians for select to authenticated
  using (student_is_self(student_id));
