-- Thread creation, reliable last-message timestamps, unread state, and realtime.
create unique index if not exists message_threads_participants_uidx
  on message_threads(teacher_id, guardian_id, student_id)
  where teacher_id is not null and guardian_id is not null and student_id is not null;

create or replace function create_message_thread(target_guardian_id uuid, target_student_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare sid uuid := auth_school_id(); tid uuid; role_name user_role := auth_role();
begin
  if role_name not in ('owner','admin','teacher') then raise exception 'not_authorized'; end if;
  if not exists (
    select 1 from student_guardians sg join students s on s.id=sg.student_id join guardians g on g.id=sg.guardian_id
    where sg.student_id=target_student_id and sg.guardian_id=target_guardian_id and s.school_id=sid and g.school_id=sid
  ) then raise exception 'invalid_recipient'; end if;
  if role_name='teacher' and not teacher_has_student(target_student_id) then raise exception 'not_authorized'; end if;
  insert into message_threads(school_id,teacher_id,guardian_id,student_id)
  values(sid,auth.uid(),target_guardian_id,target_student_id)
  on conflict (teacher_id,guardian_id,student_id) where teacher_id is not null and guardian_id is not null and student_id is not null
  do update set school_id=excluded.school_id returning id into tid;
  return tid;
end; $$;

create or replace function touch_message_thread() returns trigger language plpgsql security definer set search_path=public as $$
begin update message_threads set last_message_at=new.created_at where id=new.thread_id; return new; end; $$;
drop trigger if exists messages_touch_thread on messages;
create trigger messages_touch_thread after insert on messages for each row execute function touch_message_thread();

create or replace function mark_thread_read(target_thread_id uuid) returns void
language plpgsql security definer set search_path=public as $$
begin
  if not exists (select 1 from message_threads t where t.id=target_thread_id and t.school_id=auth_school_id()
    and (is_school_admin() or t.teacher_id=auth.uid() or exists(select 1 from guardians g where g.id=t.guardian_id and g.profile_id=auth.uid())))
  then raise exception 'not_authorized'; end if;
  update messages set read_at=now() where thread_id=target_thread_id and sender_id is distinct from auth.uid() and read_at is null;
end; $$;

revoke all on function create_message_thread(uuid,uuid) from public;
revoke all on function mark_thread_read(uuid) from public;
grant execute on function create_message_thread(uuid,uuid) to authenticated;
grant execute on function mark_thread_read(uuid) to authenticated;

do $$ begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='messages') then
    alter publication supabase_realtime add table messages;
  end if;
end $$;
