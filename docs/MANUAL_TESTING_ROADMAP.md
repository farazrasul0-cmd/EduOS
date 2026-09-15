# EduOS End-to-End Manual Testing Roadmap & Production Validation Guide

```text
  ███████╗██████╗ ██╗   ██╗ ██████╗ ███████╗    ████████╗███████╗███████╗████████╗██╗███╗   ██╗ ██████╗ 
  ██╔════╝██╔══██╗██║   ██║██╔═══██╗██╔════╝    ╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝██║████╗  ██║██╔════╝ 
  █████╗  ██║  ██║██║   ██║██║   ██║███████╗       ██║   █████╗  ███████╗   ██║   ██║██╔██╗ ██║██║  ███╗
  ██╔══╝  ██║  ██║██║   ██║██║   ██║╚════██║       ██║   ██╔══╝  ╚════██║   ██║   ██║██║╚██╗██║██║   ██║
  ███████╗██████╔╝╚██████╔╝╚██████╔╝███████║       ██║   ███████╗███████║   ██║   ██║██║ ╚████║╚██████╔╝
  ╚══════╝╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝       ╚═╝   ╚══════╝╚══════╝   ╚═╝   ╚═╝╚═╝  ╚═══╝ ╚═════╝ 
```

---

## 📋 Document Metadata

| Attribute | Specification |
| :--- | :--- |
| **System Name** | **EduOS (এডু ওএস)** — Bilingual Multi-Tenant School Management SaaS |
| **Document Version** | `1.0.0` (Aligned with Release `v1.0.0-mvp`) |
| **Testing Purpose** | Systematic, zero-assumption, phase-by-phase manual verification and acceptance testing across all 21 modules, security boundaries, database migrations, and PDF engines prior to commercial production launch. |
| **Target Audience** | Manual QA Testers, Institutional Administrators, DevOps Engineers, and Product Owners. |
| **Host Environment** | Windows 11 / Windows Server with PowerShell 7+ (or Windows PowerShell 5.1), Node.js `v20.x` / `v24.x`, npm `v10+`, Git `v2.40+`. |
| **Application Stack** | React 19, TypeScript 5.9, Vite 8, Tailwind CSS v4, TanStack Query v5, i18next, Supabase Managed PostgreSQL 16. |
| **Target Deployment** | Cloudflare Pages / Vercel / Netlify (Frontend) + Supabase Enterprise / Self-Hosted PostgreSQL 16 (Backend). |

---

# SECTION 1: Human Testing Mode Instructions

> [!IMPORTANT]
> **STRICT STOP-ON-FAILURE PROTOCOL**
> 
> As a human tester, you must follow this manual testing guide **strictly phase-by-phase**, beginning at **Phase 0**. 
> - **Never skip a phase.**
> - **Never assume a prior phase succeeded.**
> - If any command exits with an error code, if the UI behaves unexpectedly, if a network request fails with status code $\ge 400$, or if an unhandled JavaScript error appears in the DevTools console:
>   1. **STOP TESTING IMMEDIATELY.** Do not attempt the next step.
>   2. Copy the exact terminal output or capture a screenshot of the browser UI.
>   3. Open your browser Developer Tools (`F12`), navigate to the **Console** and **Network** tabs, and copy the relevant error traces.
>   4. Open [`docs/BUG_REPORT_TEMPLATE.md`](./BUG_REPORT_TEMPLATE.md), fill out the bug report, and send it directly to **Codex** for diagnosis and repair.
>   5. Wait for Codex to provide the fix, verify the resolution, and only then proceed.

---

### 🔍 How to Collect Diagnostic Logs During Manual Testing

#### 1. Terminal & PowerShell Command Failures
When a command fails in your PowerShell terminal:
- Select the entire terminal block including the command you ran and the exact error output.
- Run `echo $LASTEXITCODE` in PowerShell to check the exit status.
- Note your current working directory (`pwd`).

#### 2. Browser Console Inspection (F12)
- Press `F12` (or `Ctrl + Shift + I`) in Google Chrome, Microsoft Edge, or Firefox.
- Switch to the **Console** tab.
- Click the filter dropdown and ensure **Errors** and **Warnings** are checked.
- Right-click any red error message and select **Copy message** or **Copy stack trace**.

#### 3. Network Request Inspection (Fetch / XHR)
- In the same `F12` DevTools window, switch to the **Network** tab.
- Click the **Fetch/XHR** filter button.
- Reproduce the action (e.g. clicking "Save Attendance", "Pay via bKash", or "Publish Exam").
- Locate any request rendered in **red text** (HTTP 400, 401, 403, 404, 409, 422, 500).
- Click on the failed request, inspect:
  - **Headers**: Request URL and Request Method.
  - **Payload**: Form data or JSON sent to the server.
  - **Response**: The JSON error message returned by Supabase or the backend API.

#### 4. PostgreSQL / Supabase Log Collection
If an operation fails with a database exception:
- Open your Supabase Dashboard (`https://supabase.com/dashboard/project/<your-project-id>`).
- Navigate to **Logs** $\rightarrow$ **Postgres Logs**.
- Search for errors matching `42501` (permission denied / RLS policy violation), `23505` (unique constraint violation), or `23503` (foreign key violation).

---

# SECTION 2: Testing Status Tracking Table

Use this master checklist to monitor test execution status across all phases:

| Phase | System Under Test | Status | Date Verified | Blocking Issues | Signoff |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **Phase 0** | Development Environment & Host System Validation | `[NOT STARTED]` | — | None | — |
| **Phase A** | Frontend Application, Dev Server & Build Integrity | `[NOT STARTED]` | — | None | — |
| **Phase B** | Supabase Database Schema, Migrations & Seed Validation | `[NOT STARTED]` | — | None | — |
| **Phase C** | Authentication, Session Lifecycle & RBAC Roles | `[NOT STARTED]` | — | None | — |
| **Phase D** | Multi-Tenant Isolation & Row-Level Security (RLS) Pentesting | `[NOT STARTED]` | — | None | — |
| **Phase E** | Core Academic & Administrative Modules (E.01 – E.21) | `[NOT STARTED]` | — | None | — |
| **Phase F** | Official Publication-Grade Vector PDF Generation Engine | `[NOT STARTED]` | — | None | — |
| **Phase G** | Bilingual Localization (English & বাংলা Parity) | `[NOT STARTED]` | — | None | — |
| **Phase H** | Mobile Financial Services (bKash & Nagad MFS Reconciliation) | `[NOT STARTED]` | — | None | — |
| **Phase I** | Dedicated Parent & Student Portal End-to-End | `[NOT STARTED]` | — | None | — |
| **Phase J** | Notification Dispatch, Bell Dropdown & SMS Broadcasting | `[NOT STARTED]` | — | None | — |
| **Phase K** | Performance, Stress, Large Roster & Offline Resilience | `[NOT STARTED]` | — | None | — |
| **Phase L** | Security Boundary, URL Guard & RLS Pentesting | `[NOT STARTED]` | — | None | — |
| **Phase M** | Final Production Build, Clean Lint & Release Signoff | `[NOT STARTED]` | — | None | — |

*Legend: `[NOT STARTED]`, `[IN PROGRESS]`, `[BLOCKED]`, `[PASSED]`.*

---

# PHASE 0: Development Environment Validation

### Objective
Ensure the local machine has the requisite toolchain, correct execution runtime, intact package dependencies, and open network ports required to run and test EduOS without environment-induced anomalies.

### Execution Steps (PowerShell)

