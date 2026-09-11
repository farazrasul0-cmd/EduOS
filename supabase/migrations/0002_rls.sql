-- ============================================================================
-- EduOS — Row-Level Security & auth wiring
-- Tenant isolation: a row is visible only to members of its school.
-- Helper functions are SECURITY DEFINER so they read profiles without
-- triggering RLS recursion inside the policies that call them.
-- ============================================================================

-- ---------- Auth context helpers ------------------------------------------
create or replace function auth_school_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select school_id from profiles where id = auth.uid();
$$;

create or replace function auth_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

-- ---------- Create a profile automatically on sign-up ----------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- schools --------------------------------------------------------
alter table schools enable row level security;

create policy schools_select on schools
  for select to authenticated
  using (id = auth_school_id());

-- Onboarding: any authenticated user may create a school (then links their profile).
create policy schools_insert on schools
  for insert to authenticated
  with check (true);

create policy schools_update on schools
  for update to authenticated
  using (id = auth_school_id() and auth_role() in ('owner', 'admin'))
  with check (id = auth_school_id() and auth_role() in ('owner', 'admin'));

-- ---------- profiles -------------------------------------------------------
alter table profiles enable row level security;

create policy profiles_select on profiles
  for select to authenticated
  using (id = auth.uid() or school_id = auth_school_id());

create policy profiles_insert on profiles
  for insert to authenticated
  with check (id = auth.uid());

create policy profiles_update on profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------- Generic per-tenant tables -------------------------------------
-- One FOR ALL policy (select/insert/update/delete) scoped to the caller's school.
-- Role-specific tightening (e.g. parents only their child) comes in a later phase.
do $$
declare
  t text;
begin
  foreach t in array array[
    'subjects', 'classes', 'guardians', 'students', 'class_subjects',
    'timetable_slots', 'attendance_records', 'assignments', 'submissions',
    'exams', 'exam_questions', 'results', 'fee_plans', 'invoices', 'payments',
    'calendar_events', 'message_threads', 'messages', 'audit_logs'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
    execute format(
      'create policy tenant_all on %I for all to authenticated '
      'using (school_id = auth_school_id()) '
      'with check (school_id = auth_school_id());',
      t
    );
  end loop;
end $$;

-- ---------- student_guardians (join table, no school_id) -------------------
alter table student_guardians enable row level security;

create policy tenant_all on student_guardians
  for all to authenticated
  using (exists (select 1 from students s where s.id = student_id and s.school_id = auth_school_id()))
  with check (exists (select 1 from students s where s.id = student_id and s.school_id = auth_school_id()));

-- ---------- notifications (per-user, within tenant) ------------------------
alter table notifications enable row level security;

create policy notifications_own on notifications
  for all to authenticated
  using (user_id = auth.uid() and school_id = auth_school_id())
  with check (user_id = auth.uid() and school_id = auth_school_id());
