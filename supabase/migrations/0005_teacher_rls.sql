-- Restrict teachers to classes and subjects assigned to them. Parent/student
-- access is intentionally retained by legacy_non_teacher policies until their
-- dedicated policies land in the following migrations.

create or replace function is_school_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth_role() in ('owner', 'admin'), false);
$$;

create or replace function teacher_has_class(target_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth_role() = 'teacher' and exists (
    select 1
    from classes c
    where c.id = target_class_id
      and c.school_id = auth_school_id()
      and (
        c.teacher_id = auth.uid()
        or exists (
          select 1 from class_subjects cs
          where cs.class_id = c.id and cs.teacher_id = auth.uid()
        )
      )
  ), false);
$$;

create or replace function teacher_has_subject(target_class_id uuid, target_subject_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth_role() = 'teacher' and exists (
    select 1
    from class_subjects cs
    where cs.school_id = auth_school_id()
      and cs.class_id = target_class_id
      and cs.subject_id = target_subject_id
      and (
        cs.teacher_id = auth.uid()
        or exists (
          select 1 from classes c
          where c.id = target_class_id and c.teacher_id = auth.uid()
        )
      )
  ), false);
$$;

create or replace function teacher_has_student(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth_role() = 'teacher' and exists (
    select 1 from students s
    where s.id = target_student_id
      and s.school_id = auth_school_id()
      and teacher_has_class(s.class_id)
  ), false);
$$;

-- Shared policy shape: admins retain full school access; parent/student access
-- remains tenant-wide only until their dedicated refinement steps.
do $$
declare
  t text;
begin
  foreach t in array array[
    'subjects', 'classes', 'guardians', 'students', 'class_subjects',
    'timetable_slots', 'attendance_records', 'assignments', 'submissions',
    'exams', 'exam_questions', 'results', 'calendar_events',
    'message_threads', 'messages'
  ]
  loop
    execute format('drop policy if exists tenant_all on %I', t);
    execute format(
      'create policy admin_all on %I for all to authenticated '
      'using (school_id = auth_school_id() and is_school_admin()) '
      'with check (school_id = auth_school_id() and is_school_admin())', t
    );
    execute format(
      'create policy legacy_non_teacher on %I for all to authenticated '
      'using (school_id = auth_school_id() and auth_role() in (''parent'', ''student'')) '
      'with check (school_id = auth_school_id() and auth_role() in (''parent'', ''student''))', t
    );
  end loop;
end $$;

-- Financial and audit data is not part of a teacher's academic scope.
do $$
declare
  t text;
begin
  foreach t in array array['fee_plans', 'invoices', 'payments']
  loop
    execute format('drop policy if exists tenant_all on %I', t);
    execute format(
      'create policy admin_all on %I for all to authenticated '
      'using (school_id = auth_school_id() and is_school_admin()) '
      'with check (school_id = auth_school_id() and is_school_admin())', t
    );
    execute format(
      'create policy legacy_non_teacher on %I for all to authenticated '
      'using (school_id = auth_school_id() and auth_role() in (''parent'', ''student'')) '
      'with check (school_id = auth_school_id() and auth_role() in (''parent'', ''student''))', t
    );
  end loop;
end $$;

drop policy if exists tenant_all on audit_logs;
create policy admin_all on audit_logs for all to authenticated
  using (school_id = auth_school_id() and is_school_admin())
  with check (school_id = auth_school_id() and is_school_admin());

-- Teachers may discover only subjects/classes assigned to them.
create policy teacher_subjects_select on subjects for select to authenticated
  using (school_id = auth_school_id() and auth_role() = 'teacher' and exists (
    select 1 from class_subjects cs
    where cs.subject_id = subjects.id and cs.teacher_id = auth.uid()
  ));

create policy teacher_classes_select on classes for select to authenticated
  using (school_id = auth_school_id() and teacher_has_class(id));

create policy teacher_class_subjects_select on class_subjects for select to authenticated
  using (school_id = auth_school_id() and
    (teacher_id = auth.uid() or teacher_has_class(class_id)));

create policy teacher_timetable_select on timetable_slots for select to authenticated
  using (school_id = auth_school_id() and
    (teacher_id = auth.uid() or teacher_has_class(class_id)));

-- Student/guardian roster is read-only for assigned teachers.
create policy teacher_students_select on students for select to authenticated
  using (school_id = auth_school_id() and teacher_has_class(class_id));

create policy teacher_guardians_select on guardians for select to authenticated
  using (school_id = auth_school_id() and exists (
    select 1
    from student_guardians sg
    where sg.guardian_id = guardians.id and teacher_has_student(sg.student_id)
  ));

-- Attendance can be managed only for an assigned class and student belonging
-- to that class. This prevents moving records into an unrelated class.
create policy teacher_attendance_select on attendance_records for select to authenticated
  using (school_id = auth_school_id() and teacher_has_class(class_id) and teacher_has_student(student_id));
create policy teacher_attendance_insert on attendance_records for insert to authenticated
  with check (school_id = auth_school_id() and teacher_has_class(class_id) and teacher_has_student(student_id));
create policy teacher_attendance_update on attendance_records for update to authenticated
  using (school_id = auth_school_id() and teacher_has_class(class_id) and teacher_has_student(student_id))
  with check (school_id = auth_school_id() and teacher_has_class(class_id) and teacher_has_student(student_id));

-- Assignment/exam authors need both their assigned class and subject.
create policy teacher_assignments_select on assignments for select to authenticated
  using (school_id = auth_school_id() and teacher_has_subject(class_id, subject_id));
create policy teacher_assignments_insert on assignments for insert to authenticated
  with check (school_id = auth_school_id() and teacher_has_subject(class_id, subject_id) and created_by = auth.uid());
