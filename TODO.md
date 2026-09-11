# EduOS — TODO (living checklist)

Authoritative backlog, audited against the repository on 2026-07-18. Work
top-to-bottom within each priority and update immediately after each task.
Definition of done: implementation + proportional tests/verification +
`npm run build` + `npm run lint` green + completion date/evidence recorded here.

## ✅ Done
- Scaffold (Vite + React + TS), design tokens, Tailwind v4, routing, app shell.
- i18n English + বাংলা, persisted toggle; all 11 pages built (mock data).
- Supabase schema + RLS + seed applied & verified on the live project.
- Auth (sign up / sign in) + onboarding (join demo / create school) + route guards.
- Topbar user menu (sign out) + sidebar live school name.
- **Live pages:** Students, Fees, Attendance.

## 🔭 Pages still on mock → wire to live DB (in order)
- [x] 1. **Exams** — list from `exams` (+subject, class avg from `results`); AI builder tab stays mock UI. *(done 2026-06-12)*
- [x] 2. **Results** — gradebook (dynamic subject pivot) + enter-marks upsert to `results`. *(done 2026-06-12)*
- [x] 3. **Assignments** — live list + detail (roster from students×submissions), grade-saving updates `submissions`, New-assignment modal inserts (draft/publish). Attachments stay local until step 9. *(done 2026-06-12)*
- [x] 4. **Dashboard KPIs** — live aggregates (students, attendance % from latest saved day, pending ৳, scheduled exams) + fee donut + per-day attendance chart. Activity/What's-next feeds stay sample until notifications (Phase 5). *(done 2026-06-12)*
- [x] 5. **Timetable** — weekly grid + KPIs from `timetable_slots` (joined class/subject). *(done 2026-06-12)*
- [x] 6. **Calendar** — month grid + sidebar from `calendar_events`. *(done 2026-06-12)*
- [x] 7. **Parent messages** — live threads/conversation, sending works (sender = signed-in user), sidebar stats computed per student. Shared-docs list stays sample. *(done 2026-06-12)*
- [x] 8. **Settings** — profile + school tabs load & save to DB; classes tab live with real counts. Notifications/billing/integrations/security stay local until those systems exist. *(done 2026-06-12)*

- [x] 11. **Notifications system** — bell dropdown + Topbar unread count + Dashboard activity feed all live from the `notifications` table. Events emitted on: fee marked paid, attendance saved, assignment published, results published, student added. Rows store `type` + JSON params so text re-localizes (EN/বাংলা) at render time; mark-all-read works. *(done 2026-06-12)*

## 🧩 Cross-cutting
- [x] 9. Student photo upload — `avatars` bucket created on live project (public-read, authed-write; `0003_storage.sql`); add-student uploads and saves `students.avatar_url`; Avatar renders photos. *(done 2026-06-12)*
- [x] 10. Route-level code-splitting — all pages lazy + vendor chunks (react/supabase/i18n/router); largest chunk 229 kB, warning gone. *(done 2026-06-12)*
- [ ] 11. Per-role RLS refinement (teacher/parent/student scopes).
  - [x] Block direct `profiles.role` / `school_id` changes; move create-school and demo-join onboarding into guarded server RPCs. *(done 2026-07-18; migration `0004_secure_onboarding.sql`)*
  - [x] Add teacher access policies limited to assigned classes/subjects. *(done 2026-07-18; migration `0005_teacher_rls.sql`)*
  - [x] Add parent access policies limited to linked children and message threads. *(done 2026-07-18; migration `0006_parent_rls.sql`)*
  - [x] Add student access policies limited to their own academic records, including submission grading-field protection. *(done 2026-07-18; migration `0007_student_rls.sql`)*
  - [ ] Add automated cross-role and cross-tenant denial tests.
- [ ] 12. Generate exact DB types (`npm run db:types`) — needs Docker; until then use `src/types/models.ts`.

## P0 — Security and safe deployment

- [x] Apply migrations `0004_secure_onboarding.sql` through `0009_sensitive_audit.sql` to the live Supabase project and verify the security helper functions/profile assignment. Local runner discovers all ordered migrations automatically. *(done 2026-07-18)*
- [x] Restrict `avatars` Storage writes/updates/deletes to owner/admin users and the caller's `{school_id}/` path. *(done 2026-07-18; migration `0008_avatar_storage_rls.sql`)*
- [ ] Remove shared demo-owner mutation risk: give demo sessions isolated data or a read-only/resettable demo role.
- [ ] Add role-aware route/action guards so the UI hides operations RLS will reject.
  - [x] Filter navigation, protect restricted routes, hide fees from teachers, and hide school/classes/billing/integrations settings from non-admin roles. *(done 2026-07-18)*
  - [x] Hide assignment creation/grading, exam creation/AI/editing, and result entry/publication controls from parent/student roles. *(done 2026-07-18)*
  - [ ] Audit remaining shared-page actions as each currently inert workflow is implemented.
