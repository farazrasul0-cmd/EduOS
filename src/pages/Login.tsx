import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/form'
import { LanguageToggle } from '@/components/layout/LanguageToggle'

export default function Login() {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)
    try {
      if (mode === 'in') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        // Session change is picked up by AuthProvider; the route guard redirects.
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        })
        if (error) throw error
        if (!data.session) {
          setInfo(t('auth.checkEmail'))
          setMode('in')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.error'))
    } finally {
      setLoading(false)
    }
  }

  const isSignup = mode === 'up'

  return (
    <div className="grid min-h-screen place-items-center bg-app p-4">
      <div className="absolute right-4 top-4">
        <LanguageToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-primary font-bold text-white">E</div>
          <span className="text-lg font-semibold text-fg-1">{t('app.name')}</span>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-fg-1">
            {isSignup ? t('auth.signupTitle') : t('auth.loginTitle')}
          </h1>
          <p className="mt-1 text-sm text-fg-3">
            {isSignup ? t('auth.signupSubtitle') : t('auth.loginSubtitle')}
          </p>

          <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3.5">
            {isSignup && (
              <Field label={t('auth.fullName')}>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('auth.fullNamePlaceholder')}
                  required
                />
              </Field>
            )}
            <Field label={t('auth.email')}>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu.bd"
                autoComplete="email"
                required
              />
            </Field>
            <Field label={t('auth.password')}>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                required
                minLength={6}
              />
            </Field>

            {error && (
              <div className="rounded-sm bg-danger-tint px-3 py-2 text-[13px] text-danger">{error}</div>
            )}
            {info && (
              <div className="rounded-sm bg-success-tint px-3 py-2 text-[13px] text-success">{info}</div>
            )}

            <Button type="submit" variant="primary" disabled={loading} className="mt-1 w-full">
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {isSignup ? t('auth.signingUp') : t('auth.signingIn')}
                </>
              ) : isSignup ? (
                t('auth.signUp')
              ) : (
                t('auth.signIn')
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-[13px] text-fg-3">
            {isSignup ? t('auth.haveAccount') : t('auth.noAccount')}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(isSignup ? 'in' : 'up')
                setError(null)
                setInfo(null)
              }}
              className="font-semibold text-primary hover:underline"
            >
              {isSignup ? t('auth.toLogin') : t('auth.toSignup')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
