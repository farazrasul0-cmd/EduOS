## Summary of Changes
Provide a brief summary of the changes introduced in this pull request and the rationale behind them.

Closes #(issue number)

## Type of Change
- [ ] 🚀 New feature (non-breaking change adding functionality)
- [ ] 🐛 Bug fix (non-breaking change fixing an issue)
- [ ] 🔒 Security improvement / hardening
- [ ] ⚡ Performance optimization
- [ ] ♻️ Code refactoring or cleanup
- [ ] 📝 Documentation update
- [ ] 🧪 Tests / Quality gate addition

## Component Areas Affected
- [ ] Authentication & Tenancy
- [ ] Students & Guardians
- [ ] Attendance
- [ ] Fees & Invoices
- [ ] Exams & Results
- [ ] Assignments
- [ ] Timetable & Calendar
- [ ] Parent Messages & Notifications
- [ ] Settings & Admin Controls
- [ ] UI Primitives & Design System Tokens

## Quality & Verification Checklist
- [ ] My code adheres to the project coding standards and design tokens.
- [ ] Bilingual parity: User-facing strings use `t('...')` and exist in both `en.json` and `bn.json`.
- [ ] Currency values are formatted via `formatTaka()` with `৳` (never raw string concatenation).
- [ ] Unit tests added or updated where appropriate.
- [ ] `npm test` runs cleanly and all tests pass.
- [ ] `npm run lint` passes with 0 errors and 0 warnings.
- [ ] `npm run build` succeeds without bundle or type errors.
- [ ] Database migrations (if any) are numbered sequentially and include multi-tenant RLS checks.