- [ ] Add database tests for cross-tenant isolation, self-role escalation, teacher class boundaries, parent-child boundaries, and student self-only access.
- [x] Add append-only database audit logging for attendance, results, invoices/payments, students, assignments/submissions, and membership/role changes. *(done 2026-07-18; migration `0009_sensitive_audit.sql`)*
- [ ] Rotate the previously shared database password and document secret rotation without storing credentials in the repository.
- [ ] Review public handling of children's profile photos and decide whether signed/private URLs are required.

## P1 — Complete existing product flows

- [x] Students: add a live detail/profile route with attendance, fee, assignment, and published-result history. *(done 2026-07-18)*
- [x] Students: complete roster management. *(done 2026-07-30)*
  - [x] Implement owner/admin editing of core student details and recoverable archiving. *(done 2026-07-18)*
  - [x] Implement transactional guardian creation/reuse, linking, primary-contact selection, and live guardian display. *(done 2026-07-18; migration `0010_guardian_linking.sql`)*
  - [x] Implement Supabase passwordless guardian email invitations, unique-email parent membership claiming, existing-user claiming, and portal-link status. *(done 2026-07-30; migration `0011_guardian_invites.sql`)*
  - [x] Add shared Zod validation for student/guardian forms plus PNG/JPEG and 5 MB avatar enforcement with bilingual errors. *(done 2026-07-18)*
  - [x] Add CSV import with quoted-field parsing, preview, class/row validation, live/file duplicate handling, bulk insert, and downloadable error report. *(done 2026-07-18)*
- [x] Attendance: added previous/next/date navigation, saved-day history with CSV export, all four statuses, real linked-guardian portal alerts, duplicate-save prevention, visible mutation errors, and four focused logic tests. *(done 2026-07-30; migration `0012_attendance_parent_alerts.sql` applied and verified live)*
- [x] Fees: added live student/invoice search, status filtering and CSV export; atomic fee-plan/invoice creation; locked, idempotent partial/full payment reconciliation; payment history; downloadable HTML receipts; bilingual forms/errors; and focused balance/search tests. *(done 2026-07-30; migration `0013_fee_transactions.sql` applied and both RPCs verified live)*
- [x] Results: added Bangladesh grade/GPA rules, strict mark validation, complete-roster publication confirmation, atomic server-side publishing, live per-student report cards, gradebook CSV export, and real A4 PDF report-card downloads. Three grading/PDF tests pass and a sample PDF was rendered and visually verified. *(done 2026-07-30; migration `0014_atomic_results_publication.sql` applied and verified live)*
- [x] Exams: added bilingual create/edit/delete scheduling modals, class/subject/date/marks/state validation, teacher-assignment authorization, published/result-linked deletion protection, per-exam database-question loading with fallback draft questions, and real A4 question-paper PDF export. The PDF test passes and a sample was rendered and visually verified. *(done 2026-07-30; migration `0015_exam_schedule_crud.sql` applied and both RPCs verified live)*
- [x] Assignments: added a private 25 MB assignment-file bucket with PDF/DOCX/PNG/JPEG validation, teacher attachment uploads, signed submission-file access, student submission uploads, guardian publish notifications, and transactional assignment/roster creation. *(done 2026-07-30; migration `0016_assignment_files_and_publish.sql` applied and the RPC, attachment table, and bucket verified live)*
- [x] Timetable: added role-aware create/edit/delete controls directly on the weekly grid, teacher/room/time fields, validation, and atomic server-side class, teacher, and room clash detection with race protection. *(done 2026-08-01; migration `0017_timetable_crud.sql` applied and both RPCs verified live)*
- [x] Calendar: added role-aware event creation plus edit/delete controls, with title/type/class/date/time/location/description fields, validation, confirmation, and live query refresh. *(done 2026-08-01; production build and lint pass)*
- [x] Messages: added guardian/student thread creation, per-thread unread counts and read acknowledgements, realtime conversation/list refresh, automatic last-message timestamps, and removed the static shared-documents panel. *(done 2026-08-01; migration `0018_message_threads_realtime.sql` applied and both RPCs plus realtime publication verified live)*
- [x] Notifications: persisted per-user event/channel preferences and added automatic email/SMS/WhatsApp outbox fan-out with destination snapshots, pending/processing/sent/failed status, attempt counts, errors, exponential retry scheduling, and a delivery summary in Settings. *(done 2026-08-01; migration `0019_notification_delivery.sql` applied and both tables, retry RPC, and enqueue trigger verified live)*
- [x] Settings/classes: implemented bilingual Add Class and Edit Class modals with name/grade/class-teacher fields, validation, duplicate protection, admin-only authorization, and live list refresh. *(done 2026-08-01; migration `0020_class_management.sql` applied and the RPC plus unique-name guard verified live)*
- [x] Settings/notifications: notification-event and channel toggles now load from and save to per-user Supabase preferences. *(done 2026-08-01 with migration `0019_notification_delivery.sql`)*
- [x] Settings/billing: replaced the static card with persisted school subscriptions, live student/price/monthly-usage calculation, plan and status display, billing-contact management, period dates, and period-end cancellation through an admin-only workflow. External payment collection remains tracked separately under the payment-aggregator item. *(done 2026-08-01; migration `0021_school_subscriptions.sql` applied and the seeded table plus update RPC verified live)*
- [x] Settings/integrations: replaced hard-coded badges with a persisted per-school provider registry, account labels, configured/disconnected states, admin-only setup/disconnect actions, live refresh, and explicit server-side-secret guidance. Provider OAuth/API credentials and data sync remain provider-specific implementation work. *(done 2026-08-01; migration `0022_school_integrations.sql` applied and the registry, RPC, and four seeded providers verified live)*
- [x] Settings/security: implement password change, sign-out-everywhere, session timeout, alerts, and optional MFA. *(done 2026-09-11)*
- [x] Topbar: implement global student/fee/exam search; the search input is currently visual only. *(done 2026-09-11)*
- [x] Topbar: connect the Help button to real documentation/support. *(done 2026-09-11)*

