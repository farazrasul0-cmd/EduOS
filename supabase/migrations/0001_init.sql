-- ============================================================================
-- EduOS — initial schema
-- Multi-tenant school-management SaaS. Every domain table carries school_id
-- so Row-Level Security (see 0002_rls.sql) can isolate tenants.
-- Money is stored as numeric(12,2) in Bangladeshi Taka (BDT, ৳).
-- ============================================================================

create extension if not exists pgcrypto; -- gen_random_uuid()

-- ---------- Enums ----------------------------------------------------------
create type user_role as enum ('owner', 'admin', 'teacher', 'parent', 'student');
create type app_language as enum ('en', 'bn');
create type attendance_status as enum ('present', 'absent', 'late', 'leave');
create type assignment_state as enum ('draft', 'open', 'closed');
create type submission_status as enum ('in_progress', 'submitted', 'graded', 'missing');
create type exam_state as enum ('draft', 'scheduled', 'published');
create type question_type as enum ('short', 'mcq', 'long');
create type invoice_status as enum ('paid', 'due', 'overdue', 'partial');
create type payment_method as enum ('bkash', 'nagad', 'rocket', 'upay', 'card', 'bank', 'cash');
create type payment_status as enum ('pending', 'success', 'failed', 'refunded');
create type event_type as enum ('exam', 'ptm', 'assignment', 'event', 'holiday', 'meeting', 'class');

