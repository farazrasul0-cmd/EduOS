import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  Loader2,
  LogOut,
  Building2,
  Clock,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Rocket,
  Check,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/auth/context'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { Card } from '@/components/ui/Card'
import { LanguageToggle } from '@/components/layout/LanguageToggle'
import { cn, formatNumber } from '@/lib/utils'
import {
  validateEiin,
  BANGLADESH_BOARDS,
  INSTITUTE_TYPES,
  SCHOOL_SHIFTS,
  CURRICULUM_MEDIUMS,
  INITIAL_WIZARD_STATE,
  type OnboardingWizardState,
  type InstituteType,
} from '@/lib/school-onboarding'
import type { AppLanguage } from '@/i18n'

export default function Onboarding() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'en') as AppLanguage
  const { user, refreshProfile, signOut } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [form, setForm] = useState<OnboardingWizardState>(INITIAL_WIZARD_STATE)
  const [busy, setBusy] = useState<'demo' | 'launch' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function joinDemo() {
    if (!user) return
    setBusy('demo')
    setError(null)
    try {
      const { error: rpcErr } = await supabase.rpc('join_demo_school')
      if (rpcErr) throw rpcErr
      await refreshProfile()
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.error'))
      setBusy(null)
    }
  }

  function validateStep1(): boolean {
    const errors: Record<string, string> = {}
    if (!form.schoolName.trim()) {
      errors.schoolName = t('onboarding.errors.nameRequired')
    }
    const eiinCheck = validateEiin(form.eiin)
    if (!eiinCheck.valid) {
      errors.eiin = t(eiinCheck.errorKey || 'onboarding.errors.eiinFormat')
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function validateStep3(): boolean {
    const errors: Record<string, string> = {}
    if (form.selectedClasses.length === 0) {
      errors.classes = t('onboarding.errors.classRequired')
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleNext() {
    setError(null)
    if (step === 1) {
      if (!validateStep1()) return
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    } else if (step === 3) {
      if (!validateStep3()) return
      setStep(4)
    }
  }

  function handleBack() {
    setError(null)
    setFieldErrors({})
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4)
    }
  }

  function handleInstituteTypeChange(typeId: InstituteType) {
    const found = INSTITUTE_TYPES.find((t) => t.id === typeId)
    setForm((prev) => ({
      ...prev,
      instituteType: typeId,
      selectedClasses: found ? [...found.defaultClasses] : prev.selectedClasses,
    }))
  }

  function toggleClassSelection(className: string) {
    setForm((prev) => {
      const exists = prev.selectedClasses.includes(className)
      const next = exists
        ? prev.selectedClasses.filter((c) => c !== className)
        : [...prev.selectedClasses, className]
      return { ...prev, selectedClasses: next }
    })
    setFieldErrors((prev) => {
      const copy = { ...prev }
      delete copy.classes
      return copy
    })
  }

  async function handleLaunch() {
    if (!user) return
    setBusy('launch')
    setError(null)

    try {
      // 1. Create the school for the user atomically via RPC
      const { data: schoolId, error: createErr } = await supabase.rpc('create_school_for_current_user', {
        school_name: form.schoolName.trim(),
      })
      if (createErr) throw createErr

      const targetSchoolId = schoolId as string
      const boardObj = BANGLADESH_BOARDS.find((b) => b.id === form.board)
      const boardName = lang === 'bn' ? boardObj?.nameBn : boardObj?.nameEn
      const affiliationStr = `${boardName || 'Dhaka Education Board'} · EIIN: ${form.eiin.trim()}`

      // 2. Update school with accreditation, address, and academic year
      await supabase
        .from('schools')
        .update({
          affiliation: affiliationStr,
          address: form.address.trim() || null,
          academic_year: form.academicYear.trim() || '2026',
        })
        .eq('id', targetSchoolId)

      // 3. Initialize selected classes
      for (const className of form.selectedClasses) {
        await supabase.rpc('save_school_class', {
          target_id: null,
          target_name: className,
          target_grade: className,
          target_teacher_id: null,
        })
      }

      // 4. Initialize fee heads
      if (form.feeHeads.length > 0) {
        await supabase.from('fee_plans').insert(
          form.feeHeads.map((f) => ({
            school_id: targetSchoolId,
            name: f.name,
            amount: f.amount,
            period: f.period,
          })),
        )
      }

      await refreshProfile()
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.error'))
      setBusy(null)
    }
  }

  const selectedBoardObj = BANGLADESH_BOARDS.find((b) => b.id === form.board)
  const selectedTypeObj = INSTITUTE_TYPES.find((t) => t.id === form.instituteType)
  const selectedShiftObj = SCHOOL_SHIFTS.find((s) => s.id === form.shift)
  const selectedMediumObj = CURRICULUM_MEDIUMS.find((m) => m.id === form.medium)

  const stepsMeta = [
    { num: 1, title: t('onboarding.wizard.step1Title'), icon: Building2 },
    { num: 2, title: t('onboarding.wizard.step2Title'), icon: Clock },
    { num: 3, title: t('onboarding.wizard.step3Title'), icon: BookOpen },
    { num: 4, title: t('onboarding.wizard.step4Title'), icon: CheckCircle2 },
  ]

  return (
    <div className="min-h-screen bg-app p-4">
      {/* Top action bar */}
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <LanguageToggle />
        <Button variant="ghost" size="sm" icon={<LogOut size={14} />} onClick={() => void signOut()}>
          {t('auth.signOut')}
        </Button>
      </div>

      <div className="mx-auto mt-8 max-w-3xl pb-16">
        {/* Brand header */}
        <div className="mb-6 flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-primary font-bold text-white shadow-sm">
            E
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-fg-1">{t('app.name')}</span>
            <span className="ml-2 rounded-full bg-primary-tint px-2 py-0.5 text-[11px] font-semibold text-primary">
              Bangladesh EdTech
            </span>
          </div>
        </div>

        {/* Demo School Banner (Fast Path) */}
        <div className="mb-6 rounded-lg border border-primary/20 bg-primary-tint/20 p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary text-white">
                <GraduationCap size={20} />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-fg-1">{t('onboarding.joinDemoTitle')}</h2>
                <p className="mt-0.5 text-xs text-fg-3">{t('onboarding.joinDemoDesc')}</p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void joinDemo()}
              disabled={busy !== null}
              className="shrink-0 font-medium"
            >
              {busy === 'demo' ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  {t('onboarding.working')}
                </>
              ) : (
                t('onboarding.joinDemoBtn')
              )}
            </Button>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-fg-1">{t('onboarding.title')}</h1>
            <p className="mt-0.5 text-sm text-fg-3">{t('onboarding.subtitle')}</p>
          </div>
          {user?.email && (
            <span className="hidden text-xs text-fg-4 sm:inline">
              {t('onboarding.signedInAs', { email: user.email })}
            </span>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-sm bg-danger-tint px-4 py-3 text-sm font-medium text-danger">
            {error}
          </div>
        )}

        {/* Step Progress Indicator */}
        <div className="mb-8 grid grid-cols-4 gap-2">
          {stepsMeta.map((s) => {
            const Icon = s.icon
            const isDone = step > s.num
            const isCurrent = step === s.num
            return (
              <div
                key={s.num}
                className={cn(
                  'flex items-center gap-2 rounded-md border p-2.5 transition-colors',
                  isCurrent
                    ? 'border-primary bg-primary-tint/30 text-primary font-semibold'
                    : isDone
                    ? 'border-border bg-surface text-fg-2'
                    : 'border-border/60 bg-surface/50 text-fg-4',
                )}
              >
                <div
                  className={cn(
                    'grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold',
                    isCurrent
                      ? 'bg-primary text-white'
                      : isDone
                      ? 'bg-success text-white'
                      : 'bg-neutral-200 text-fg-3',
                  )}
                >
                  {isDone ? <Check size={12} strokeWidth={3} /> : s.num}
                </div>
                <div className="hidden sm:flex items-center gap-1.5 truncate text-xs">
                  <Icon size={13} className="shrink-0" />
                  <span>{s.title}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Wizard Step Content */}
        <Card className="p-6 shadow-sm">
          {step === 1 && (
            <div>
              <div className="mb-5 border-b border-border pb-3">
                <h2 className="text-base font-semibold text-fg-1">{t('onboarding.wizard.step1Title')}</h2>
                <p className="mt-0.5 text-xs text-fg-3">{t('onboarding.wizard.step1Sub')}</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field className="sm:col-span-2" label={t('onboarding.schoolName')}>
                  <Input
                    value={form.schoolName}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, schoolName: e.target.value }))
                      setFieldErrors((prev) => {
                        const copy = { ...prev }
                        delete copy.schoolName
                        return copy
                      })
                    }}
                    placeholder={t('onboarding.schoolNamePlaceholder')}
                    required
                  />
                  {fieldErrors.schoolName && (
                    <span className="text-xs text-danger font-medium">{fieldErrors.schoolName}</span>
                  )}
                </Field>

                <Field label={t('onboarding.fields.eiin')} hint={t('onboarding.fields.eiinHint')}>
                  <Input
                    value={form.eiin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                      setForm((prev) => ({ ...prev, eiin: val }))
                      setFieldErrors((prev) => {
                        const copy = { ...prev }
                        delete copy.eiin
                        return copy
                      })
                    }}
                    placeholder={t('onboarding.fields.eiinPlaceholder')}
                    maxLength={6}
                    required
                  />
                  {fieldErrors.eiin && (
                    <span className="text-xs text-danger font-medium">{fieldErrors.eiin}</span>
                  )}
                </Field>

                <Field label={t('onboarding.fields.board')}>
                  <Select
                    value={form.board}
                    onChange={(e) => setForm((prev) => ({ ...prev, board: e.target.value }))}
                  >
                    {BANGLADESH_BOARDS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {lang === 'bn' ? b.nameBn : b.nameEn}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label={t('onboarding.fields.instituteType')}>
                  <Select
                    value={form.instituteType}
                    onChange={(e) => handleInstituteTypeChange(e.target.value as InstituteType)}
                  >
                    {INSTITUTE_TYPES.map((it) => (
                      <option key={it.id} value={it.id}>
                        {lang === 'bn' ? it.nameBn : it.nameEn}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field className="sm:col-span-2" label={t('onboarding.fields.address')}>
                  <Textarea
                    value={form.address}
                    onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder={t('onboarding.fields.addressPlaceholder')}
                    rows={2}
                  />
                </Field>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="mb-5 border-b border-border pb-3">
                <h2 className="text-base font-semibold text-fg-1">{t('onboarding.wizard.step2Title')}</h2>
                <p className="mt-0.5 text-xs text-fg-3">{t('onboarding.wizard.step2Sub')}</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-fg-2 mb-2 uppercase tracking-wider">
                    {t('onboarding.fields.shift')}
                  </label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {SCHOOL_SHIFTS.map((s) => {
                      const active = form.shift === s.id
                      return (
                        <div
                          key={s.id}
                          onClick={() => setForm((prev) => ({ ...prev, shift: s.id }))}
                          className={cn(
                            'cursor-pointer rounded-md border p-3.5 transition-colors',
                            active
                              ? 'border-primary bg-primary-tint/20 ring-1 ring-primary'
                              : 'border-border bg-surface hover:bg-neutral-50',
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-fg-1">
                              {lang === 'bn' ? s.nameBn : s.nameEn}
                            </span>
                            {active && <Check size={16} className="text-primary font-bold" />}
                          </div>
                          <p className="mt-1 text-xs text-fg-3">
                            {lang === 'bn' ? s.descriptionBn : s.descriptionEn}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-fg-2 mb-2 uppercase tracking-wider">
                    {t('onboarding.fields.medium')}
                  </label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {CURRICULUM_MEDIUMS.map((m) => {
                      const active = form.medium === m.id
                      return (
                        <div
                          key={m.id}
                          onClick={() => setForm((prev) => ({ ...prev, medium: m.id }))}
                          className={cn(
                            'cursor-pointer rounded-md border p-3.5 transition-colors',
                            active
                              ? 'border-primary bg-primary-tint/20 ring-1 ring-primary'
                              : 'border-border bg-surface hover:bg-neutral-50',
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-fg-1">
                              {lang === 'bn' ? m.nameBn : m.nameEn}
                            </span>
                            {active && <Check size={14} className="text-primary font-bold" />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="max-w-xs">
                  <Field label={t('onboarding.fields.academicYear')}>
                    <Input
                      value={form.academicYear}
                      onChange={(e) => setForm((prev) => ({ ...prev, academicYear: e.target.value }))}
                      placeholder={t('onboarding.fields.academicYearPlaceholder')}
                    />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="mb-5 border-b border-border pb-3">
                <h2 className="text-base font-semibold text-fg-1">{t('onboarding.wizard.step3Title')}</h2>
                <p className="mt-0.5 text-xs text-fg-3">{t('onboarding.wizard.step3Sub')}</p>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-fg-2 uppercase tracking-wider">
                      {t('onboarding.fields.classes')}
                    </label>
                    <span className="text-xs text-fg-3">
                      {formatNumber(form.selectedClasses.length, lang)} selected
                    </span>
                  </div>

                  {fieldErrors.classes && (
                    <div className="mb-2 text-xs font-medium text-danger">{fieldErrors.classes}</div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {selectedTypeObj?.defaultClasses.map((cls) => {
                      const selected = form.selectedClasses.includes(cls)
                      return (
                        <button
                          type="button"
                          key={cls}
                          onClick={() => toggleClassSelection(cls)}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors',
                            selected
                              ? 'border-primary bg-primary text-white'
                              : 'border-border bg-surface text-fg-2 hover:bg-neutral-100',
                          )}
                        >
                          {selected && <Check size={12} strokeWidth={3} />}
                          {cls}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-fg-2 mb-2 uppercase tracking-wider">
                    {t('onboarding.fields.feeHeads')}
                  </label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {form.feeHeads.map((f, idx) => (
                      <div key={f.id} className="rounded-md border border-divider bg-app p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-fg-1">{f.name}</span>
                          <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-medium text-fg-2 uppercase">
                            {f.period}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-fg-3 font-semibold">৳</span>
                          <Input
                            type="number"
                            value={String(f.amount)}
                            onChange={(e) => {
                              const amt = Math.max(0, parseInt(e.target.value, 10) || 0)
                              setForm((prev) => {
                                const nextHeads = [...prev.feeHeads]
                                nextHeads[idx] = { ...nextHeads[idx], amount: amt }
                                return { ...prev, feeHeads: nextHeads }
                              })
                            }}
                            className="h-8 text-xs font-semibold"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div className="mb-5 border-b border-border pb-3">
                <h2 className="text-base font-semibold text-fg-1">{t('onboarding.wizard.step4Title')}</h2>
                <p className="mt-0.5 text-xs text-fg-3">{t('onboarding.wizard.step4Sub')}</p>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-app p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-fg-3 mb-2">
                    {t('onboarding.fields.reviewAccreditation')}
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                    <div>
                      <span className="block text-xs text-fg-3">{t('onboarding.schoolName')}</span>
                      <b className="text-fg-1 text-base">{form.schoolName}</b>
                    </div>
                    <div>
                      <span className="block text-xs text-fg-3">{t('onboarding.fields.eiin')}</span>
                      <b className="font-mono text-primary">{form.eiin}</b>
                    </div>
                    <div>
                      <span className="block text-xs text-fg-3">{t('onboarding.fields.board')}</span>
                      <b>{lang === 'bn' ? selectedBoardObj?.nameBn : selectedBoardObj?.nameEn}</b>
                    </div>
                    <div>
                      <span className="block text-xs text-fg-3">{t('onboarding.fields.instituteType')}</span>
                      <b>{lang === 'bn' ? selectedTypeObj?.nameBn : selectedTypeObj?.nameEn}</b>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-app p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-fg-3 mb-2">
                    {t('onboarding.fields.reviewStructure')}
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm">
                    <div>
                      <span className="block text-xs text-fg-3">{t('onboarding.fields.shift')}</span>
                      <b>{lang === 'bn' ? selectedShiftObj?.nameBn : selectedShiftObj?.nameEn}</b>
                    </div>
                    <div>
                      <span className="block text-xs text-fg-3">{t('onboarding.fields.medium')}</span>
                      <b>{lang === 'bn' ? selectedMediumObj?.nameBn : selectedMediumObj?.nameEn}</b>
                    </div>
                    <div>
                      <span className="block text-xs text-fg-3">{t('onboarding.fields.academicYear')}</span>
                      <b>{form.academicYear}</b>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-app p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-fg-3 mb-2">
                    {t('onboarding.fields.reviewClasses')}
                  </div>
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {form.selectedClasses.map((cls) => (
                      <span
                        key={cls}
                        className="rounded-full bg-primary-tint/60 px-2.5 py-0.5 text-xs font-semibold text-primary"
                      >
                        {cls}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {form.feeHeads.map((f) => (
                      <div key={f.id} className="rounded bg-surface p-2 text-xs border border-border">
                        <div className="truncate text-fg-3">{f.name}</div>
                        <div className="font-bold text-fg-1 mt-0.5">৳{formatNumber(f.amount, lang)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
            {step > 1 ? (
              <Button variant="secondary" icon={<ChevronLeft size={16} />} onClick={handleBack}>
                {t('onboarding.actions.prev')}
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button variant="primary" icon={<ChevronRight size={16} />} onClick={handleNext}>
                {t('onboarding.actions.next')}
              </Button>
            ) : (
              <Button
                variant="primary"
                icon={busy === 'launch' ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
                disabled={busy !== null}
                onClick={() => void handleLaunch()}
              >
                {busy === 'launch' ? t('onboarding.actions.launching') : t('onboarding.actions.launch')}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