#### Step 0.1: Validate Core Runtime Versions
Run the following commands in PowerShell:
```powershell
node --version
npm --version
git --version
```
- [ ] **Expected Output**:
  - `node`: `v20.x.x`, `v22.x.x`, or `v24.x.x` (e.g. `v24.14.1`).
  - `npm`: `10.x.x` or higher.
  - `git`: `git version 2.x.x`.
- **Failure Symptom**: `'node' is not recognized as an internal or external command`.
- **Fix**: Install Node.js LTS from [nodejs.org](https://nodejs.org) and ensure `C:\Program Files\nodejs\` is in your System `PATH`.

#### Step 0.2: Validate Git Working Tree & Branch
```powershell
git status
git branch --show-current
```
- [ ] **Expected Output**:
  - Branch should be `develop` or `main`.
  - `nothing to commit, working tree clean`.
- **Failure Symptom**: Uncommitted changes or detached HEAD.
- **Fix**: Run `git checkout develop` and `git pull origin develop`.

#### Step 0.3: Validate Environment File Configuration
```powershell
Test-Path .env
Get-Content .env
```
- [ ] **Expected Output**:
  - File exists (`True`).
  - Must contain:
    ```ini
    VITE_SUPABASE_URL=https://your-project-ref.supabase.co
    VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
    ```
- **Failure Symptom**: `Test-Path .env` returns `False`.
- **Fix**: Copy `.env.example` to `.env` using `Copy-Item .env.example .env` and supply valid Supabase credentials.

#### Step 0.4: Validate Port Availability (5173 & 4173)
```powershell
Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
Get-NetTCPConnection -LocalPort 4173 -ErrorAction SilentlyContinue
```
- [ ] **Expected Output**: Empty return (port is free).
- **Failure Symptom**: Port shows state `Listen` bound to an existing PID.
- **Fix**: Stop the competing process: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess -Force`.

---

# PHASE A: Frontend Application, Dev Server & Build Integrity

### Objective
Verify that the React 19 + TypeScript + Vite frontend installs cleanly, starts up in local development mode without terminal or console errors, routes correctly, and compiles an optimized production bundle.

### Execution Steps (PowerShell)

#### Step A.1: Clean Dependency Audit
```powershell
npm install
npm ls --depth=0
```
- [ ] **Expected Output**: `audited 288 packages...`, zero missing peer dependency fatal errors.

#### Step A.2: Start Vite Development Server
```powershell
npm run dev
```
- [ ] **Expected Output**:
  ```text
  VITE v8.0.x  ready in ~250 ms
  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ```

#### Step A.3: Browser Smoke Test & Console Verification
1. Open Google Chrome or Microsoft Edge and navigate to `http://localhost:5173`.
2. Press `F12` to open DevTools $\rightarrow$ **Console**.
- [ ] **Expected Result**:
  - The application shell renders without a blank white screen.
  - No red uncaught exceptions in the console (e.g. `TypeError`, `ReferenceError`, `Failed to resolve module`).
  - The navigation bar, sidebar, and theme toggle are visible and interactive.

#### Step A.4: Production Build Verification
In a separate terminal window, test the static build pipeline:
```powershell
npm run build
```
- [ ] **Expected Output**:
  - `tsc -b && vite build` completes with exit code 0.
  - `dist/index.html` and `dist/assets/*.js` files generated in under 5 seconds.
  - Zero TypeScript compilation errors (`TS2304`, `TS2322`, etc.).

#### Step A.5: Production Preview Verification
```powershell
npm run preview
```
- [ ] **Expected Output**:
  - Server starts at `http://localhost:4173/`.
  - Navigate to `http://localhost:4173/` in your browser.
  - Confirm pages load without chunk-loading or asset 404 errors.

---

# PHASE B: Supabase Database Schema, Migrations & Seed Validation

### Objective
Verify that all 23 PostgreSQL database migrations are successfully applied, all tables exist with appropriate constraints and Row-Level Security (RLS) enabled, and the default demo institution data is queryable.

### Execution Steps (Supabase SQL Editor / PowerShell)

#### Step B.1: Verify All 23 Migration Schemas
Confirm that the following 23 migrations in `supabase/migrations/` have been executed on your Supabase project:
1. `0001_init.sql` (Core tables: schools, profiles, classes, students, guardians, attendance, invoices, exams, marks)
2. `0002_rls.sql` (Tenant isolation RLS policies & auth triggers)
3. `0003_storage.sql` (Avatar and document storage buckets)
4. `0004_secure_onboarding.sql` (Guarded institutional onboarding RPC)
5. `0005_teacher_rls.sql` (Teacher class assignment policies)
6. `0006_parent_rls.sql` (Guardian-student relationship RLS)
7. `0007_student_rls.sql` (Student self-service access RLS)
8. `0008_avatar_storage_rls.sql` (Tenant-scoped avatar upload restrictions)
9. `0009_sensitive_audit.sql` (Immutable append-only audit log trigger)
10. `0010_guardian_linking.sql` (Guardian verification and primary contact flags)
11. `0011_guardian_invites.sql` (One-time guardian portal invitation tokens)
12. `0012_attendance_parent_alerts.sql` (Absence notification queue trigger)
13. `0013_fee_transactions.sql` (MFS transaction ledger & payment reconciliation)
14. `0014_atomic_results_publication.sql` (Term result publication state machine)
15. `0015_exam_schedule_crud.sql` (Examination routine & hall slot tables)
16. `0016_assignment_files_and_publish.sql` (Homework file submission storage)
17. `0017_timetable_crud.sql` (Timetable slot conflict detection)
18. `0018_message_threads_realtime.sql` (Parent-teacher chat threads)
19. `0019_notification_delivery.sql` (Multi-channel notification outbox)
20. `0020_class_management.sql` (Class section, medium, and shift configuration)
21. `0021_school_subscriptions.sql` (Institutional billing tiers & limits)
22. `0022_school_integrations.sql` (bKash, Nagad, and SMS gateway credentials)
23. `0023_sms_gateway_integration.sql` (Bangladeshi SMS gateway dispatch queue)

#### Step B.2: Execute Schema & Table Verification Query
Open the **SQL Editor** in your Supabase Dashboard and run:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```
- [ ] **Expected Output**:
  Must include at least the following 28 tables:
  `admissions`, `assignments`, `assignment_submissions`, `attendance`, `audit_logs`, `classes`, `exams`, `fee_plans`, `guardians`, `invoices`, `leave_applications`, `leave_quotas`, `library_books`, `book_loans`, `marks`, `messages`, `notices`, `notifications`, `payments`, `payroll_profiles`, `profiles`, `quizzes`, `quiz_questions`, `quiz_attempts`, `salary_disbursements`, `schools`, `students`, `timetable_slots`.

#### Step B.3: Verify Row-Level Security (RLS) is Enabled on All Tables
Run in the Supabase SQL Editor:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```
- [ ] **Expected Output**: Every table must show `rowsecurity = true`. If any table shows `false`, RLS is disabled and tenant isolation is compromised.

#### Step B.4: Verify Demo Seed Data
```sql
SELECT id, name, slug, affiliation FROM public.schools WHERE id = '11111111-1111-1111-1111-111111111111';
SELECT count(*) as student_count FROM public.students WHERE school_id = '11111111-1111-1111-1111-111111111111';
SELECT count(*) as invoice_count FROM public.invoices WHERE school_id = '11111111-1111-1111-1111-111111111111';
```
- [ ] **Expected Output**:
  - School name: `Riverside Public School`.
  - `student_count`: $\ge 12$.
  - `invoice_count`: $\ge 8$.

---

# PHASE C: Authentication, Session Lifecycle & RBAC Roles

### Objective
Validate user registration, login, logout, session persistence across page refreshes, and strict enforcement of Role-Based Access Control (RBAC) across all 6 supported roles.

### Supported User Personas:
1. **SuperAdmin** (`super_admin`): Multi-tenant governance.
2. **Principal / Headmaster** (`owner` / `admin`): Full institutional authority.
3. **Teacher** (`teacher`): Academic records, daily attendance, gradebook.
4. **Accountant** (`accountant` / `admin`): Tuition fee invoicing, MFS reconciliation, payroll.
5. **Parent / Guardian** (`parent`): Multi-child monitoring, bKash fee clearance.
6. **Student** (`student`): Homework submissions, online MCQ quizzes, admit cards.

---

### Step C.1: User Login Workflow
1. Navigate to `http://localhost:5173/login`.
2. Inspect the login form. Verify the presence of:
   - Email address input
   - Password input
   - "Remember me" / Session checkbox
   - Language switch toggle (English / বাংলা)
3. Enter valid credentials for the institutional administrator:
   - Email: `admin@riverside.edu.bd` (or your configured admin user)
   - Password: `<your-password>`
4. Click **Sign In**.
- [ ] **Expected Result**:
  - Redirects smoothly to `/` (Dashboard).
  - Topbar displays user avatar and role badge (`Principal` / `Owner`).
  - No error toast displayed.

---

### Step C.2: Session Persistence Test
1. While logged in on `/`, press `F5` to hard refresh the browser.
2. Open a new tab in the same browser and navigate to `http://localhost:5173/students`.
- [ ] **Expected Result**:
  - The session is maintained without kicking the user back to `/login`.
  - The active school context remains set to `Riverside Public School`.

---

### Step C.3: User Logout Workflow
1. Click the user profile dropdown in the top-right corner of the topbar.
2. Click **Sign Out (লগআউট)**.
- [ ] **Expected Result**:
  - User session tokens are purged from `localStorage` / `sessionStorage`.
  - Browser redirects immediately to `/login`.
  - Attempting to press the browser **Back** button does not restore the authenticated dashboard.

---

### Step C.4: Route Protection & Role Escalation Pentest
1. Ensure you are logged out.
2. Manually enter the protected route `http://localhost:5173/payroll` in your browser address bar and press Enter.
- [ ] **Expected Result**:
  - `RequireAuth` intercepts the request and forces redirect to `/login`.
3. Now log in as a **Teacher** or **Student**.
4. Once logged in, attempt to navigate directly to `/admissions` (restricted to `['owner', 'admin']`).
- [ ] **Expected Result**:
  - `RequireRole` blocks access.
  - Displays an unauthorized access warning or redirects cleanly to `/` without crashing.

---

# PHASE D: Multi-Tenant Isolation & Row-Level Security (RLS) Pentesting

### Objective
Validate that the database physically isolates institutional data between different schools. Prove that an authenticated user of School A cannot read, query, update, or delete records belonging to School B.

---

### Step D.1: Prepare Two Distinct Institutional Tenants
Execute in Supabase SQL Editor:
```sql
-- Ensure School A exists (Riverside Public School)
SELECT id, name FROM public.schools WHERE id = '11111111-1111-1111-1111-111111111111';

-- Create School B (Chittagong Model Academy) if not present
INSERT INTO public.schools (id, name, slug, affiliation, address, currency, academic_year)
VALUES ('22222222-2222-2222-2222-222222222222', 'Chittagong Model Academy', 'chittagong-model', 
        'Chittagong Education Board', 'Nasirabad, Chittagong', 'BDT', '2025 – 26')
ON CONFLICT (id) DO NOTHING;

-- Insert a secret student in School B
INSERT INTO public.students (id, school_id, roll_no, full_name, status)
VALUES ('b9999999-9999-9999-9999-999999999999', '22222222-2222-2222-2222-222222222222', 'SECRET-01', 'School-B Secret Student', 'active')
ON CONFLICT (id) DO NOTHING;
```

---

### Step D.2: Attempt Cross-Tenant Read via Web Application
1. Log into EduOS as an administrator attached to **School A** (`11111111-1111-1111-1111-111111111111`).
2. Navigate to `/students`.
3. Open the search bar and search for `School-B Secret Student` or `SECRET-01`.
- [ ] **Expected Result**:
  - Search returns 0 results.
  - The secret student from School B is completely invisible.

---

### Step D.3: Attempt Cross-Tenant Query via Direct SQL Simulation
In the Supabase SQL Editor, simulate an authenticated session of a School A user:
```sql
-- Simulate authentication as School A teacher/admin
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "user-school-a-uuid", "role": "authenticated"}';

-- Attempt to read students from School B directly
SELECT * FROM public.students WHERE school_id = '22222222-2222-2222-2222-222222222222';
```
- [ ] **Expected Result**:
  - The query returns **0 rows**.
  - Row-Level Security automatically suppresses any rows where `school_id != auth_school_id()`.

---

# PHASE E: Core Academic & Administrative Modules Testing

Test each of the 21 individual modules in sequence. Follow the exact step-by-step procedures:

---

### Module E.01: Core SaaS Shell, Topbar & Global Command Palette
- **Route**: `/`
- **Objective**: Verify that the global application shell, responsive navigation, notifications dropdown, and `Ctrl + K` global command palette function without defects.
- **Steps**:
  1. Open `/`.
  2. Press `Ctrl + K` (or `Cmd + K` on macOS).
  3. The Global Search Modal should pop open immediately with focus on the search input.
  4. Type `Tahmid`. Notice that student records are retrieved dynamically.
  5. Use the arrow keys `↓` and `↑` to navigate highlighted items and press `Enter`.
  6. Click the Notification Bell icon in the topbar.
  7. Toggle between Dark Theme and Light Theme using the theme switcher.
- [ ] **Expected Result**:
  - Search modal closes and routes directly to `/students/a0000000-0000-0000-0000-000000000001`.
  - Notification panel opens cleanly.
  - Theme switches instantly between dark background and light background without flashing.
- **Failure Symptoms**: `Ctrl + K` does not open dialog; theme toggle causes unstyled components.
- **Debug Info Needed**: Console logs, active theme CSS class on `<html>`.

---

### Module E.02: Institutional Onboarding (`/onboarding`)
- **Route**: `/onboarding`
- **Objective**: Verify multi-step institutional onboarding wizard, mandatory 6-digit EIIN validation, board selection, and shift setup.
- **Steps**:
  1. Navigate to `/onboarding`.
  2. Enter School Name: `Motijheel Model High School`.
  3. Enter Invalid EIIN: `123` (only 3 digits). Attempt to proceed to Step 2.
  4. Verify validation error: *"EIIN must be exactly 6 digits"* (ইআইআইএন অবশ্যই ৬ সংখ্যার হতে হবে).
  5. Enter Valid 6-Digit EIIN: `108421`.
  6. Select Education Board: `Dhaka Education Board` (ঢাকা শিক্ষা বোর্ড).
  7. Select Medium: `Bangla Medium`, Shifts: `Morning & Day`.
  8. Click **Next** $\rightarrow$ Configure Classes $\rightarrow$ Submit.
- [ ] **Expected Result**:
  - Validation blocks invalid EIIN.
  - Successful submission saves institutional configuration and navigates to Dashboard with new institution profile active.
- **Failure Symptoms**: Wizard permits invalid EIIN; submission hangs on Step 4.

---

### Module E.03: Student Directory & 17-Digit BRN Validation (`/students`)
- **Route**: `/students`
- **Objective**: Verify student enrollment roster, Bangladeshi 17-digit birth registration validation, guardian phone validation, and CSV export.
- **Steps**:
  1. Open `/students`.
  2. Click **Add New Student (নতুন শিক্ষার্থী যোগ করুন)**.
  3. Enter Full Name: `Farhan Chowdhury`.
  4. Enter Class: `Class 7-A`, Roll: `7A-15`.
  5. Enter Invalid Birth Certificate: `2008123456` (10 digits).
  6. Observe error: *"Birth Registration Number must be exactly 17 digits"* (জন্ম নিবন্ধন নম্বর অবশ্যই ১৭ সংখ্যার হতে হবে).
  7. Correct Birth Certificate to: `20081912026100142` (17 digits).
  8. Enter Guardian Phone: `01711223344`.
  9. Click **Save Student**.
  10. Filter table by `Class 7-A` and search `Farhan`.
  11. Click **Export CSV**.
- [ ] **Expected Result**:
  - Validation requires exactly 17 digits.
  - Newly added student appears in table with status `Active`.
  - CSV file downloads containing correct columns (`id, roll_no, full_name, brn, guardian_phone`).
- **Failure Symptoms**: 17-digit validation accepts alphanumeric characters; CSV exports blank file.

---

### Module E.04: Attendance Management & Defaulter Detection (`/attendance`)
- **Route**: `/attendance`
- **Objective**: Validate daily attendance marking, absent notification queue, and automatic `<75%` collegiate defaulter alert flags.
- **Steps**:
  1. Open `/attendance`.
  2. Select Class: `Class 7-A`, Date: Today.
  3. Notice student roster loads with default status `Present (উপস্থিত)`.
  4. Toggle Roll `7A-03` to `Absent (অনুপস্থিত)`.
  5. Toggle Roll `7A-05` to `Late (বিলম্ব)`.
  6. Click **Save Attendance (হাজিরা সংরক্ষণ করুন)**.
  7. Switch to the **Defaulters Summary** tab.
- [ ] **Expected Result**:
  - Green success toast confirms: *"Attendance recorded successfully"* (হাজিরা সফলভাবে সংরক্ষিত হয়েছে).
  - Defaulter tab highlights students below $75\%$ collegiate threshold with warning badges.
  - Notification trigger queues an SMS alert for the guardian of Roll `7A-03`.
- **Failure Symptoms**: Attendance resets after page refresh; saving multiple times creates duplicate records.

---

### Module E.05: Class Timetable & Routine Scheduler (`/timetable`)
- **Route**: `/timetable`
- **Objective**: Verify weekly schedule grid, conflict-free teacher/room slot allocation, and printable routine export.
- **Steps**:
  1. Open `/timetable`.
  2. Select Class: `Class 7-A`.
  3. Click **Add Period Slot** for Monday Period 2 (10:00 AM – 10:45 AM).
  4. Assign Teacher: `Mr. Rafiqul Islam`, Subject: `Mathematics`, Room: `Room 201`.
  5. Attempt to schedule the same teacher `Mr. Rafiqul Islam` in `Class 7-B` at the exact same time slot on Monday.
  6. Observe clash detector response.
  7. Click **Download Class Routine PDF**.
- [ ] **Expected Result**:
  - System flags teacher scheduling clash: *"Teacher is already assigned to Class 7-A during this period"*.
  - Clean Vector A4 Class Routine PDF downloads with institutional letterhead and daily matrix.
- **Failure Symptoms**: Double-booking allowed without conflict warning; PDF output misaligned.

---

### Module E.06: Homework & Digital Assignments (`/assignments`)
- **Route**: `/assignments`
- **Objective**: Verify assignment publication, due date reminders, student file uploads, and teacher feedback.
- **Steps**:
  1. Open `/assignments`.
  2. Click **Create Assignment (নতুন অ্যাসাইনমেন্ট)**.
  3. Enter Title: `Higher Math Chapter 4 Exercises`.
  4. Select Class: `Class 7-A`, Subject: `Mathematics`.
  5. Set Due Date: 3 days from now.
  6. Click **Publish Assignment**.
  7. Switch user to student `Tahmid Rahman` and open `/assignments`.
  8. Click **Submit Solution**, attach a sample PDF/image, and submit.
- [ ] **Expected Result**:
  - Assignment appears in teacher's list and student's dashboard.
  - Student can upload submission file successfully.
  - Teacher view shows Submission Count: `1 Submitted`.
- **Failure Symptoms**: File upload fails with storage RLS error; due date displays invalid date format.

---

### Module E.07: Tuition Fee Invoicing & MFS Reconciliation (`/fees`)
- **Route**: `/fees`
- **Objective**: Verify monthly tuition fee generation, arrears calculation, bKash/Nagad TrxID verification, and Vector payment receipt generation.
- **Steps**:
  1. Open `/fees`.
  2. Review summary KPI cards: *Total Collectible*, *Total Collected*, *Outstanding Arrears*.
  3. Locate invoice `INV-2026-103` (Student: Rafiq Islam, Amount: ৳4,500, Status: `Overdue`).
  4. Click **Collect Payment (ফি গ্রহণ)**.
  5. Select Payment Method: `bKash`.
  6. Enter Mobile Number: `01712000003`.
  7. Enter Transaction ID: `BKASH-9X8721QA`.
  8. Click **Confirm Payment (পেমেন্ট নিশ্চিত করুন)**.
  9. Click **Download Receipt (রসিদ ডাউনলোড)**.
- [ ] **Expected Result**:
  - Invoice status changes immediately from `Overdue` $\rightarrow$ `Paid` (পরিশোধিত).
  - Outstanding arrears balance decreases by ৳4,500.
  - Vector PDF payment receipt downloads displaying school logo, BDT amount (`৳ ৪,৫০০`), TrxID, and payment date.
- **Failure Symptoms**: Status remains unpaid; receipt downloads empty blank page.

---

### Module E.08: NCTB Results & Grading System (`/results`)
- **Route**: `/results`
- **Objective**: Validate Continuous Assessment (CA 20%) + Summative Final (80%) calculation, NCTB GPA 5.0 cutoffs, merit ranking, and single/batch report card PDFs.
- **Steps**:
  1. Open `/results`.
  2. Select Class: `Class 7-A`, Exam: `Annual Examination 2026`.
  3. Open Gradebook table. For a selected student:
     - Enter CA Score: `18` (out of 20).
     - Enter Final CQ Score: `56` (out of 70).
     - Enter Final MCQ Score: `24` (out of 30).
  4. Verify total score computation: $18 + 56 + 24 = 98$ ($98\% \rightarrow \text{Grade Point } 5.00, \text{Letter Grade } A+$).
  5. Switch to **Report Cards** tab.
  6. Click **Download Report Card PDF** for Student 1.
  7. Click **Batch Download Class Report Cards**.
- [ ] **Expected Result**:
  - GPA 5.0 scales correctly per official NCTB grading boundaries.
  - High-res Vector A4 Student Progress Report Card downloads with marks breakdown, GPA, attendance count, teacher remarks, and signature blocks.
- **Failure Symptoms**: Failing grade ($< 33\%$) computes positive GPA instead of 0.00; batch download crashes browser memory.

---

### Module E.09: Examination Routine Scheduler (`/exams`)
- **Route**: `/exams`
- **Objective**: Verify chronological examination schedule matrix, room capacity limits, and A4 exam routine PDF export.
- **Steps**:
  1. Open `/exams`.
  2. Switch to **Exam Routine & Schedule** tab.
  3. Filter by Class: `Class 7-A`.
  4. Verify chronological ordering of scheduled subjects:
     - Day 1: Mathematics (09:00 AM – 12:00 PM)
     - Day 2: Science (09:00 AM – 12:00 PM)
     - Day 3: English (09:00 AM – 12:00 PM)
  5. Click **Download Exam Routine PDF**.
  6. Click **Export Routine CSV**.
- [ ] **Expected Result**:
  - Routine table lists dates, subject codes, rooms, and invigilator names cleanly.
  - Printable Vector A4 Routine PDF downloads ready for notice board posting.
- **Failure Symptoms**: Exam dates out of chronological order; room capacity overbooking allowed without warning.

---

### Module E.10: Student ID Card Studio (`/students` ID Modal)
- **Route**: `/students`
- **Objective**: Verify CR80 PVC standard card rendering (front & back), dynamic QR code generation, single card download, and batch sheet printing.
- **Steps**:
  1. Open `/students`.
  2. Select 3 students using table checkboxes.
  3. Floating batch action bar appears at the bottom.
  4. Click **Generate ID Cards (আইডি কার্ড তৈরি করুন)**.
  5. In the interactive modal:
     - Verify Front View shows: Student Photo, Full Name, Class, Roll, Blood Group, Emergency Contact, and School EIIN letterhead.
     - Click **Flip Card** to view Back View: Principal Signature, Rules, and dynamic QR code.
  6. Scan the QR code using a smartphone camera or QR reader app.
  7. Click **Download Printable A4 Sheet**.
- [ ] **Expected Result**:
  - QR code decodes directly to student validation payload (`eduos://verify/student/<id>`).
  - Vector PDF sheet renders cards in grid format ready for duplex PVC plastic printing.
- **Failure Symptoms**: Cards do not flip; QR code unreadable; layout overflows page bounds.

---

### Module E.11: Public Online Admission Portal (`/apply`)
- **Route**: `/apply` (Public Candidate Route)
- **Objective**: Verify public candidate self-service application form, 17-digit birth certificate check, application submission, and Admission Confirmation Slip PDF.
- **Steps**:
  1. Open a new Incognito browser window and navigate to `http://localhost:5173/apply`.
  2. Confirm page loads without requiring login.
  3. Fill out the application:
     - Applicant Name: `Zubaida Karim`
     - Desired Class: `Class 6`
     - Birth Certificate: `20121912026100889` (17 digits)
     - Father Name: `Karim Ullah`, Phone: `01819998877`
  4. Click **Submit Application (আবেদন জমা দিন)**.
  5. On the confirmation screen, click **Download Admission Slip**.
- [ ] **Expected Result**:
  - Application submits and generates unique tracking number (e.g. `ADM-2026-8491`).
  - Downloadable Admission Slip PDF contains application details, fee instruction, and entrance exam room details.
  - Record appears immediately in school admin portal at `/admissions`.
- **Failure Symptoms**: Public route redirects to `/login`; 17-digit BRN validation fails on valid input.

---

### Module E.12: Library & Book Circulation Management (`/library`)
- **Route**: `/library`
- **Objective**: Verify Dewey Decimal book cataloging, book borrowing ledger, loan return workflow, and automated overdue fine calculator.
- **Steps**:
  1. Open `/library`.
  2. Search for book title: `An Introduction to Computer Science`.
  3. Click **Issue Book (বই ইস্যু করুন)**.
  4. Select Student: `Tahmid Rahman (7A-01)`. Set Due Date: 7 days ago (to test overdue fine).
  5. Confirm issue.
  6. Switch to **Borrowing Ledger** tab.
  7. Locate the newly issued book $\rightarrow$ Click **Return Book**.
- [ ] **Expected Result**:
  - Overdue fine calculator computes fine at institutional rate (e.g. ৳5 per day $\times$ 7 days = ৳35).
  - Return confirmation logs fine payment and updates book inventory available count.
- **Failure Symptoms**: Borrowing count does not decrement inventory; overdue days calculate negative number.

---

### Module E.13: Staff & Teacher Payroll System (`/payroll`)
- **Route**: `/payroll`
- **Objective**: Validate teacher salary profiles, basic pay, allowances, Provident Fund (PF) deductions, Tax TDS, and monthly payslip PDF generation.
- **Steps**:
  1. Open `/payroll`.
  2. Switch to **Staff Salary Profiles** tab.
  3. Verify teacher profile:
     - Basic Pay: ৳35,000
     - House Rent Allowance (40%): ৳14,000
     - Medical Allowance: ৳1,500
     - Gross Salary: $35,000 + 14,000 + 1,500 = \text{৳} 50,500$
     - Provident Fund Deduction (10%): -৳3,500
     - Net Payable: $50,500 - 3,500 = \text{৳} 47,000$
  4. Switch to **Salary Disbursement Ledger** $\rightarrow$ Click **Generate Monthly Sheet**.
  5. Click **Download Payslip PDF** for selected teacher.
- [ ] **Expected Result**:
  - Net salary math computes with $100\%$ accuracy.
  - Professional Vector A4 Teacher Salary Payslip PDF downloads with earnings breakdown, deduction breakdown, and bank account details.
- **Failure Symptoms**: Deductions added instead of subtracted; PDF salary figures do not match UI ledger.

---

### Module E.14: Transfer & Character Certificate Issuance (`/certificates`)
- **Route**: `/certificates`
- **Objective**: Verify official Transfer Certificate (TC) and Character Certificate generation with anti-tamper verification tokens and principal signoff blocks.
- **Steps**:
  1. Open `/certificates`.
  2. Click **Issue Certificate (সনদপত্র প্রদান করুন)**.
  3. Select Certificate Type: `Transfer Certificate (ছাড়পত্র)`.
  4. Select Student: `Ayesha Siddiqua (7A-06)`.
  5. Select Reason for Leaving: `Guardian relocation to Chittagong`.
  6. Enter General Conduct: `Satisfactory / Exemplary`.
  7. Click **Generate & Sign Certificate**.
- [ ] **Expected Result**:
  - System generates unique anti-tamper token: `TC-2026-XXXX-VERIFIED`.
  - Verified Vector A4 Certificate PDF downloads featuring ornate border, institutional seal, date of birth, conduct testimonial, and Headmaster signature line.
- **Failure Symptoms**: Verification token missing; student academic history incomplete.

---

### Module E.15: Hostel & Residential Hall Management (`/hostel`)
- **Route**: `/hostel`
- **Objective**: Verify building/room/bed allocation, meal mess tokens, and student gate pass curfew tracking.
- **Steps**:
  1. Open `/hostel`.
  2. Review Hostel Occupancy KPI card (*e.g. 84 Beds Occupied / 100 Capacity*).
  3. Switch to **Gate Pass & Curfew Log** tab.
  4. Click **Issue Gate Pass (গেট পাস ইস্যু)**.
  5. Select Student: `Sakib Hasan`, Destination: `Home (Weekend visit)`.
  6. Set Departure Time: Today 04:00 PM, Expected Return: Sunday 06:00 PM.
  7. Confirm Gate Pass issuance $\rightarrow$ Click **Download Gate Pass PDF**.
- [ ] **Expected Result**:
  - Student gate pass status marked as `Out of Campus (ক্যাম্পাসের বাইরে)`.
  - Printable Gate Pass slip downloads with warden signature and emergency guardian contact.
- **Failure Symptoms**: Room allows over-allocation past bed capacity; gate pass return time cannot be recorded.

---

### Module E.16: Admit Card Desk & Anti-Cheating Seat Planner (`/admit-cards`)
- **Route**: `/admit-cards`
- **Objective**: Validate automatic tuition fee clearance filter (defaulters blocked) and anti-cheating zigzag exam hall seating arrangement.
- **Steps**:
  1. Open `/admit-cards`.
  2. Select Exam: `Annual Examination 2026`, Class: `Class 7-A`.
  3. In the examinee list, locate student with overdue tuition fees (`Rafiq Islam - 7A-03`).
  4. Verify that Admit Card generation is **Blocked** with status badge: `Fee Clearance Required (বেতন বকেয়া)`.
  5. Switch to **Hall Seat Planner** tab.
  6. Click **Generate Anti-Cheating Seating**.
  7. Verify seating matrix applies a **zigzag pattern** (ensuring students of the same class do not sit next to each other on consecutive benches).
  8. Click **Download Hall Door Seating Notice PDF**.
- [ ] **Expected Result**:
  - Defaulters cannot generate admit cards until fee waiver or payment is recorded.
  - Clean exam hall seat plan PDF generated for notice board and bench stickers.
- **Failure Symptoms**: Fee defaulter receives admit card; consecutive same-class students placed side-by-side.

---

### Module E.17: Class Tabulation Broadsheet Engine (`/results` Broadsheet Tab)
- **Route**: `/results` $\rightarrow$ Tabulation Sheet Tab
- **Objective**: Validate full-class academic broadsheet matrix displaying CA 20% + Final 80% across all subjects with A3 Landscape vector PDF export.
- **Steps**:
  1. Open `/results` and switch to the **Tabulation Broadsheet** tab.
  2. Select Class: `Class 7-A`, Exam: `Annual Examination 2026`.
  3. Verify the wide matrix table renders:
     - Columns: Roll, Student Name, Subject 1 (CA/Final/Total/GP/Grade), Subject 2, Subject 3, Subject 4, Grand Total, Cumulative GPA, Merit Position, Status (`PASSED` / `FAILED`).
  4. Verify student with any failed compulsory subject ($< 33$) is evaluated with `Term GPA = 0.00` and `Status = FAILED`.
  5. Click **Download A3 Broadsheet PDF (এ৩ ব্রডশিট ডাউনলোড)**.
- [ ] **Expected Result**:
  - Broad table renders without horizontal overflow clipping.
  - Vector A3 Landscape PDF ($1190 \times 842\text{ pt}$) downloads, formatted per Bangladesh Education Board broadsheet standards.
- **Failure Symptoms**: A3 PDF text cut off; subject columns misaligned with student rows.

---

### Module E.18: Staff & Student Leave Management Workflow (`/leave`)
- **Route**: `/leave`
- **Objective**: Verify casual/medical/earned leave quotas, multi-role approval workflow, and automated attendance roster integration.
- **Steps**:
  1. Open `/leave`.
  2. Click **Apply for Leave (ছুটির আবেদন)**.
  3. Select Leave Type: `Medical Leave (চিকিৎসা ছুটি)`.
  4. Enter Date Range: Tomorrow to Day After Tomorrow (2 days).
  5. Enter Reason: `Seasonal fever and doctor checkup`.
  6. Submit application.
  7. As Principal/Admin, view the **Pending Applications** ledger.
  8. Click **Approve (অনুমোদন)**.
  9. Navigate to `/attendance` for tomorrow's date.
- [ ] **Expected Result**:
  - Leave application transitions from `Pending` $\rightarrow$ `Approved`.
  - Quota balance decrements by 2 days.
  - On `/attendance`, the student's status for those dates automatically reflects `On Leave (ছুটিতে)`.
- **Failure Symptoms**: Approving leave does not update attendance roster; quota allows negative balances.

---

### Module E.19: Digital Notice Board, Circulars & SMS Broadcasting (`/notices`)
- **Route**: `/notices`
- **Objective**: Verify institutional notice publishing, priority pinning, PDF circular export, and SMS broadcast queue dispatch.
- **Steps**:
  1. Open `/notices`.
  2. Click **Publish Notice (নতুন নোটিশ প্রকাশ করুন)**.
  3. Enter Title: `Urgent: School Closed Due to Cyclone Warning`.
  4. Select Category: `Emergency (জরুরি)`, Priority: `High / Pinned`.
  5. Check **Broadcast via SMS to Guardians (অভিভাবকদের এসএমএস পাঠান)**.
  6. Enter Body text in Bangla: `ঘূর্ণিঝড় সতর্কতার কারণে আগামীকল বিদ্যালয় বন্ধ থাকবে।`.
  7. Click **Publish & Broadcast**.
  8. Click **Download Official Circular PDF**.
- [ ] **Expected Result**:
  - Notice appears pinned at the top of the notice board with an emergency red badge.
  - Outbox queues SMS dispatches to all registered guardian mobile numbers.
  - Printable Vector A4 Circular PDF downloads with institutional header and official seal.
- **Failure Symptoms**: Notice does not pin; SMS broadcast fails with unhandled API error.

---

### Module E.20: Dedicated Parent & Student Portal (`/portal`)
- **Route**: `/portal`
- **Objective**: Verify independent parent/student dashboard, multi-child switcher, collegiate standing gauge, 1-click bKash payment, and Progress Dossier PDF download.
- **Steps**:
  1. Log into EduOS as a Parent with two enrolled children (`Tanvir Rahman` and `Sadia Rahman`).
  2. Navigate to `/portal`.
  3. Verify top tab contains the **Child Switcher**:
     - Child 1: `Tanvir Rahman (Class 10 - Science)`
     - Child 2: `Sadia Rahman (Class 7 - A)`
  4. Switch active profile to `Sadia Rahman`.
  5. Verify that all 4 summary KPI cards update dynamically:
     - Attendance Rate: `91.2% (Collegiate)`
     - Outstanding Fees: `৳ 1,850`
     - Latest GPA: `5.00 (Grade A+)`
     - Active Homework Tasks: `2`
  6. Click **Pay Fees via bKash**. Complete payment simulation.
  7. Click **Download Progress Dossier PDF**.
- [ ] **Expected Result**:
  - Switching children updates all KPIs, fee bills, and homework without page reload.
  - 1-click bKash payment settles outstanding dues and displays updated balance: `৳ 0 (Paid)`.
  - Comprehensive Progress Dossier PDF downloads summarizing academic, attendance, and fee history.
- **Failure Symptoms**: Child switcher fails to re-render stats; fee payment throws cross-child permission error.

---

### Module E.21: Online MCQ Quiz & Model Test Assessment Engine (`/quizzes`)
- **Route**: `/quizzes`
- **Objective**: Verify timed online MCQ test runner, NCTB question banks, Bangladesh negative marking penalties (-0.25/-0.50), automated grading, and Diagnostic Performance Analysis PDF.
- **Steps**:
  1. Open `/quizzes`.
  2. Locate test: `General Science Model Test 2026 (SSC Prep)`.
  3. Review quiz parameters: 20 Questions, 25 Minutes, Negative Marking: `-0.25 per wrong answer`.
  4. Click **Start Test (পরীক্ষা শুরু করুন)**.
  5. Verify active live quiz runner:
     - Real-time countdown timer counting down.
     - Question navigator palette indicates answered (green), unanswered (gray), and current (blue).
  6. Select answers for 10 questions:
     - 8 correct answers
     - 2 incorrect answers
     - 10 unanswered questions
  7. Click **Submit Quiz (পরীক্ষা জমা দিন)**.
  8. Review auto-graded diagnostic breakdown:
     - Correct Points: $8 \times 1.0 = 8.0$
     - Negative Deduction: $2 \times 0.25 = 0.50$
     - Final Score: $8.0 - 0.50 = 7.50$ (out of 20.00).
  9. Click **Download Diagnostic PDF Report**.
- [ ] **Expected Result**:
  - Negative marking penalty computes with exact mathematical precision.
  - Diagnostic Performance Report PDF downloads displaying item-by-item question analysis, accuracy rate, examiner remarks, and signature lines.
- **Failure Symptoms**: Timer freeze on tab switch; negative marking deducts full marks instead of configured 0.25 penalty.

---

# PHASE F: Publication-Grade Vector PDF Generation Engine

### Objective
Verify that all 7 official document generators produce pixel-perfect, vector-crisp PDF documents conforming to physical printing standards (CR80 PVC, A4 Portrait, and A3 Landscape) with flawless Bengali font glyph rendering.

### Document Test Matrix:
| # | Document Under Test | Dimensions | Target Media | Expected Content Verification |
| :-: | :--- | :--- | :--- | :--- |
| **F.1** | **Student ID Card** | $54 \times 86\text{ mm}$ | CR80 PVC Plastic | High-res photo, roll, blood group, scannable QR token |
| **F.2** | **Exam Admit Card** | $595 \times 842\text{ pt}$ (A4) | Offset / Laser Paper | Fee clearance seal, exam schedule, room/seat number |
| **F.3** | **Student Report Card** | $595 \times 842\text{ pt}$ (A4) | 120gsm Parchment | NCTB GPA 5.0, CA 20% + 80%, signature blocks |
| **F.4** | **Tabulation Broadsheet** | $1190 \times 842\text{ pt}$ (A3) | A3 Ledger Sheet | Wide subject matrix, merit rank, board formatting |
| **F.5** | **Transfer Certificate (TC)**| $595 \times 842\text{ pt}$ (A4) | Institutional Bond | Ornate border, anti-tamper token, official seal |
| **F.6** | **Tuition Fee Receipt** | Half A4 / Thermal | Counter Receipt | BDT currency (`৳`), invoice no, bKash TrxID, timestamp |
| **F.7** | **Quiz Diagnostic Report**| $595 \times 842\text{ pt}$ (A4) | A4 Laser Paper | Question analysis, negative deduction rate, accuracy |

### Execution Steps:
1. Trigger generation for each of the 7 document types above.
2. Open each downloaded PDF in Adobe Acrobat Reader or Google Chrome PDF Viewer.
3. Zoom to **300%** magnification.
- [ ] **Verification Checklist**:
  - [ ] **Vector Sharpness**: Typography and borders remain ultra-crisp without pixelation.
  - [ ] **Bengali Font Glyphs**: Complex Bengali conjunct letters (যুক্তাক্ষর — যেমন: ক্ষ, ঙ্ক, ঙ্গ, জ্ঞ, শ্চ, ষ্ট, ণ্ড) render cleanly without disjointed character boxes.
  - [ ] **Barcode & QR Scannability**: QR codes scan instantly with smartphone camera.
  - [ ] **Page Boundary Compliance**: No text overflows outside printable margins.

---

# PHASE G: Bilingual Localization (English & বাংলা Parity)

### Objective
Validate that EduOS provides 100% bilingual parity between English and Bengali without missing translation keys, unlocalized raw strings, or broken number/currency formatting.

### Execution Steps:

#### Step G.1: Automated Localization Parity Test
Run in PowerShell:
```powershell
npx vitest run tests/i18n-parity.test.ts
```
- [ ] **Expected Output**:
  - `4 passed (4)` — 100% key parity between `src/i18n/locales/en.json` and `src/i18n/locales/bn.json`.
  - Zero missing or dangling translation keys.

#### Step G.2: Live Language Switcher Verification
1. Open the application at `/`.
2. Click the language toggle button in the topbar to switch to **বাংলা (Bengali)**.
3. Verify every navigation item, table header, button, and summary card updates instantly to natural Bengali without requiring a page refresh.
4. Verify numbers: Arabic numerals (`1, 2, 3, 4, 5`) transform into Bengali numerals (`১, ২, ৩, ৪, ৫`).
5. Verify currency: All money figures display with the Bangladeshi Taka symbol (`৳`), e.g., `৳ ৪,৫০০`.
6. Click the toggle again to switch back to **English**.
- [ ] **Expected Result**:
  - Instant transition without UI layout shift.
  - No raw translation keys visible on screen (e.g. `fees.dashboard.title` or `undefined`).

---

# PHASE H: Mobile Financial Services (MFS) Payment & Gateway Validation

### Objective
Verify that mobile money payments (bKash and Nagad) validate mobile wallet phone numbers, check alphanumeric transaction IDs (TrxID), prevent duplicate transactions (idempotency), and correctly reconcile outstanding tuition balances.

### Test Scenarios:

#### Scenario H.1: Valid bKash Payment Simulation
1. Navigate to `/fees`. Select an overdue invoice of ৳3,500.
2. Select Channel: `bKash`.
3. Enter Phone: `01711000001`.
4. Enter Valid TrxID: `BKASH-8A91F032`.
5. Click **Submit**.
- [ ] **Expected Result**: Invoice changes to `Paid`; transaction record logged in `payments` table with status `success`.

#### Scenario H.2: Invalid Bangladeshi Phone Format
1. Select another overdue invoice.
2. Enter Phone: `1234567` (invalid non-Bangladeshi format).
- [ ] **Expected Result**: Validation blocks submission: *"Please enter a valid 11-digit Bangladeshi mobile number (+8801[3-9]...)"*.

#### Scenario H.3: Duplicate TrxID Prevention (Idempotency)
1. Select another overdue invoice.
2. Enter the same TrxID used previously: `BKASH-8A91F032`.
- [ ] **Expected Result**: System rejects transaction: *"Transaction ID already exists in payment ledger"*.

---

# PHASE I: Dedicated Parent & Student Portal End-to-End

### Objective
Verify that the dedicated parent/student portal provides seamless switching between siblings, renders accurate collegiate attendance standing, enables fee payments, and allows homework solution submissions.

### Test Steps:
1. Log into `/portal` as a parent with 2 enrolled children.
2. Observe the **Collegiate Status Gauge**:
   - $\ge 75\%$: Displayed in green with badge `Collegiate (পরীক্ষার যোগ্য)`.
   - $60\% - 74\%$: Displayed in amber with badge `Non-Collegiate (জরিমানা প্রযোজ্য)`.
   - $< 60\%$: Displayed in red with badge `Discollegiate (পরীক্ষায় অযোগ্য)`.
3. Click the child tab switcher to switch to the second child.
4. Verify that the attendance gauge, class routine, and tuition dues instantly switch to the second child's records.
5. In the homework section, click **Submit Solution** and upload a response file.
- [ ] **Expected Result**:
  - Multi-child switching works without session disruption.
  - Correct collegiate badge renders according to official Board attendance thresholds.
  - Solution submission displays confirmation timestamp.

---

# PHASE J: Notification Dispatch, Bell Dropdown & SMS Broadcasting

### Objective
Verify that critical operational events automatically generate in-app bell notifications and dispatch SMS broadcasts via the Bangladeshi SMS gateway adapter.

### Event Trigger Matrix:
| Triggering Event | Recipient | In-App Bell Notification | Outbox SMS Broadcast |
| :--- | :--- | :---: | :---: |
| **Student marked Absent** | Guardian | ✅ *"Your child [Name] was absent today"* | ✅ *"Dear Guardian, [Name] is absent on [Date]"* |
| **Tuition Invoice Paid** | Guardian | ✅ *"Payment of ৳[Amount] received"* | ✅ *"Received ৳[Amount] via bKash. TrxID: [TrxID]"* |
| **New Assignment Posted**| Students | ✅ *"New task in [Subject]: [Title]"* | Optional |
| **Exam Result Published** | Guardian & Student | ✅ *"Annual Exam 2026 results published"*| ✅ *"Results out. [Name] achieved GPA [GPA]"* |
| **Emergency Circular** | All Guardians | ✅ *"Emergency: School closed tomorrow"* | ✅ Urgent Priority Broadcast |

### Test Steps:
1. Trigger an absence for Roll `7A-01` on `/attendance`.
2. Log in as the guardian of `7A-01`.
3. Inspect the topbar bell icon: verify the unread counter increments (`1`).
4. Click the bell: verify the notification text and timestamp are accurate.
5. In Supabase SQL Editor, verify the SMS outbox record:
   ```sql
   SELECT * FROM public.notifications WHERE channel = 'sms' ORDER BY created_at DESC LIMIT 5;
   ```
- [ ] **Expected Result**: Notification record exists with status `queued` or `sent`.

---

# PHASE K: Performance, Stress, Large Roster & Offline Resilience

### Objective
Validate that the platform maintains high responsiveness under large student rosters, executes sub-100ms client searches, and degrades gracefully with an offline detection banner when network connectivity drops.

### Test Scenarios:

#### Scenario K.1: Large Student Roster Filtering
1. Navigate to `/students`.
2. In the table search bar, type random single characters rapidly (`a`, `b`, `k`, `m`).
- [ ] **Expected Result**: Table filters rows smoothly without UI lag or frame dropping ($< 50\text{ms}$ filter response).

#### Scenario K.2: Global Search (`Ctrl + K`) Response Time
1. Press `Ctrl + K`.
2. Type `INV`.
- [ ] **Expected Result**: Invoices and student matches appear in under $100\text{ms}$.

#### Scenario K.3: Offline Network Disconnection Simulation
1. Press `F12` $\rightarrow$ switch to the **Network** tab.
2. In the Throttling dropdown, change `No throttling` to **Offline**.
3. Observe the top of the browser viewport.
- [ ] **Expected Result**:
  - The **Offline Warning Banner** slides in immediately at the top of the screen:
    *"You are currently offline. Changes will sync automatically when your connection is restored."* (আপনি অফলাইনে আছেন। সংযোগ পুনরায় স্থাপিত হলে ডাটা সিঙ্ক হবে।)
4. Re-enable network in DevTools (`No throttling`).
- [ ] **Expected Result**:
  - The offline banner dismisses automatically.

---

# PHASE L: Security Boundary, URL Guard & RLS Pentesting

### Objective
Perform security penetration testing to confirm that common web vulnerabilities (direct object reference, privilege escalation, SQL injection, and unauthorized API mutations) are blocked.

### Pentest Test Cases:

#### Case L.1: Direct URL Ingestion without Authentication
```powershell
# Attempt to curl protected API/route without Bearer JWT
curl -I http://localhost:5173/api/students
```
- [ ] **Expected Result**: Returns `401 Unauthorized` or redirects to `/login`.

#### Case L.2: Privilege Escalation (Teacher attempting Admin RPC)
Log into browser console as a Teacher and execute:
```javascript
// Attempt to modify school EIIN or delete a class
const { error } = await supabase.from('schools').update({ name: 'Hacked School' }).eq('id', '11111111-1111-1111-1111-111111111111');
console.log(error);
```
- [ ] **Expected Result**: Error object returned with code `42501` (permission denied for table `schools`).

#### Case L.3: SQL Injection String Testing in Search Bars
1. In the student directory search bar, type:
   `' OR '1'='1' --`
2. In the invoice search bar, type:
   `admin'; DROP TABLE students; --`
- [ ] **Expected Result**:
  - System treats the string literally.
  - Returns 0 matching results without throwing an unhandled database error.

---

# PHASE M: Production Build, Clean Lint & Final Commercial Signoff

### Objective
Execute the complete quality gate checklist to provide official signoff for the commercial MVP release.

### Execution Commands:

```powershell
# 1. Run all automated unit and component test suites
npm test

# 2. Run static analysis & ESLint verification
npm run lint

# 3. Verify TypeScript type-checking and production bundle compilation
npm run build

# 4. Verify 100% translation key parity
npx vitest run tests/i18n-parity.test.ts
```

### Signoff Criteria Checklist:
- [ ] **Vitest Test Suite**: 53 test files passed, 311 / 311 tests passing (100%).
- [ ] **ESLint Static Analysis**: 0 errors, 0 warnings across all files.
- [ ] **Production Build**: Clean compilation in under 5 seconds with zero TypeScript errors.
- [ ] **Translation Parity**: 100% key-for-key parity between `en.json` and `bn.json`.
- [ ] **Git Synchronization**: Working tree clean, branches `develop` and `main` synchronized with tag `v1.0.0-mvp`.

---

# SECTION 18: Troubleshooting & Diagnostic Matrix

| Error Message / Symptom | Possible Cause | Diagnostic Command (PowerShell / SQL) | Solution |
| :--- | :--- | :--- | :--- |
| **`Port 5173 is already in use`** | A prior Vite instance is running in the background. | `Get-NetTCPConnection -LocalPort 5173` | Run `Stop-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess -Force`. |
| **`Invalid API key or URL`** | `.env` file is missing or contains invalid Supabase keys. | `Get-Content .env` | Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` match your Supabase project. |
| **`new row violates row-level security policy (42501)`** | Active user does not belong to the school or lacks the required role. | `SELECT id, school_id, role FROM profiles WHERE id = auth.uid();` | Update profile in Supabase: `UPDATE profiles SET school_id = '11111111-1111-1111-1111-111111111111', role = 'owner' WHERE id = auth.uid();` |
| **`Blank white screen on load`** | Uncaught runtime error during module import or route evaluation. | Open `F12` DevTools $\rightarrow$ **Console**. | Inspect stack trace. Run `npm run build` to uncover hidden TypeScript or syntax defects. |
| **`PDF generation downloads empty file`** | jsPDF canvas rendering error or missing DOM element. | Check DevTools Console for `jsPDF` or `html2canvas` errors. | Ensure target container has rendered and dimensions are $> 0$ before triggering download. |
| **`Missing translation key (e.g. 'fees.title')`** | Translation key exists in `en.json` but missing from `bn.json` (or vice versa). | `npx vitest run tests/i18n-parity.test.ts` | Add the missing key with identical nesting to both `src/i18n/locales/en.json` and `bn.json`. |
| **`bKash payment fails with 400 Bad Request`** | Invalid phone number format or duplicate TrxID. | Inspect Network tab $\rightarrow$ Payload for `/api/fees/pay`. | Ensure phone matches `+8801[3-9]\d{8}` and TrxID is unique. |
| **`Git push rejected by remote`** | Local branch is out of sync with `origin`. | `git status ; git fetch origin` | Run `git pull --rebase origin <branch>` before pushing. |

---

<div align="center">
  <sub>EduOS v1.0.0 End-to-End Manual Testing Roadmap & Production Validation Guide • Engineered for Bangladesh Education SaaS</sub>
</div>
