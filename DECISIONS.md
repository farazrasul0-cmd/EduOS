# EduOS — Architecture Decisions

A running log of locked technical decisions for the EduOS production app.
Newest decisions at the bottom. See `../eduos-design-system/ROADMAP.txt` for the
full phased plan and `../eduos-design-system/` for the design source of truth.

---

## ADR-001 — Target market & locale (Bangladesh)

**Decided.** The product targets **Bangladesh**.

- **Currency:** Bangladeshi Taka — code `BDT`, symbol `৳`. Always rendered via
  `formatTaka()` in `src/lib/utils.ts`. (The original design mockup used ₹; all
  amounts are ৳ here.)
- **Languages:** **Bilingual English + Bangla (বাংলা) from day one.** Every
  user-facing string goes through i18n — no hardcoded UI text. Per-user language
  toggle, persisted in `localStorage` (`eduos.lang`).
- **Payments (later phase):** Bangladesh aggregator (SSLCommerz / aamarPay /
  ShurjoPay) for bKash, Nagad, Rocket, Upay, cards, bank. **Not** Stripe/Razorpay.
- **SMS (later phase):** local gateway (SSL Wireless / MIMSMS / bulksmsbd).
- **Hosting (later phase):** low-latency region (AWS Mumbai `ap-south-1` or
  Singapore `ap-southeast-1`).

## ADR-002 — Codebase location & relationship to prior work

**Decided.** Production code lives in `Desktop/eduos-app` (this folder).

- `Desktop/eduos-design-system` = design source of truth + ROADMAP (reference).
- `Desktop/eduos` ("eduos-pro-react") = an earlier, weaker attempt (plain JS, no
  TS, no i18n). **Reference only**, not the base. We did not build on it.

## ADR-003 — Frontend stack

**Decided.** Built fresh in Phase 1:

| Concern        | Choice                                            |
| -------------- | ------------------------------------------------- |
| Build tool     | Vite 8                                             |
| Framework      | React 19 + **TypeScript**                          |
| Styling        | Tailwind CSS v4 (`@tailwindcss/vite`), tokens from the design system's `colors_and_type.css`, mapped into `@theme` |
| Routing        | React Router 7                                     |
| Server state   | TanStack Query                                     |
| Forms + schema | React Hook Form + Zod                              |
| Icons          | lucide-react                                       |
| i18n           | i18next + react-i18next + browser language detector |
| Path alias     | `@/*` → `src/*`                                    |

## ADR-004 — Backend: Supabase (managed Postgres)

**Decided.** Backend is **Supabase** — managed PostgreSQL + Auth + Storage +
Realtime, accessed from the React app via `@supabase/supabase-js`.

- Fastest path to production for a small team; one TypeScript stack end-to-end.
- Tenant isolation enforced in the database via **Row-Level Security**, not
  app code — far safer for multi-school data.
- Client uses the public **anon key** (safe in the browser; RLS protects rows).
- Custom server logic (payment webhooks, AI exam builder, SMS) will live in
  Supabase Edge Functions or a thin API later — not needed for CRUD.
- Trade-off accepted: some reliance on one provider.

## ADR-005 — Multi-tenant from day one

**Decided.** The schema is **multi-tenant**: every domain table carries
`school_id`, and RLS restricts every row to members of its school
(`auth_school_id()` helper). Lets us onboard many schools without a rebuild,
while still launching with one.

## ADR-006 — Data model & money

**Decided.** Initial schema in `supabase/migrations/0001_init.sql` (~22 tables
covering all 11 pages) + RLS in `0002_rls.sql` + demo data in `seed.sql`.

- Roles: `owner | admin | teacher | parent | student` on `profiles`.
- A profile row is auto-created on sign-up (trigger on `auth.users`).
- **Money is `numeric(12,2)` in BDT (৳)** — e.g. `4500.00`.
- Status: **applied & verified on the live Supabase project** (2026-06-08) —
  schema + RLS + seed all loaded (1 school, 12 students, 8 invoices, etc.).
  Applied over the Postgres connection via `scripts/db-apply.mjs` (the CLI
  login/link and `gen types` paths need Docker, which isn't available here).
  Typed queries use hand-written `src/types/models.ts` until `db:types` can be
  run on a machine with Docker.

## Still open (decide before the relevant phase)

- Payment aggregator: SSLCommerz vs aamarPay vs ShurjoPay.
- Per-role RLS tightening (e.g. parents see only their child) — base policy is
  currently "same school"; refine before parent/student logins ship.
- Who supplies Bangla translations (in-house / professional / MT + review).
  The current `bn.json` is a first-pass translation by the dev and should be
  reviewed by a native Bangla speaker before launch.
