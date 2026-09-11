import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Plus, Loader2, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/auth/context'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/form'
import { LanguageToggle } from '@/components/layout/LanguageToggle'

export default function Onboarding() {
  const { t } = useTranslation()
  const { user, refreshProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState<'demo' | 'create' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function joinDemo() {
    if (!user) return
    setBusy('demo')
    setError(null)
    try {
      const { error } = await supabase.rpc('join_demo_school')
      if (error) throw error
      await refreshProfile()
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.error'))
      setBusy(null)
    }
  }

  async function createSchool(e: FormEvent) {
    e.preventDefault()
    if (!user || !name.trim()) return
    setBusy('create')
    setError(null)
    try {
      const { error: createErr } = await supabase.rpc('create_school_for_current_user', {
        school_name: name.trim(),
      })
      if (createErr) throw createErr
      await refreshProfile()
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.error'))
      setBusy(null)
    }
  }

  return (
    <div className="min-h-screen bg-app p-4">
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <LanguageToggle />
        <Button variant="ghost" size="sm" icon={<LogOut size={14} />} onClick={() => void signOut()}>
          {t('auth.signOut')}
        </Button>
      </div>

      <div className="mx-auto mt-16 max-w-xl">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-primary font-bold text-white">E</div>
          <span className="text-lg font-semibold text-fg-1">{t('app.name')}</span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-fg-1">{t('onboarding.title')}</h1>
        <p className="mt-1 text-sm text-fg-3">{t('onboarding.subtitle')}</p>
        {user?.email && (
          <p className="mt-1 text-xs text-fg-4">{t('onboarding.signedInAs', { email: user.email })}</p>
        )}

        {error && (
          <div className="mt-4 rounded-sm bg-danger-tint px-3 py-2 text-[13px] text-danger">{error}</div>
        )}

        <div className="mt-6 flex flex-col gap-4">
          {/* Join demo */}
          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary-tint text-primary">
                <GraduationCap size={20} />
              </span>
              <div className="flex-1">
                <h2 className="font-semibold text-fg-1">{t('onboarding.joinDemoTitle')}</h2>
                <p className="mt-0.5 text-[13px] text-fg-3">{t('onboarding.joinDemoDesc')}</p>
                <Button
                  variant="primary"
                  className="mt-3"
                  onClick={() => void joinDemo()}
                  disabled={busy !== null}
                >
                  {busy === 'demo' ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {t('onboarding.working')}
                    </>
                  ) : (
                    t('onboarding.joinDemoBtn')
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="text-center text-xs uppercase tracking-wider text-fg-4">{t('onboarding.or')}</div>

          {/* Create school */}
          <form onSubmit={createSchool} className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-neutral-100 text-fg-2">
                <Plus size={20} />
              </span>
              <div className="flex-1">
                <h2 className="font-semibold text-fg-1">{t('onboarding.createTitle')}</h2>
                <p className="mt-0.5 text-[13px] text-fg-3">{t('onboarding.createDesc')}</p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                  <Field className="flex-1" label={t('onboarding.schoolName')}>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('onboarding.schoolNamePlaceholder')}
                    />
                  </Field>
                  <Button type="submit" variant="secondary" disabled={busy !== null || !name.trim()}>
                    {busy === 'create' ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        {t('onboarding.working')}
                      </>
                    ) : (
                      t('onboarding.createBtn')
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
