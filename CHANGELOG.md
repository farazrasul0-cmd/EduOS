# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Bangladesh MFS payment gateway integration (SSLCommerz / aamarPay / ShurjoPay).
- Local SMS gateway integration with notification outbox worker.
- Vitest and React Testing Library unit & component test coverage.
- Playwright critical path end-to-end test suite.
- SolaimanLipi / Noto Sans Bengali font embedding for PDF export.

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