-- ---------- updated_at helper ----------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- Tenancy root ---------------------------------------------------
create table schools (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text unique,
  affiliation   text,
  address       text,
  currency      text not null default 'BDT',
  academic_year text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------- Profiles (1:1 with auth.users) ---------------------------------
create table profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  school_id   uuid references schools (id) on delete set null,
  full_name   text not null default '',
  email       text,
  phone       text,
  role        user_role not null default 'teacher',
  avatar_url  text,
  language    app_language not null default 'en',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index profiles_school_idx on profiles (school_id);

-- ---------- Academic structure --------------------------------------------
create table subjects (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references schools (id) on delete cascade,
  name       text not null,
  code       text,
  created_at timestamptz not null default now()
);
create index subjects_school_idx on subjects (school_id);

create table classes (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools (id) on delete cascade,
  name        text not null,                 -- e.g. "7-A"
  grade       text,                          -- e.g. "7"
  teacher_id  uuid references profiles (id) on delete set null, -- class teacher
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index classes_school_idx on classes (school_id);

create table guardians (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references schools (id) on delete cascade,
  profile_id   uuid references profiles (id) on delete set null, -- parent login (optional)
  full_name    text not null,
  email        text,
  phone        text,
  relationship text,
  created_at   timestamptz not null default now()
);
create index guardians_school_idx on guardians (school_id);

create table students (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools (id) on delete cascade,
  class_id    uuid references classes (id) on delete set null,
  profile_id  uuid references profiles (id) on delete set null, -- student login (optional)
  roll_no     text,
  full_name   text not null,
  dob         date,
  avatar_url  text,
  status      text not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (school_id, class_id, roll_no)
);
create index students_school_idx on students (school_id);
create index students_class_idx on students (class_id);

create table student_guardians (
  student_id  uuid not null references students (id) on delete cascade,
  guardian_id uuid not null references guardians (id) on delete cascade,
  is_primary  boolean not null default false,
  primary key (student_id, guardian_id)
);

-- which subject is taught in which class, by which teacher
create table class_subjects (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references schools (id) on delete cascade,
  class_id   uuid not null references classes (id) on delete cascade,
  subject_id uuid not null references subjects (id) on delete cascade,
  teacher_id uuid references profiles (id) on delete set null,
  unique (class_id, subject_id)
);
create index class_subjects_school_idx on class_subjects (school_id);

-- ---------- Timetable ------------------------------------------------------
create table timetable_slots (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools (id) on delete cascade,
  class_id    uuid not null references classes (id) on delete cascade,
  subject_id  uuid references subjects (id) on delete set null,
  teacher_id  uuid references profiles (id) on delete set null,
  day_of_week smallint not null check (day_of_week between 1 and 7), -- 1=Mon
  period      smallint not null,
  start_time  time,
  end_time    time,
  room        text,
  created_at  timestamptz not null default now()
);
create index timetable_school_idx on timetable_slots (school_id);
create index timetable_class_idx on timetable_slots (class_id);

-- ---------- Attendance -----------------------------------------------------
create table attendance_records (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references schools (id) on delete cascade,
  student_id uuid not null references students (id) on delete cascade,
  class_id   uuid references classes (id) on delete set null,
  date       date not null,
  status     attendance_status not null,
  marked_by  uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (student_id, date)
);
create index attendance_school_idx on attendance_records (school_id);
create index attendance_date_idx on attendance_records (school_id, date);

-- ---------- Assignments ----------------------------------------------------
create table assignments (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references schools (id) on delete cascade,
  class_id     uuid references classes (id) on delete set null,
  subject_id   uuid references subjects (id) on delete set null,
  title        text not null,
  instructions text,
  due_at       timestamptz,
  points       integer not null default 0,
  state        assignment_state not null default 'draft',
  created_by   uuid references profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index assignments_school_idx on assignments (school_id);
create index assignments_class_idx on assignments (class_id);

create table submissions (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools (id) on delete cascade,
  assignment_id uuid not null references assignments (id) on delete cascade,
  student_id    uuid not null references students (id) on delete cascade,
  status        submission_status not null default 'missing',
  file_url      text,
  file_name     text,
  late          boolean not null default false,
  submitted_at  timestamptz,
  grade         integer,
  feedback      text,
  graded_by     uuid references profiles (id) on delete set null,
  graded_at     timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (assignment_id, student_id)
);
create index submissions_school_idx on submissions (school_id);
create index submissions_assignment_idx on submissions (assignment_id);

-- ---------- Exams & results ------------------------------------------------
create table exams (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools (id) on delete cascade,
  class_id    uuid references classes (id) on delete set null,
  subject_id  uuid references subjects (id) on delete set null,
  name        text not null,
  exam_date   date,
  total_marks integer not null default 100,
  state       exam_state not null default 'draft',
  created_by  uuid references profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index exams_school_idx on exams (school_id);

create table exam_questions (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools (id) on delete cascade,
  exam_id       uuid not null references exams (id) on delete cascade,
  position      integer not null,
  type          question_type not null,
  prompt        text not null,
  marks         integer not null default 1,
  options       jsonb,        -- for mcq: ["a","b",...]
  correct_index smallint,     -- for mcq
  created_at    timestamptz not null default now()
);
create index exam_questions_exam_idx on exam_questions (exam_id);

create table results (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid not null references schools (id) on delete cascade,
  exam_id        uuid not null references exams (id) on delete cascade,
  student_id     uuid not null references students (id) on delete cascade,
  marks_obtained numeric(6,2),
  grade          text,
  published      boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (exam_id, student_id)
);
create index results_school_idx on results (school_id);

-- ---------- Fees -----------------------------------------------------------
create table fee_plans (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references schools (id) on delete cascade,
  name       text not null,
  amount     numeric(12,2) not null default 0,  -- BDT
  period     text,                              -- e.g. "monthly", "term-2"
  created_at timestamptz not null default now()
);
create index fee_plans_school_idx on fee_plans (school_id);

create table invoices (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools (id) on delete cascade,
  student_id  uuid not null references students (id) on delete cascade,
  fee_plan_id uuid references fee_plans (id) on delete set null,
  invoice_no  text not null,
  amount      numeric(12,2) not null default 0,  -- BDT
  paid_amount numeric(12,2) not null default 0,
  due_date    date,
  status      invoice_status not null default 'due',
  issued_at   timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (school_id, invoice_no)
);
create index invoices_school_idx on invoices (school_id);
create index invoices_student_idx on invoices (student_id);

create table payments (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools (id) on delete cascade,
  invoice_id  uuid not null references invoices (id) on delete cascade,
  amount      numeric(12,2) not null,            -- BDT
  method      payment_method not null,
  status      payment_status not null default 'success',
  reference   text,                              -- gateway/transaction id
  gateway     text,                              -- sslcommerz / aamarpay / manual
  paid_at     timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
create index payments_school_idx on payments (school_id);
create index payments_invoice_idx on payments (invoice_id);

-- ---------- Calendar -------------------------------------------------------
create table calendar_events (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools (id) on delete cascade,
  title       text not null,
  description text,
  type        event_type not null default 'event',
  event_date  date not null,
  event_time  text,
  location    text,
  class_id    uuid references classes (id) on delete set null,
  created_by  uuid references profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);
create index calendar_school_idx on calendar_events (school_id);
create index calendar_date_idx on calendar_events (school_id, event_date);

-- ---------- Messaging ------------------------------------------------------
create table message_threads (
  id              uuid primary key default gen_random_uuid(),
  school_id       uuid not null references schools (id) on delete cascade,
  teacher_id      uuid references profiles (id) on delete set null,
  guardian_id     uuid references guardians (id) on delete set null,
  student_id      uuid references students (id) on delete set null,
  last_message_at timestamptz,
  created_at      timestamptz not null default now()
);
create index threads_school_idx on message_threads (school_id);

create table messages (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references schools (id) on delete cascade,
  thread_id  uuid not null references message_threads (id) on delete cascade,
  sender_id  uuid references profiles (id) on delete set null,
  body       text not null,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index messages_thread_idx on messages (thread_id);

-- ---------- Notifications & audit -----------------------------------------
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references schools (id) on delete cascade,
  user_id    uuid not null references profiles (id) on delete cascade,
  type       text,
  title      text not null,
  body       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on notifications (user_id, read);

create table audit_logs (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid references schools (id) on delete set null,
  actor_id   uuid references profiles (id) on delete set null,
  action     text not null,
  entity     text,
  entity_id  uuid,
  meta       jsonb,
  created_at timestamptz not null default now()
);
create index audit_school_idx on audit_logs (school_id);

-- ---------- updated_at triggers -------------------------------------------
create trigger schools_updated_at      before update on schools      for each row execute function set_updated_at();
create trigger profiles_updated_at     before update on profiles     for each row execute function set_updated_at();
create trigger classes_updated_at      before update on classes      for each row execute function set_updated_at();
create trigger students_updated_at     before update on students     for each row execute function set_updated_at();
create trigger assignments_updated_at  before update on assignments  for each row execute function set_updated_at();
create trigger submissions_updated_at  before update on submissions  for each row execute function set_updated_at();
create trigger exams_updated_at        before update on exams        for each row execute function set_updated_at();
create trigger results_updated_at      before update on results      for each row execute function set_updated_at();
create trigger invoices_updated_at     before update on invoices     for each row execute function set_updated_at();
