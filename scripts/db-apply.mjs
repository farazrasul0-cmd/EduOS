// One-off: apply EduOS SQL (migrations + optional seed) to a Postgres database.
// Credentials come from env (never hard-coded / committed):
//   EDUOS_DB_HOST, EDUOS_DB_PORT, EDUOS_DB_USER, EDUOS_DB_NAME, EDUOS_DB_PASSWORD
// Usage:  node scripts/db-apply.mjs [--seed]
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const migrationDir = join(root, 'supabase', 'migrations')
const files = readdirSync(migrationDir)
  .filter((name) => /^\d+.*\.sql$/.test(name))
  .sort()
  .map((name) => `supabase/migrations/${name}`)
if (process.argv.includes('--seed')) files.push('supabase/seed.sql')

const client = new pg.Client({
  host: process.env.EDUOS_DB_HOST,
  port: Number(process.env.EDUOS_DB_PORT ?? 5432),
  user: process.env.EDUOS_DB_USER ?? 'postgres',
  database: process.env.EDUOS_DB_NAME ?? 'postgres',
  password: process.env.EDUOS_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 20000,
})

try {
  await client.connect()
  console.log(`connected to ${process.env.EDUOS_DB_HOST}`)
  for (const f of files) {
    const sql = readFileSync(join(root, f), 'utf8')
    process.stdout.write(`applying ${f} ... `)
    await client.query(sql)
    console.log('ok')
  }
  console.log('DONE')
} catch (err) {
  console.error('FAILED:', err.message)
  process.exitCode = 1
} finally {
  await client.end().catch(() => {})
}
