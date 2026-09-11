insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('assignment-files', 'assignment-files', false, 26214400, array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/png','image/jpeg'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create table if not exists assignment_attachments (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references schools(id) on delete cascade,
  assignment_id uuid not null references assignments(id) on delete cascade, file_name text not null, file_url text not null,
  file_size bigint not null check (file_size > 0 and file_size <= 26214400), mime_type text not null, created_at timestamptz not null default now()
);
create index if not exists assignment_attachments_assignment_idx on assignment_attachments(assignment_id);
alter table assignment_attachments enable row level security;
create policy assignment_attachments_tenant_select on assignment_attachments for select to authenticated using (school_id = auth_school_id());
create policy assignment_attachments_staff_insert on assignment_attachments for insert to authenticated with check (school_id = auth_school_id() and auth_role() in ('owner','admin','teacher'));

create policy assignment_files_tenant_read on storage.objects for select to authenticated using (bucket_id = 'assignment-files' and (storage.foldername(name))[1] = auth_school_id()::text);
create policy assignment_files_staff_write on storage.objects for insert to authenticated with check (bucket_id = 'assignment-files' and (storage.foldername(name))[1] = auth_school_id()::text and (storage.foldername(name))[2] = 'assignments' and auth_role() in ('owner','admin','teacher'));
create policy submission_files_student_write on storage.objects for insert to authenticated with check (bucket_id = 'assignment-files' and (storage.foldername(name))[1] = auth_school_id()::text and (storage.foldername(name))[2] = 'submissions' and (storage.foldername(name))[4] = auth.uid()::text and auth_role() = 'student');

create or replace function create_assignment_with_roster(input jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare sid uuid := auth_school_id(); aid uuid; publish boolean := input->>'state' = 'open';
begin
  if auth.uid() is null or auth_role() not in ('owner','admin','teacher') then raise exception 'Only school staff may create assignments'; end if;
  if nullif(trim(input->>'title'),'') is null or (input->>'points')::integer <= 0 then raise exception 'Title and positive points are required'; end if;
  if auth_role() = 'teacher' and not teacher_has_subject((input->>'class_id')::uuid,(input->>'subject_id')::uuid) then raise exception 'Teacher is not assigned to this class and subject'; end if;
  insert into assignments(school_id,class_id,subject_id,title,instructions,due_at,points,state,created_by)
  values(sid,(input->>'class_id')::uuid,(input->>'subject_id')::uuid,trim(input->>'title'),nullif(input->>'instructions',''),nullif(input->>'due_at','')::timestamptz,(input->>'points')::integer,(input->>'state')::assignment_state,auth.uid()) returning id into aid;
  if publish then
    insert into submissions(school_id,assignment_id,student_id,status)
    select sid,aid,s.id,'missing' from students s where s.school_id=sid and s.active and s.class_id=(input->>'class_id')::uuid on conflict(assignment_id,student_id) do nothing;
    insert into notifications(school_id,user_id,type,title,body)
    select distinct sid,g.profile_id,'assignment_published','New assignment: '||(input->>'title'),json_build_object('title',input->>'title')::text
    from students s join student_guardians sg on sg.student_id=s.id join guardians g on g.id=sg.guardian_id
    where s.school_id=sid and s.active and s.class_id=(input->>'class_id')::uuid and g.profile_id is not null;
  end if;
  return aid;
end; $$;
revoke all on function create_assignment_with_roster(jsonb) from public;
grant execute on function create_assignment_with_roster(jsonb) to authenticated;
