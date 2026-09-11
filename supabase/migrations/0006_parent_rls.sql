-- Restrict parents to children linked through guardians.profile_id and
-- student_guardians. Student-wide legacy access is removed in 0007.

create or replace function parent_has_student(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth_role() = 'parent' and exists (
    select 1
    from guardians g
    join student_guardians sg on sg.guardian_id = g.id
    join students s on s.id = sg.student_id
    where g.profile_id = auth.uid()
      and sg.student_id = target_student_id
      and g.school_id = auth_school_id()
      and s.school_id = auth_school_id()
  ), false);
$$;

create or replace function parent_has_class(target_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth_role() = 'parent' and exists (
    select 1 from students s
    where s.class_id = target_class_id
      and s.school_id = auth_school_id()
      and parent_has_student(s.id)
  ), false);
$$;

create or replace function parent_has_thread(target_thread_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth_role() = 'parent' and exists (
    select 1
    from message_threads mt
    join guardians g on g.id = mt.guardian_id
    where mt.id = target_thread_id
      and mt.school_id = auth_school_id()
      and g.profile_id = auth.uid()
      and (mt.student_id is null or parent_has_student(mt.student_id))
  ), false);
$$;

-- Replace the temporary parent/student-wide policies with student-only
-- compatibility policies. Parent access is defined table-by-table below.
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
    execute format('drop policy if exists legacy_non_teacher on %I', t);
    execute format(
      'create policy legacy_student on %I for all to authenticated '
      'using (school_id = auth_school_id() and auth_role() = ''student'') '
      'with check (school_id = auth_school_id() and auth_role() = ''student'')', t
    );
  end loop;
end $$;

-- Limit profile discovery: admins can see their school, teachers can discover
-- school members for academic/messaging UI, and all users can see themselves.
drop policy if exists profiles_select on profiles;
create policy profiles_own_select on profiles for select to authenticated
  using (id = auth.uid());
create policy profiles_admin_select on profiles for select to authenticated
  using (school_id = auth_school_id() and is_school_admin());
create policy profiles_teacher_select on profiles for select to authenticated
  using (school_id = auth_school_id() and auth_role() = 'teacher');

create policy parent_subjects_select on subjects for select to authenticated
  using (school_id = auth_school_id() and exists (
    select 1 from class_subjects cs
    where cs.subject_id = subjects.id and parent_has_class(cs.class_id)
  ));
create policy parent_classes_select on classes for select to authenticated
  using (school_id = auth_school_id() and parent_has_class(id));
create policy parent_class_subjects_select on class_subjects for select to authenticated
  using (school_id = auth_school_id() and parent_has_class(class_id));
create policy parent_timetable_select on timetable_slots for select to authenticated
  using (school_id = auth_school_id() and parent_has_class(class_id));

create policy parent_students_select on students for select to authenticated
  using (school_id = auth_school_id() and parent_has_student(id));
create policy parent_guardians_select on guardians for select to authenticated
  using (school_id = auth_school_id() and profile_id = auth.uid());
create policy parent_guardians_update on guardians for update to authenticated
  using (school_id = auth_school_id() and profile_id = auth.uid())
  with check (school_id = auth_school_id() and profile_id = auth.uid());

create policy parent_attendance_select on attendance_records for select to authenticated
  using (school_id = auth_school_id() and parent_has_student(student_id));
create policy parent_assignments_select on assignments for select to authenticated
  using (school_id = auth_school_id() and state <> 'draft' and parent_has_class(class_id));
create policy parent_submissions_select on submissions for select to authenticated
  using (school_id = auth_school_id() and parent_has_student(student_id));

create policy parent_exams_select on exams for select to authenticated
  using (school_id = auth_school_id() and state <> 'draft' and parent_has_class(class_id));
create policy parent_exam_questions_select on exam_questions for select to authenticated
  using (school_id = auth_school_id() and exists (
    select 1 from exams e
    where e.id = exam_questions.exam_id
      and e.state = 'published'
      and parent_has_class(e.class_id)
  ));
create policy parent_results_select on results for select to authenticated
  using (school_id = auth_school_id() and published and parent_has_student(student_id));

create policy parent_fee_plans_select on fee_plans for select to authenticated
  using (school_id = auth_school_id() and exists (
    select 1 from invoices i
    where i.fee_plan_id = fee_plans.id and parent_has_student(i.student_id)
  ));
create policy parent_invoices_select on invoices for select to authenticated
  using (school_id = auth_school_id() and parent_has_student(student_id));
create policy parent_payments_select on payments for select to authenticated
  using (school_id = auth_school_id() and exists (
    select 1 from invoices i
    where i.id = payments.invoice_id and parent_has_student(i.student_id)
  ));

create policy parent_calendar_select on calendar_events for select to authenticated
  using (school_id = auth_school_id() and (class_id is null or parent_has_class(class_id)));

create policy parent_threads_select on message_threads for select to authenticated
  using (school_id = auth_school_id() and parent_has_thread(id));
create policy parent_threads_update on message_threads for update to authenticated
  using (school_id = auth_school_id() and parent_has_thread(id))
  with check (school_id = auth_school_id() and exists (
    select 1 from guardians g
    where g.id = message_threads.guardian_id and g.profile_id = auth.uid()
  ) and (student_id is null or parent_has_student(student_id)));
create policy parent_messages_select on messages for select to authenticated
  using (school_id = auth_school_id() and parent_has_thread(thread_id));
create policy parent_messages_insert on messages for insert to authenticated
  with check (school_id = auth_school_id() and sender_id = auth.uid() and parent_has_thread(thread_id));

drop policy if exists legacy_non_teacher on student_guardians;
create policy legacy_student on student_guardians for all to authenticated
  using (auth_role() = 'student' and exists (
    select 1 from students s where s.id = student_id and s.school_id = auth_school_id()
  ))
  with check (auth_role() = 'student' and exists (
    select 1 from students s where s.id = student_id and s.school_id = auth_school_id()
  ));
create policy parent_student_guardians_select on student_guardians for select to authenticated
  using (parent_has_student(student_id) and exists (
    select 1 from guardians g where g.id = guardian_id and g.profile_id = auth.uid()
  ));
