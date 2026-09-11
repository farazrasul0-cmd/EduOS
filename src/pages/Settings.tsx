import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Save, User, School, BookOpen, Bell, CreditCard, Plug, Shield, Upload, Plus,
  Pencil, Rocket, ExternalLink, GraduationCap, MessageCircle, Video, LogOut, Loader2,
  KeyRound, QrCode, CheckCircle2, Copy, MessageSquare, Send,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Toggle } from '@/components/ui/Toggle'
import { Modal } from '@/components/ui/Modal'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { useToast } from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase'
import { cn, initials, formatNumber } from '@/lib/utils'
import { calculateSmsParts, sendSms } from '@/lib/sms-gateway'
import { validateBdMobile } from '@/lib/mfs-validation'
import { useAuth } from '@/auth/context'
import { useSchool, useUpdateSchool, useUpdateProfile } from '@/data/school'
import { useClasses, useClassTeachers, useSaveClass, useStudents } from '@/data/students'
import type { AppLanguage } from '@/i18n'
import { DEFAULT_NOTIFICATION_PREFERENCES, useDeliverySummary, useNotificationPreferences, useSaveNotificationPreferences } from '@/data/notification-preferences'
import { useSchoolSubscription, useUpdateSubscription, type SubscriptionPlan } from '@/data/billing'
import { useConfigureIntegration, useSchoolIntegrations, type IntegrationProvider } from '@/data/integrations'

type Tab = 'profile' | 'school' | 'classes' | 'notifications' | 'billing' | 'integrations' | 'security'

const NAV: { id: Tab; icon: LucideIcon }[] = [
  { id: 'profile', icon: User },
  { id: 'school', icon: School },
  { id: 'classes', icon: BookOpen },
  { id: 'notifications', icon: Bell },
  { id: 'billing', icon: CreditCard },
  { id: 'integrations', icon: Plug },
  { id: 'security', icon: Shield },
]

const ADMIN_TABS = new Set<Tab>(['school', 'classes', 'billing', 'integrations'])

const INTEGRATIONS: { key: IntegrationProvider; icon: LucideIcon }[] = [
  { key: 'classroom', icon: GraduationCap },
  { key: 'sslcommerz', icon: CreditCard },
  { key: 'bulksmsbd', icon: MessageSquare },
  { key: 'whatsapp', icon: MessageCircle },
  { key: 'zoom', icon: Video },
]

