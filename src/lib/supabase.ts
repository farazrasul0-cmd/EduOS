import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Don't hard-crash the demo build before the backend is configured —
  // pages still render their (mock) UI. Data calls will fail loudly instead.
  console.warn(
    '[eduos] Supabase env missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env',
  )
}

/**
 * Browser Supabase client. Uses the public anon key — safe to ship; Row-Level
 * Security (see supabase/migrations/0002_rls.sql) enforces tenant isolation.
 *
 * Once a project is linked, run `npm run db:types` to generate
 * src/types/supabase.ts and switch to `createClient<Database>(...)` for fully
 * typed queries.
 */
export const supabase = createClient(url ?? '', anonKey ?? '')
