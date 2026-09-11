// End-to-end check of auth + RLS + Students data against the live project.
// Reads VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from .env.
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
)
const URL_ = env.VITE_SUPABASE_URL
const KEY = env.VITE_SUPABASE_ANON_KEY
const DEMO = '11111111-1111-1111-1111-111111111111'

// 1) Anonymous read must return 0 rows (RLS on).
const anon = createClient(URL_, KEY)
{
  const { data, error } = await anon.from('students').select('id')
  console.log(`anon students select -> ${error ? 'error ' + error.message : (data?.length ?? 0) + ' rows'} (expect 0)`)
}

// 2) Sign up a throwaway user.
const email = `eduos-test+${Date.now()}@mailinator.com`
const password = 'Test123456!'
const user = createClient(URL_, KEY)
const { data: signUp, error: signErr } = await user.auth.signUp({
  email,
  password,
  options: { data: { full_name: 'E2E Tester' } },
})
if (signErr) {
  console.log('signUp error:', signErr.message)
  process.exit(1)
}
if (!signUp.session) {
  console.log('signUp ok but NO session -> email confirmation is ON for this project.')
  console.log('Disable it (Auth → Providers → Email → uncheck "Confirm email") to test the full flow / for a smooth demo.')
  process.exit(0)
}
console.log('signUp -> session acquired for', email)

// 3) Attach to the demo school (as this user).
{
  const { error } = await user.from('profiles').update({ school_id: DEMO, role: 'owner' }).eq('id', signUp.user.id)
  console.log(`attach to demo school -> ${error ? 'error ' + error.message : 'ok'}`)
}

// 4) Now student rows should be visible (seeded 12).
{
  const { data, error } = await user.from('students').select('id, full_name, classes(name)').order('roll_no')
  console.log(`authed students select -> ${error ? 'error ' + error.message : (data?.length ?? 0) + ' rows'} (expect 12)`)
  if (data?.[0]) console.log('   sample:', data[0].full_name, '·', data[0].classes?.name)
}

// 5) Insert a student, verify, then clean up.
let newId
{
  const { data, error } = await user
    .from('students')
    .insert({ school_id: DEMO, full_name: 'E2E New Student', status: 'active' })
    .select('id')
    .single()
  console.log(`insert student -> ${error ? 'error ' + error.message : 'ok (' + data.id + ')'}`)
  newId = data?.id
}
{
  const { count } = await user.from('students').select('id', { count: 'exact', head: true })
  console.log(`count after insert -> ${count} (expect 13)`)
}
if (newId) {
  const { error } = await user.from('students').delete().eq('id', newId)
  console.log(`cleanup delete -> ${error ? 'error ' + error.message : 'ok'}`)
}

console.log('E2E DONE')
