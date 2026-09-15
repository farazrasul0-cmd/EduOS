# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [1.0.0] - 2026-09-15

### Added - MVP Commercial Production Release
- **Institutional Onboarding & Multi-Tenancy (Phase 2)**: EIIN validation, Board selection, shifts, institutional branding.
- **Student Directory & Profiling (Phase 3)**: Bangladeshi 17-digit birth certificates, guardian profiles, CSV batch import/export.
- **Attendance Management (Phase 4)**: Biometric/RFID compatibility, daily rosters, absence notifications, defaulter warnings.
- **Conflict-Free Timetable & Routine Scheduler (Phase 5)**: Automated slot allocation, teacher clash detection, printable A4 schedule.
- **Homework & Digital Assignments (Phase 6)**: Subject submissions, teacher feedback loop, due-date reminders.
- **Tuition Fees & MFS Payment Reconciliation (Phase 7)**: Monthly billing ledger, arrears tracking, bKash & Nagad reconciliation, vector PDF payment receipts.
- **NCTB Grading & Academic Reporting (Phase 8)**: Continuous Assessment (20%), Summative Exam (80%), GPA 5.0 scale, single & batch PDF report cards.
- **Exam Routine Scheduler (Phase 9)**: Chronological exam schedule matrix, room capacities, A4 exam routine PDF export.
- **Student ID Card Generator (Phase 10)**: CR80 PVC format, dynamic QR codes, batch printing.
- **Public Online Admission Portal (Phase 11)**: External candidate portal, 17-digit birth certificate check, printable admission slip.
- **Library & Book Circulation (Phase 12)**: Dewey Decimal catalog, borrowing ledger, overdue fine calculator, library cards.
- **Staff & Teacher Payroll (Phase 13)**: Gross salary, Provident Fund deductions, Tax TDS, disbursement ledger, payslip PDF.
- **Transfer & Character Certificates (Phase 14)**: Verification tokens, A4 certificate PDF, principal signoff.
- **Hostel & Residential Hall Management (Phase 15)**: Room & bed allocation, meal tokens, gate pass curfew tracking.
- **Admit Cards & Hall Seat Planner (Phase 16)**: Anti-cheating zigzag seating, tuition fee clearance filter, printable admit cards with QR.
- **Class Tabulation Broadsheet (Phase 17)**: CA 20% + Final 80% broadsheet, GPA calculation, A3 broadsheet export.
- **Teacher & Student Leave Management (Phase 18)**: Quotas, multi-role approval workflow, attendance integration.
- **Digital Notice Board & Circulars (Phase 19)**: Institutional circulars, SMS broadcasting, PDF export.
- **Dedicated Parent & Student Portal (Phase 20)**: Child switcher, collegiate attendance status, direct 1-click bKash payment, homework submission, Progress Dossier.
- **Online MCQ Quiz & Model Test Engine (Phase 21)**: Live timed exam runner, negative marking, NCTB question banks, auto-evaluation, Diagnostic Performance Analysis PDF.
- **Localization**: 100% bilingual parity between English and Bengali (বাংলা).
- **Test Coverage**: 53 test suites, 311 passing automated tests with 0 lint errors.

---

## [0.1.0] - 2026-09-11

### Added
- **Initial Architecture & App Shell**: Vite 8 + React 19 + TypeScript frontend with Tailwind CSS v4 design tokens from `eduos-design-system`.
- **Database & Row-Level Security**: 22 ordered Postgres migrations covering schools, profiles, classes, students, guardians, attendance, assignments, exams, results, fee plans, invoices, timetable slots, and audit logs.
- **Bilingual Localization**: Full parity English and বাংলা (`bn`) translations via `i18next` with language switch persistence.
- **Bangladeshi Currency & Formatting**: Native BDT (`৳`) formatting (`formatTaka`), Bangladesh date and number conventions.
- **Core Operations Workflows**:
  - **Students & Guardians**: Roster management, student detail tabs, CSV import with validation, photo upload.
  - **Attendance**: Daily class attendance recording, absence alerts to guardians, duplicate prevention.
  - **Fees & Invoicing**: Invoicing, atomic partial/full payment reconciliation, HTML receipts, balance search.
  - **Exams & Results**: Schedule CRUD, A4 question paper export, Bangladesh grade & GPA 5.0 calculation, atomic publication, A4 PDF report cards.
  - **Assignments**: Private storage bucket, student file submissions, teacher grading & feedback.
  - **Timetable & Calendar**: Weekly grid with server-side room/teacher/class clash prevention, event calendar.
  - **Messaging & Alerts**: Realtime parent chat threads, notification outbox queue with exponential retry scheduling.
  - **Settings**: Profile, School info, Class CRUD, Billing subscription tiers, Integrations registry.
- **Security Tab Implementation**:
  - Password update with $\ge 8$ characters validation and Supabase Auth integration.
  - Active session revocation ("Sign out everywhere") via `supabase.auth.signOut({ scope: 'others' })`.
  - Two-factor authentication (TOTP) enrollment with secret key copy and 6-digit challenge verification.
  - Configurable session timeout and sign-in alert preference toggles.
- **Global Search & Command Palette**: Interactive `Cmd+K` / `Ctrl+K` search modal supporting Students, Invoices, Exams, and Navigation pages with keyboard selection.
- **Help & Support Modal**: Interactive help modal with quick operational guides, keyboard shortcuts overview, and direct Dhaka support contacts.
- **Toast Feedback System**: Accessible notification toasts (`success`, `danger`, `info`) adhering to design system voice rules.
- **Demo Mode Banner**: In-app notice when operating in the demo school with a single-click action to create a real school.

### Security
- Tenant isolation enforced in Postgres via Row-Level Security (`school_id = auth_school_id()`).
- Append-only audit logging on attendance, results, invoices, and profile updates.
- Avatar storage writes restricted to school-scoped directories.
- Guarded database RPCs for onboarding and sensitive mutations.