create policy teacher_assignments_update on assignments for update to authenticated
  using (school_id = auth_school_id() and teacher_has_subject(class_id, subject_id))
  with check (school_id = auth_school_id() and teacher_has_subject(class_id, subject_id));
create policy teacher_assignments_delete on assignments for delete to authenticated
  using (school_id = auth_school_id() and created_by = auth.uid() and teacher_has_subject(class_id, subject_id));

create policy teacher_submissions_select on submissions for select to authenticated
  using (school_id = auth_school_id() and teacher_has_student(student_id) and exists (
    select 1 from assignments a
    where a.id = submissions.assignment_id and teacher_has_subject(a.class_id, a.subject_id)
  ));
create policy teacher_submissions_update on submissions for update to authenticated
  using (school_id = auth_school_id() and teacher_has_student(student_id) and exists (
    select 1 from assignments a
    where a.id = submissions.assignment_id and teacher_has_subject(a.class_id, a.subject_id)
  ))
  with check (school_id = auth_school_id() and teacher_has_student(student_id) and exists (
    select 1 from assignments a
    where a.id = submissions.assignment_id and teacher_has_subject(a.class_id, a.subject_id)
  ));

create policy teacher_exams_select on exams for select to authenticated
  using (school_id = auth_school_id() and teacher_has_subject(class_id, subject_id));
create policy teacher_exams_insert on exams for insert to authenticated
  with check (school_id = auth_school_id() and teacher_has_subject(class_id, subject_id) and created_by = auth.uid());
create policy teacher_exams_update on exams for update to authenticated
  using (school_id = auth_school_id() and teacher_has_subject(class_id, subject_id))
  with check (school_id = auth_school_id() and teacher_has_subject(class_id, subject_id));
create policy teacher_exams_delete on exams for delete to authenticated
  using (school_id = auth_school_id() and created_by = auth.uid() and teacher_has_subject(class_id, subject_id));

create policy teacher_exam_questions_all on exam_questions for all to authenticated
  using (school_id = auth_school_id() and exists (
    select 1 from exams e where e.id = exam_questions.exam_id and teacher_has_subject(e.class_id, e.subject_id)
  ))
  with check (school_id = auth_school_id() and exists (
    select 1 from exams e where e.id = exam_questions.exam_id and teacher_has_subject(e.class_id, e.subject_id)
  ));

create policy teacher_results_select on results for select to authenticated
  using (school_id = auth_school_id() and teacher_has_student(student_id) and exists (
    select 1 from exams e where e.id = results.exam_id and teacher_has_subject(e.class_id, e.subject_id)
  ));
create policy teacher_results_insert on results for insert to authenticated
  with check (school_id = auth_school_id() and teacher_has_student(student_id) and exists (
    select 1 from exams e where e.id = results.exam_id and teacher_has_subject(e.class_id, e.subject_id)
  ));
create policy teacher_results_update on results for update to authenticated
  using (school_id = auth_school_id() and teacher_has_student(student_id) and exists (
    select 1 from exams e where e.id = results.exam_id and teacher_has_subject(e.class_id, e.subject_id)
  ))
  with check (school_id = auth_school_id() and teacher_has_student(student_id) and exists (
    select 1 from exams e where e.id = results.exam_id and teacher_has_subject(e.class_id, e.subject_id)
  ));

-- Teachers see school-wide events plus events for their classes; they may only
-- change events they created for an assigned class.
create policy teacher_calendar_select on calendar_events for select to authenticated
  using (school_id = auth_school_id() and auth_role() = 'teacher' and
    (class_id is null or teacher_has_class(class_id)));
create policy teacher_calendar_insert on calendar_events for insert to authenticated
  with check (school_id = auth_school_id() and created_by = auth.uid() and
    (class_id is null or teacher_has_class(class_id)));
create policy teacher_calendar_update on calendar_events for update to authenticated
  using (school_id = auth_school_id() and created_by = auth.uid() and
    (class_id is null or teacher_has_class(class_id)))
  with check (school_id = auth_school_id() and created_by = auth.uid() and
    (class_id is null or teacher_has_class(class_id)));
create policy teacher_calendar_delete on calendar_events for delete to authenticated
  using (school_id = auth_school_id() and created_by = auth.uid());

-- Messaging is participant-only for teachers.
create policy teacher_threads_select on message_threads for select to authenticated
  using (school_id = auth_school_id() and teacher_id = auth.uid());
create policy teacher_messages_select on messages for select to authenticated
  using (school_id = auth_school_id() and exists (
    select 1 from message_threads mt where mt.id = messages.thread_id and mt.teacher_id = auth.uid()
  ));
create policy teacher_messages_insert on messages for insert to authenticated
  with check (school_id = auth_school_id() and sender_id = auth.uid() and exists (
    select 1 from message_threads mt where mt.id = messages.thread_id and mt.teacher_id = auth.uid()
  ));

-- The join table has no school_id and needs its own policies.
drop policy if exists tenant_all on student_guardians;
create policy admin_all on student_guardians for all to authenticated
  using (is_school_admin() and exists (
    select 1 from students s where s.id = student_id and s.school_id = auth_school_id()
  ))
  with check (is_school_admin() and exists (
    select 1 from students s where s.id = student_id and s.school_id = auth_school_id()
  ));
create policy legacy_non_teacher on student_guardians for all to authenticated
  using (auth_role() in ('parent', 'student') and exists (
    select 1 from students s where s.id = student_id and s.school_id = auth_school_id()
  ))
  with check (auth_role() in ('parent', 'student') and exists (
    select 1 from students s where s.id = student_id and s.school_id = auth_school_id()
  ));
create policy teacher_student_guardians_select on student_guardians for select to authenticated
  using (teacher_has_student(student_id));