## P1 — Quality gates

- [ ] Add Vitest + Testing Library unit tests for data formatting, auth guards, forms, notification localization, and interactive UI primitives.
- [ ] Add Supabase integration tests for all CRUD hooks and error/empty/loading states.
- [ ] Add Playwright critical-path tests: sign in/onboarding, add student, save attendance, publish assignment, enter/publish results, mark fee paid, and send message.
- [ ] Add CI running install, lint, typecheck/build, unit tests, database tests, and E2E smoke tests on every pull request.
- [x] Add a global application error boundary with a bilingual recovery/reload screen. *(done 2026-07-18)*
- [ ] Add structured mutation error feedback/toasts instead of silent or page-local failures.
- [ ] Run WCAG 2.1 AA review: keyboard navigation, dialog focus traps, screen-reader labels, contrast, reduced motion, and automated axe checks.
- [ ] Test responsive layouts on phone/tablet and cross-browser smoke on Chrome, Edge, Firefox, and Safari.
- [ ] Add bundle budgets, Lighthouse checks, image optimization, and query/index review.
- [ ] Add a translation-key parity CI check and native-speaker review of `bn.json`.

## P2 — Platform and launch readiness

- [ ] Choose and configure local/staging/production environments with separate Supabase projects and documented migration promotion/rollback.
- [ ] Add frontend deployment configuration and automated staging deployment.
- [ ] Add monitoring: error tracking, uptime, logs, alerts, and health/status page.
- [ ] Add database backup/restore runbook and verify a restore.
- [ ] Add dependency/security scanning, OWASP review, rate limiting for server functions, and penetration testing before launch.
- [ ] Add privacy/consent, retention/deletion, terms, and Bangladesh child-data compliance review.
- [ ] Add school/teacher/parent invitations and role management; onboarding currently supports only create-school or shared demo join.
- [ ] Add first-run setup for classes, subjects, students, and staff plus guided demo/help content.
- [ ] Conduct a closed beta with 1–2 schools, load test morning attendance traffic, and capture product/support metrics.

## P2 — New integrations and advanced features

- [ ] Select and integrate a Bangladesh payment aggregator (SSLCommerz, aamarPay, or ShurjoPay) with webhook/IPN verification, refunds, and receipts.
- [ ] Select and integrate an SMS gateway; add bilingual templates, preferences, delivery tracking, and retries.
- [ ] Implement AI Exam Builder generation/edit/regeneration/save with server-side secrets, limits, cost tracking, prompt-injection defenses, and human review; current questions are static.
- [ ] Add PDF generation with embedded Bangla fonts for report cards, invoices, receipts, and question papers.
- [ ] Add realtime messaging/attendance where it materially improves workflows.
- [ ] Build separate role-appropriate parent/student experiences after RLS and route guards are complete.

## Documentation and repository hygiene

- [ ] Update `README.md` layout/status text that still describes page placeholders and document migration/application workflow.
- [ ] Reconcile `eduos-design-system/ROADMAP.txt` checkboxes with this authoritative checklist or mark that roadmap as historical.
- [ ] Add formatting/editor conventions, contributor workflow, and release notes/changelog.
- [ ] Initialize or restore accessible Git metadata and add a remote/branch workflow; project progress currently cannot be audited from commit history.
- [ ] Remove unused `PagePlaceholder` and stale placeholder translation keys after confirming no route consumes them.

## 📌 Notes
- All 18 domain tables are seeded, so each page shows real demo data once wired.
- Email confirmation is ON for the live project — disable it (Auth → Providers → Email) for a smooth demo, or confirm via email.
- Migrations `0001`–`0022` are applied to the live Supabase project; the demo seed contains 1 school and 12 students.
