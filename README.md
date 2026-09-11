# EduOS

School-management SaaS for Bangladesh. Bilingual (English + বাংলা), Taka (৳).

This is the **production app**. The design source of truth lives in
`../eduos-design-system` and the full roadmap is in
`../eduos-design-system/ROADMAP.txt`. Locked decisions: see [DECISIONS.md](./DECISIONS.md).

## Stack

Vite + React 19 + TypeScript · Tailwind v4 · React Router 7 · TanStack Query ·
React Hook Form + Zod · i18next (en/bn) · lucide-react.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build
npm run preview  # serve the production build
npm run lint
```

## Layout

```
src/
  components/
    layout/    # AppLayout, Sidebar, Topbar, Notifications, LanguageToggle, nav-config
    ui/        # Button, Segmented (design-system primitives; more to come)
  i18n/        # i18next config + locales/{en,bn}.json
  lib/         # utils: cn(), formatTaka(), formatDate(), formatNumber()
  pages/       # one file per route (placeholders until Phase 4)
```

## Backend / database (Supabase)

Backend is **Supabase** (managed Postgres + Auth + Storage). Schema, security,
and demo data live in [supabase/](./supabase/):

- `migrations/0001_init.sql` — ~22 tables (all carry `school_id`), enums, indexes
- `migrations/0002_rls.sql` — Row-Level Security (tenant isolation) + auth triggers
- `seed.sql` — demo school "Riverside Public School" with realistic data

### One-time setup

1. Create a free project at [supabase.com](https://supabase.com).
2. Copy `.env.example` → `.env` and fill `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` (Project Settings → API).
3. Link + apply the schema and seed:
   ```bash
   npx supabase link --project-ref YOUR-PROJECT-REF
   npm run db:push      # applies migrations
   # load demo data: paste supabase/seed.sql into the SQL Editor, or
   # use `supabase db reset` if running the local stack (needs Docker)
   npm run db:types     # generates src/types/supabase.ts for typed queries
   ```
4. Sign up in the app, then attach yourself to the demo school (SQL Editor):
   ```sql
   update profiles
     set school_id = '11111111-1111-1111-1111-111111111111', role = 'owner'
     where id = auth.uid();
   ```

> Status: schema + RLS + seed are **applied and verified** on the live project.
> They were loaded over the Postgres connection with `scripts/db-apply.mjs`
> (`EDUOS_DB_HOST`, `EDUOS_DB_PASSWORD` via env). `npm run db:types` needs Docker;
> until then, typed queries use `src/types/models.ts`.

## Conventions

- **No hardcoded UI strings.** Everything user-facing goes through `t('...')`
  with keys in `src/i18n/locales/*.json` (both `en` and `bn`).
- **Money** is always rendered via `formatTaka()` — never a raw `৳` + number.
- **Design tokens** come from `src/index.css` (`@theme`) — use Tailwind utilities
  like `bg-primary`, `text-fg-2`, `rounded-md`, `shadow-md`, not ad-hoc hex values.
- Import from `@/...` (alias for `src/`).