export default function Settings() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'en') as AppLanguage
  const { user, profile, refreshProfile } = useAuth()
  const schoolQuery = useSchool(profile?.school_id)
  const classesQuery = useClasses()
  const studentsQuery = useStudents()
  const classTeachers = useClassTeachers(profile?.role === 'owner' || profile?.role === 'admin')
  const saveClass = useSaveClass()
  const updateSchool = useUpdateSchool()
  const updateProfile = useUpdateProfile()
  const preferencesQuery = useNotificationPreferences(user?.id)
  const savePreferences = useSaveNotificationPreferences()
  const deliverySummary = useDeliverySummary(user?.id)
  const subscriptionQuery = useSchoolSubscription(profile?.school_id ?? undefined)
  const updateSubscription = useUpdateSubscription()
  const integrationsQuery=useSchoolIntegrations(profile?.school_id??undefined)
  const configureIntegration=useConfigureIntegration()

  const toast = useToast()
  const school = schoolQuery.data ?? null
  const [tab, setTab] = useState<Tab>('profile')
  const [notif, setNotif] = useState({ absent: true, fees: true, reply: true, ai: false })
  const [channels, setChannels] = useState({ sms: false, email: true, whatsapp: false })
  const [notifDirty, setNotifDirty] = useState(false)
  const [security, setSecurity] = useState(() => ({
    alerts: typeof window !== 'undefined' ? localStorage.getItem('eduos.security.alerts') !== 'false' : true,
    timeout: typeof window !== 'undefined' ? localStorage.getItem('eduos.security.timeout') === 'true' : false,
  }))
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false)
  const [signingOutEverywhere, setSigningOutEverywhere] = useState(false)

  const [mfaFactors, setMfaFactors] = useState<{ id: string; status: string; friendly_name?: string }[]>([])
  const [mfaModalOpen, setMfaModalOpen] = useState(false)
  const [mfaEnrolling, setMfaEnrolling] = useState(false)
  const [mfaLoading, setMfaLoading] = useState(false)
  const [mfaFactorId, setMfaFactorId] = useState('')
  const [mfaSecret, setMfaSecret] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [mfaError, setMfaError] = useState('')
  const [copiedSecret, setCopiedSecret] = useState(false)

  const [classDraft, setClassDraft] = useState<{id:string|null;name:string;grade:string;teacherId:string}|null>(null)
  const [classError, setClassError] = useState('')
  const [billingOpen,setBillingOpen]=useState(false)
  const [billingDraft,setBillingDraft]=useState<{plan:SubscriptionPlan;email:string;cancel:boolean}>({plan:'starter',email:'',cancel:false})
  const [billingError,setBillingError]=useState('')
  const [integrationDraft,setIntegrationDraft]=useState<{provider:IntegrationProvider;label:string}|null>(null)
  const [integrationError,setIntegrationError]=useState('')

  const [testSmsModalOpen, setTestSmsModalOpen] = useState(false)
  const [testSmsPhone, setTestSmsPhone] = useState('')
  const [testSmsMessage, setTestSmsMessage] = useState('EduOS SMS Test: আপনার স্কুলের জন্য টেস্ট বার্তা সফলভাবে পাঠানো হয়েছে।')
  const [testSmsSending, setTestSmsSending] = useState(false)

  async function handleSendTestSms() {
    if (!validateBdMobile(testSmsPhone)) {
      toast.error('Enter a valid 11-digit Bangladesh mobile number (01XXXXXXXXX)')
      return
    }
    setTestSmsSending(true)
    try {
      const res = await sendSms(testSmsPhone, testSmsMessage)
      if (res.success) {
        toast.success(t('settings.integrations.testSuccess', { phone: testSmsPhone }))
        setTestSmsModalOpen(false)
      } else {
        toast.error(t('settings.integrations.testFailed', { error: res.error }))
      }
    } finally {
      setTestSmsSending(false)
    }
  }

  // Local edits layered over loaded values (saved on "Save changes").
  const [edits, setEdits] = useState<Record<string, string>>({})
  useEffect(() => { const p=preferencesQuery.data; if(!p)return; const timer=setTimeout(()=>{setNotif({absent:p.absent,fees:p.fees,reply:p.reply,ai:p.ai});setChannels({sms:p.sms,email:p.email,whatsapp:p.whatsapp})},0);return()=>clearTimeout(timer) }, [preferencesQuery.data])
  const val = (key: string, fallback: string | null | undefined) => edits[key] ?? fallback ?? ''
  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setEdits((p) => ({ ...p, [key]: e.target.value }))

  useEffect(() => {
    async function loadMfa() {
      try {
        const { data } = await supabase.auth.mfa.listFactors()
        setMfaFactors(data?.totp ?? [])
      } catch {
        // ignore if session is missing or offline
      }
    }
    if (tab === 'security') void loadMfa()
  }, [tab])

  const classCounts = new Map<string, number>()
  for (const s of studentsQuery.data ?? []) {
    if (s.class_id) classCounts.set(s.class_id, (classCounts.get(s.class_id) ?? 0) + 1)
  }

  const saving = updateSchool.isPending || updateProfile.isPending || savePreferences.isPending
  const isAdmin = profile?.role === 'owner' || profile?.role === 'admin'
  const visibleNav = NAV.filter((item) => isAdmin || !ADMIN_TABS.has(item.id))

  async function submitClass() {
    if(!classDraft?.name.trim()){setClassError(t('settings.classes.invalid'));return}
    try{await saveClass.mutateAsync({id:classDraft.id,name:classDraft.name,grade:classDraft.grade,teacherId:classDraft.teacherId||null});setClassDraft(null);toast.success(t('actions.save'))}catch(error){setClassError(error instanceof Error&&error.message.includes('duplicate_class')?t('settings.classes.duplicate'):t('common.error'))}
  }
  function openBilling(){const s=subscriptionQuery.data;setBillingDraft({plan:s?.plan??'starter',email:s?.billing_email??user?.email??'',cancel:s?.cancel_at_period_end??false});setBillingError('');setBillingOpen(true)}
  async function submitBilling(){if(!profile?.school_id||!billingDraft.email.includes('@')){setBillingError(t('settings.billing.invalid'));return}try{await updateSubscription.mutateAsync({...billingDraft,schoolId:profile.school_id});setBillingOpen(false);toast.success(t('actions.saveChanges'))}catch{setBillingError(t('common.error'))}}
  async function submitIntegration(enabled=true){if(!integrationDraft||!profile?.school_id||enabled&&!integrationDraft.label.trim()){setIntegrationError(t('settings.integrations.accountRequired'));return}try{await configureIntegration.mutateAsync({schoolId:profile.school_id,provider:integrationDraft.provider,label:integrationDraft.label,enabled});setIntegrationDraft(null);toast.success(t('actions.saveChanges'))}catch{setIntegrationError(t('common.error'))}}

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError('')
    if (newPassword.length < 8) {
      setPasswordError(t('settings.security.passwordMinLength'))
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('settings.security.passwordMismatch'))
      return
    }
    setPasswordLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setNewPassword('')
      setConfirmPassword('')
      toast.success(t('settings.security.passwordUpdated'))
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : t('common.error'))
      toast.error(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setPasswordLoading(false)
    }
  }

  async function handleSignOutEverywhere() {
    setSigningOutEverywhere(true)
    try {
      const { error } = await supabase.auth.signOut({ scope: 'others' })
      if (error) throw error
      setSignOutConfirmOpen(false)
      toast.success(t('settings.security.signedOutEverywhere'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setSigningOutEverywhere(false)
    }
  }

  function handleSecurityToggle(key: 'alerts' | 'timeout', value: boolean) {
    setSecurity((prev) => {
      const next = { ...prev, [key]: value }
      try {
        localStorage.setItem(`eduos.security.${key}`, String(value))
      } catch {
        // ignore
      }
      return next
    })
    toast.info(key === 'timeout' ? t('settings.security.sessionTimeoutUpdated') : t('settings.security.signInAlertsUpdated'))
  }

  async function handleStartMfa() {
    setMfaError('')
    setMfaCode('')
    setMfaEnrolling(true)
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'EduOS Authenticator',
      })
      if (error) throw error
      setMfaFactorId(data.id)
      setMfaSecret(data.totp.secret)
      setMfaModalOpen(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setMfaEnrolling(false)
    }
  }

  async function handleVerifyMfa() {
    if (!mfaFactorId || mfaCode.trim().length !== 6) {
      setMfaError(t('settings.security.mfaInvalidCode'))
      return
    }
    setMfaLoading(true)
    setMfaError('')
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId: mfaFactorId })
      if (challenge.error) throw challenge.error
      const verify = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.data.id,
        code: mfaCode.trim(),
      })
      if (verify.error) throw verify.error
      const { data } = await supabase.auth.mfa.listFactors()
      setMfaFactors(data?.totp ?? [])
      setMfaModalOpen(false)
      toast.success(t('settings.security.mfaEnabledSuccess'))
    } catch {
      setMfaError(t('settings.security.mfaInvalidCode'))
    } finally {
      setMfaLoading(false)
    }
  }

  async function handleDisableMfa(factorId: string) {
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId })
      if (error) throw error
      const { data } = await supabase.auth.mfa.listFactors()
      setMfaFactors(data?.totp ?? [])
      toast.success(t('settings.security.mfaDisabledSuccess'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error'))
    }
  }

  async function saveChanges() {
    const jobs: Promise<unknown>[] = []
    if (user && ('fullName' in edits || 'phone' in edits)) {
      jobs.push(
        updateProfile
          .mutateAsync({
            id: user.id,
            update: {
              ...('fullName' in edits ? { full_name: edits.fullName } : {}),
              ...('phone' in edits ? { phone: edits.phone || null } : {}),
            },
          })
          .then(() => refreshProfile()),
      )
    }
    if (school && ['schoolName', 'affiliation', 'address', 'academicYear'].some((k) => k in edits)) {
      jobs.push(
        updateSchool.mutateAsync({
          id: school.id,
          update: {
            ...('schoolName' in edits ? { name: edits.schoolName } : {}),
            ...('affiliation' in edits ? { affiliation: edits.affiliation || null } : {}),
            ...('address' in edits ? { address: edits.address || null } : {}),
            ...('academicYear' in edits ? { academic_year: edits.academicYear || null } : {}),
          },
        }),
      )
    }
    if (notifDirty && user && profile?.school_id) jobs.push(savePreferences.mutateAsync({user_id:user.id,school_id:profile.school_id,...DEFAULT_NOTIFICATION_PREFERENCES,...notif,...channels}))
    if (jobs.length) {
      await Promise.all(jobs)
      setEdits({})
      setNotifDirty(false)
      toast.success(t('actions.saveChanges'))
    }
  }

  return (
    <div>
      <PageHeader
        title={t('settings.title')}
        sub={t('settings.sub')}
        actions={
          <Button
            variant="primary"
            icon={saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            disabled={saving || (Object.keys(edits).length === 0 && !notifDirty)}
            onClick={() => void saveChanges()}
          >
            {saving ? t('common.saving') : t('actions.saveChanges')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex flex-col gap-0.5">
          {visibleNav.map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-left text-sm font-medium transition-colors',
                tab === id ? 'bg-primary-tint text-primary' : 'text-fg-2 hover:bg-neutral-100',
              )}
            >
              <Icon size={16} />
              {t(`settings.nav.${id}`)}
            </button>
          ))}
        </nav>

        <div>
          {tab === 'profile' && (
            <Card title={t('settings.profile.title')} sub={t('settings.profile.sub')}>
              <div className="mb-5 flex items-center gap-4">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-primary text-[22px] font-bold text-white">
                  {profile?.full_name ? initials(profile.full_name) : '—'}
                </span>
                <div>
                  <div className="font-semibold">{profile?.full_name ?? '—'}</div>
                  <div className="text-[13px] text-fg-3">{t('settings.profile.role')}</div>
                </div>
                <Button variant="secondary" size="sm" icon={<Upload size={14} />} className="ml-auto">
                  {t('actions.upload')}
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <Field label={t('settings.profile.fullName')}>
                  <Input value={val('fullName', profile?.full_name)} onChange={set('fullName')} />
                </Field>
                <Field label={t('settings.profile.email')}>
                  <Input value={user?.email ?? ''} readOnly />
                </Field>
                <Field label={t('settings.profile.mobile')}>
                  <Input value={val('phone', profile?.phone)} onChange={set('phone')} placeholder="+880 …" />
                </Field>
                <Field label={t('settings.profile.subject')}>
                  <Input defaultValue="Mathematics" />
                </Field>
              </div>
            </Card>
          )}

          {tab === 'school' && (
            <Card title={t('settings.school.title')}>
              {schoolQuery.isPending ? (
                <div className="grid place-items-center py-10">
                  <Loader2 className="animate-spin text-primary" size={22} />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <Field label={t('settings.school.name')}>
                    <Input value={val('schoolName', school?.name)} onChange={set('schoolName')} />
                  </Field>
                  <Field label={t('settings.school.affiliation')}>
                    <Input value={val('affiliation', school?.affiliation)} onChange={set('affiliation')} />
                  </Field>
                  <Field className="sm:col-span-2" label={t('settings.school.address')}>
                    <Textarea value={val('address', school?.address)} onChange={set('address')} />
                  </Field>
                  <Field label={t('settings.school.academicYear')}>
                    <Input value={val('academicYear', school?.academic_year)} onChange={set('academicYear')} />
                  </Field>
                  <Field label={t('settings.school.currency')}>
                    <Select>
                      <option>{t('settings.school.currencyValue')}</option>
                    </Select>
                  </Field>
                </div>
              )}
            </Card>
          )}

          {tab === 'classes' && (
            <Card
              title={t('settings.classes.title')}
              actions={
                <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => {setClassError('');setClassDraft({id:null,name:'',grade:'',teacherId:''})}}>
                  {t('actions.addClass')}
                </Button>
              }
            >
              {classesQuery.isPending ? (
                <div className="grid place-items-center py-10">
                  <Loader2 className="animate-spin text-primary" size={22} />
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {(classesQuery.data ?? []).map((c) => (
                    <div key={c.id} className="flex items-center gap-3 rounded-md border border-divider p-3.5">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-primary-tint font-bold text-primary">
                        {c.name}
                      </span>
                      <div className="flex-1">
                        <div className="font-semibold">
                          {t('settings.nav.classes')} {c.name}
                          {c.grade ? ` · ${c.grade}` : ''}
                        </div>
                        <div className="text-xs text-fg-3">
                          {t('settings.classes.studentsCount', {
                            count: formatNumber(classCounts.get(c.id) ?? 0, lang),
                          })}
                          {c.teacher_id && ` · ${classTeachers.data?.find((x) => x.id===c.teacher_id)?.full_name ?? t('settings.classes.assignedTeacher')}`}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => {setClassError('');setClassDraft({id:c.id,name:c.name,grade:c.grade??'',teacherId:c.teacher_id??''})}}>
                        {t('actions.edit')}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {tab === 'notifications' && (
            <Card title={t('settings.notifications.title')} sub={t('settings.notifications.sub')}>
              <div className="flex flex-col">
                {([
                  ['absent', 'absentTitle', 'absentSub'],
                  ['fees', 'feesTitle', 'feesSub'],
                  ['reply', 'replyTitle', 'replySub'],
                  ['ai', 'aiTitle', 'aiSub'],
                ] as const).map(([key, titleK, subK], i) => (
                  <div key={key} className={cn('flex items-center py-3', i > 0 && 'border-t border-divider')}>
                    <div className="flex-1">
                      <div className="font-medium">{t(`settings.notifications.items.${titleK}`)}</div>
                      <div className="mt-0.5 text-xs text-fg-3">{t(`settings.notifications.items.${subK}`)}</div>
                    </div>
                    <Toggle on={notif[key]} onChange={(on) => { setNotif((p) => ({ ...p, [key]: on })); setNotifDirty(true) }} />
                  </div>
                ))}
              </div>
              <hr className="my-4 border-border" />
              <div className="mb-2.5 text-[11px] font-medium uppercase tracking-wider text-fg-3">{t('settings.notifications.channels')}</div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {([
                  ['sms', 'smsTitle', 'smsSub'],
                  ['email', 'emailTitle', 'emailSub'],
                  ['whatsapp', 'whatsappTitle', 'whatsappSub'],
                ] as const).map(([key, titleK, subK]) => {
                  const v = channels[key]
                  return (
                    <button
                      key={key}
                      onClick={() => { setChannels((p) => ({ ...p, [key]: !v })); setNotifDirty(true) }}
                      className={cn(
                        'flex items-start gap-2.5 rounded-md border p-3 text-left',
                        v ? 'border-primary bg-primary-tint' : 'border-border',
                      )}
                    >
                      <span className={cn('mt-0.5 h-4 w-4 shrink-0 rounded-full border-2', v ? 'border-primary bg-primary' : 'border-border-strong')} />
                      <div>
                        <div className="text-sm font-semibold text-fg-1">{t(`settings.notifications.channelItems.${titleK}`)}</div>
                        <div className="text-xs text-fg-3">{t(`settings.notifications.channelItems.${subK}`)}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
              <div className="mt-4 rounded-md bg-app p-3 text-xs text-fg-2">{t('settings.notifications.deliverySummary', { pending:formatNumber(deliverySummary.data?.pending ?? 0,lang), sent:formatNumber(deliverySummary.data?.sent ?? 0,lang), failed:formatNumber(deliverySummary.data?.failed ?? 0,lang) })}</div>
            </Card>
          )}

          {tab === 'billing' && (
            <Card title={t('settings.billing.title')}>
              <div className="flex items-center gap-4 rounded-md border border-primary-tint-2 bg-primary-tint p-4">
                <span className="grid h-11 w-11 place-items-center rounded-md bg-primary text-white">
                  <Rocket size={20} />
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-semibold">{t(`settings.billing.plans.${subscriptionQuery.data?.plan??'starter'}`)}<Badge tone={subscriptionQuery.data?.status==='past_due'?'danger':subscriptionQuery.data?.status==='active'?'success':'warning'}>{t(`settings.billing.status.${subscriptionQuery.data?.status??'trialing'}`)}</Badge></div>
                  <div className="text-[13px] text-fg-2">{t('settings.billing.usage',{students:formatNumber(studentsQuery.data?.length??0,lang),price:formatNumber(subscriptionQuery.data?.price_per_student??29,lang),total:formatNumber((studentsQuery.data?.length??0)*(subscriptionQuery.data?.price_per_student??29),lang)})}</div>
                  {subscriptionQuery.data?.current_period_end&&<div className="mt-1 text-xs text-fg-3">{t('settings.billing.renews',{date:subscriptionQuery.data.current_period_end})}</div>}
                </div>
                <Button variant="secondary" size="sm" icon={<ExternalLink size={14} />} onClick={openBilling}>
                  {t('settings.billing.manage')}
                </Button>
              </div>
            </Card>
          )}

          {tab === 'integrations' && (
            <Card title={t('settings.integrations.title')}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {INTEGRATIONS.map(({ key, icon: Icon }) => {
                  const connection=integrationsQuery.data?.find((x)=>x.provider===key)
                  const configured=connection?.status==='configured'
                  return (
                  <div key={key} className="flex items-center gap-3 rounded-md border border-divider p-3.5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-app text-primary">
                      <Icon size={20} />
                    </span>
                    <div className="flex-1">
                      <div className="font-semibold">{t(`settings.integrations.items.${key}Title`)}</div>
                      <div className="text-xs text-fg-3">{t(`settings.integrations.items.${key}Sub`)}</div>
                      {connection?.account_label&&<div className="mt-0.5 text-[11px] text-fg-3">{connection.account_label}</div>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {key === 'bulksmsbd' && configured && (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Send size={14} />}
                          onClick={() => setTestSmsModalOpen(true)}
                        >
                          {t('settings.integrations.testSms')}
                        </Button>
                      )}
                      {configured ? (
                        <Button variant="ghost" size="sm" onClick={()=>{setIntegrationError('');setIntegrationDraft({provider:key,label:connection.account_label??''})}}>{t('settings.integrations.manage')}</Button>
                      ) : (
                        <Button variant="secondary" size="sm" onClick={()=>{setIntegrationError('');setIntegrationDraft({provider:key,label:''})}}>
                          {t('actions.connect')}
                        </Button>
                      )}
                    </div>
                  </div>)
                })}
              </div>
            </Card>
          )}

          {tab === 'security' && (
            <div className="flex flex-col gap-6">
              {/* Password update */}
              <Card title={t('settings.security.passwordTitle')} sub={t('settings.security.passwordSub')}>
                <form onSubmit={(e) => void handleUpdatePassword(e)} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label={t('settings.security.newPassword')}>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={8}
                      />
                    </Field>
                    <Field label={t('settings.security.confirmPassword')}>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={8}
                      />
                    </Field>
                  </div>
                  {passwordError && (
                    <div className="rounded-sm bg-danger-tint px-3 py-2 text-sm text-danger">{passwordError}</div>
                  )}
                  <div>
                    <Button variant="primary" type="submit" disabled={passwordLoading} icon={<KeyRound size={16} />}>
                      {passwordLoading ? t('common.saving') : t('settings.security.updatePassword')}
                    </Button>
                  </div>
                </form>
              </Card>

              {/* Two-factor authentication */}
              <Card title={t('settings.security.mfaTitle')} sub={t('settings.security.mfaSub')}>
                <div className="flex items-center justify-between gap-4 py-2">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-app text-primary">
                      <Shield size={20} />
                    </span>
                    <div>
                      <div className="flex items-center gap-2 font-medium text-fg-1">
                        <span>{t('settings.security.mfaTitle')}</span>
                        {mfaFactors.length > 0 ? (
                          <Badge tone="success">{t('settings.security.mfaStatusActive')}</Badge>
                        ) : (
                          <Badge tone="neutral">{t('settings.security.mfaStatusInactive')}</Badge>
                        )}
                      </div>
                      <div className="text-xs text-fg-3">{t('settings.security.items.twoFaSub')}</div>
                    </div>
                  </div>
                  {mfaFactors.length > 0 ? (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => void handleDisableMfa(mfaFactors[0].id)}
                    >
                      {t('settings.security.disableMfa')}
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={mfaEnrolling}
                      icon={<QrCode size={14} />}
                      onClick={() => void handleStartMfa()}
                    >
                      {mfaEnrolling ? t('common.loading') : t('settings.security.setupMfa')}
                    </Button>
                  )}
                </div>
              </Card>

              {/* Active sessions & session controls */}
              <Card title={t('settings.security.signOutEverywhereTitle')} sub={t('settings.security.signOutEverywhereSub')}>
                <div className="flex flex-col">
                  <div className="flex items-center py-3">
                    <div className="flex-1">
                      <div className="font-medium text-fg-1">{t('settings.security.items.timeoutTitle')}</div>
                      <div className="mt-0.5 text-xs text-fg-3">{t('settings.security.items.timeoutSub')}</div>
                    </div>
                    <Toggle on={security.timeout} onChange={(on) => handleSecurityToggle('timeout', on)} />
                  </div>
                  <div className="flex items-center border-t border-divider py-3">
                    <div className="flex-1">
                      <div className="font-medium text-fg-1">{t('settings.security.items.alertsTitle')}</div>
                      <div className="mt-0.5 text-xs text-fg-3">{t('settings.security.items.alertsSub')}</div>
                    </div>
                    <Toggle on={security.alerts} onChange={(on) => handleSecurityToggle('alerts', on)} />
                  </div>
                </div>
                <hr className="my-4 border-border" />
                <Button variant="danger" icon={<LogOut size={16} />} onClick={() => setSignOutConfirmOpen(true)}>
                  {t('actions.signOutEverywhere')}
                </Button>
              </Card>
            </div>
          )}
        </div>
      </div>
      <Modal open={integrationDraft!=null} onClose={()=>setIntegrationDraft(null)} title={integrationDraft?t(`settings.integrations.items.${integrationDraft.provider}Title`):''} sub={t('settings.integrations.setupSub')} footer={<><Button variant="secondary" onClick={()=>setIntegrationDraft(null)}>{t('actions.cancel')}</Button>{integrationDraft&&integrationsQuery.data?.find((x)=>x.provider===integrationDraft.provider)?.status==='configured'&&<Button variant="danger" disabled={configureIntegration.isPending} onClick={()=>void submitIntegration(false)}>{t('settings.integrations.disconnect')}</Button>}<Button variant="primary" disabled={configureIntegration.isPending} onClick={()=>void submitIntegration(true)}>{configureIntegration.isPending?t('common.saving'):t('settings.integrations.saveSetup')}</Button></>}>
        {integrationDraft&&<><Field label={t('settings.integrations.accountLabel')}><Input value={integrationDraft.label} onChange={(e)=>setIntegrationDraft({...integrationDraft,label:e.target.value})} placeholder={t('settings.integrations.accountPlaceholder')}/></Field><div className="mt-3 rounded-sm bg-warning-tint px-3 py-2 text-xs text-warning">{t('settings.integrations.secretNotice')}</div>{integrationError&&<div className="mt-3 rounded-sm bg-danger-tint px-3 py-2 text-sm text-danger">{integrationError}</div>}</>}
      </Modal>

      {/* Test SMS modal */}
      <Modal
        open={testSmsModalOpen}
        onClose={() => setTestSmsModalOpen(false)}
        title={t('settings.integrations.testSmsModalTitle')}
        sub={t('settings.integrations.testSmsModalSub')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setTestSmsModalOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button
              variant="primary"
              disabled={testSmsSending || !testSmsPhone.trim() || !testSmsMessage.trim()}
              icon={<Send size={14} />}
              onClick={() => void handleSendTestSms()}
            >
              {testSmsSending ? t('settings.integrations.testSending') : t('settings.integrations.testSendBtn')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label={t('settings.integrations.testPhone')}>
            <Input
              type="tel"
              value={testSmsPhone}
              onChange={(e) => setTestSmsPhone(e.target.value)}
              placeholder={t('settings.integrations.testPhonePlaceholder')}
              autoFocus
            />
          </Field>
          <Field label={t('settings.integrations.testMessage')}>
            <Textarea
              rows={3}
              value={testSmsMessage}
              onChange={(e) => setTestSmsMessage(e.target.value)}
            />
            {(() => {
              const calc = calculateSmsParts(testSmsMessage)
              return (
                <div className="mt-1.5 flex items-center justify-between text-xs text-fg-3">
                  <span>
                    Encoding: <strong className="text-fg-1">{calc.encoding}</strong> ({calc.charCount} chars)
                  </span>
                  <span>
                    Parts: <strong className="text-fg-1">{calc.partsCount}</strong> ({calc.remainingInPart} left in part)
                  </span>
                </div>
              )
            })()}
          </Field>
        </div>
      </Modal>
      <Modal open={billingOpen} onClose={()=>setBillingOpen(false)} title={t('settings.billing.manageTitle')} sub={t('settings.billing.manageSub')} footer={<><Button variant="secondary" onClick={()=>setBillingOpen(false)}>{t('actions.cancel')}</Button><Button variant="primary" disabled={updateSubscription.isPending} onClick={()=>void submitBilling()}>{updateSubscription.isPending?t('common.saving'):t('actions.saveChanges')}</Button></>}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{(['starter','growth','school'] as SubscriptionPlan[]).map((plan)=><button type="button" key={plan} onClick={()=>setBillingDraft({...billingDraft,plan})} className={cn('rounded-md border p-3 text-left',billingDraft.plan===plan?'border-primary bg-primary-tint':'border-border')}><div className="font-semibold">{t(`settings.billing.plans.${plan}`)}</div><div className="text-xs text-fg-3">{t(`settings.billing.planPrices.${plan}`)}</div></button>)}</div>
        <div className="mt-4"><Field label={t('settings.billing.email')}><Input type="email" value={billingDraft.email} onChange={(e)=>setBillingDraft({...billingDraft,email:e.target.value})}/></Field></div>
        <label className="mt-4 flex items-center justify-between gap-3 rounded-md border border-divider p-3"><div><div className="text-sm font-medium">{t('settings.billing.cancelTitle')}</div><div className="text-xs text-fg-3">{t('settings.billing.cancelSub')}</div></div><Toggle on={billingDraft.cancel} onChange={(cancel)=>setBillingDraft({...billingDraft,cancel})}/></label>
        {billingError&&<div className="mt-3 rounded-sm bg-danger-tint px-3 py-2 text-sm text-danger">{billingError}</div>}
      </Modal>
      <Modal open={classDraft!=null} onClose={()=>setClassDraft(null)} title={classDraft?.id?t('settings.classes.editTitle'):t('settings.classes.addTitle')} footer={<><Button variant="secondary" onClick={()=>setClassDraft(null)}>{t('actions.cancel')}</Button><Button variant="primary" disabled={saveClass.isPending} onClick={()=>void submitClass()}>{saveClass.isPending?t('common.saving'):t('actions.save')}</Button></>}>
        {classDraft&&<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('settings.classes.name')}><Input value={classDraft.name} onChange={(e)=>setClassDraft({...classDraft,name:e.target.value})} placeholder="7-A"/></Field>
          <Field label={t('settings.classes.grade')}><Input value={classDraft.grade} onChange={(e)=>setClassDraft({...classDraft,grade:e.target.value})} placeholder="7"/></Field>
          <div className="sm:col-span-2"><Field label={t('settings.classes.teacher')}><Select value={classDraft.teacherId} onChange={(e)=>setClassDraft({...classDraft,teacherId:e.target.value})}><option value="">{t('settings.classes.unassigned')}</option>{(classTeachers.data??[]).map((teacher)=><option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>)}</Select></Field></div>
          {classError&&<div className="sm:col-span-2 rounded-sm bg-danger-tint px-3 py-2 text-sm text-danger">{classError}</div>}
        </div>}
      </Modal>

      {/* Sign out everywhere modal */}
      <Modal
        open={signOutConfirmOpen}
        onClose={() => setSignOutConfirmOpen(false)}
        title={t('settings.security.signOutConfirmTitle')}
        sub={t('settings.security.signOutConfirmDesc')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSignOutConfirmOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button
              variant="danger"
              disabled={signingOutEverywhere}
              icon={<LogOut size={16} />}
              onClick={() => void handleSignOutEverywhere()}
            >
              {signingOutEverywhere ? t('common.loading') : t('actions.signOutEverywhere')}
            </Button>
          </>
        }
      >
        <div className="text-sm text-fg-2">
          {t('settings.security.signOutConfirmDesc')}
        </div>
      </Modal>

      {/* MFA setup modal */}
      <Modal
        open={mfaModalOpen}
        onClose={() => setMfaModalOpen(false)}
        title={t('settings.security.mfaModalTitle')}
        sub={t('settings.security.mfaModalSub')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setMfaModalOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button
              variant="primary"
              disabled={mfaLoading || mfaCode.trim().length !== 6}
              onClick={() => void handleVerifyMfa()}
            >
              {mfaLoading ? t('common.saving') : t('settings.security.verifyAndEnable')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-fg-3">
              {t('settings.security.mfaSecretKey')}
            </label>
            <div className="mt-1.5 flex items-center justify-between rounded-md border border-border bg-app px-3 py-2 font-mono text-xs">
              <span className="select-all tracking-wider text-fg-1">{mfaSecret}</span>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(mfaSecret)
                  setCopiedSecret(true)
                  setTimeout(() => setCopiedSecret(false), 2000)
                }}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                {copiedSecret ? <CheckCircle2 size={14} className="text-success" /> : <Copy size={14} />}
                <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <Field label={t('settings.security.mfaVerificationCode')}>
            <Input
              type="text"
              maxLength={6}
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
              placeholder={t('settings.security.mfaCodePlaceholder')}
              className="font-mono text-center tracking-widest text-lg"
              autoFocus
            />
          </Field>

          {mfaError && (
            <div className="rounded-sm bg-danger-tint px-3 py-2 text-sm text-danger">{mfaError}</div>
          )}
        </div>
      </Modal>
    </div>
  )
}
