import { useTranslation } from 'react-i18next'
import {
  CalendarCheck,
  Users,
  Banknote,
  ClipboardList,
  Award,
  UserPlus,
  FileText,
  Download,
  Plus,
  Bell,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { KPI } from '@/components/ui/KPI'
import { BarChart, type Bar } from '@/components/ui/BarChart'
import { Donut } from '@/components/ui/Donut'
import { notificationText } from '@/lib/notification-text'
import { formatTaka, formatNumber, formatDate, formatDateTime, formatRelativeTime, cn } from '@/lib/utils'
import { useStudents } from '@/data/students'
import { useInvoices } from '@/data/fees'
import { useExams } from '@/data/exams'
import { useAssignments } from '@/data/assignments'
import { useAttendanceOverview } from '@/data/attendance'
import { useNotifications } from '@/data/notifications'
import type { AppLanguage } from '@/i18n'

type Tone = 'success' | 'danger' | 'info'

const NOTIF_ICONS: Record<string, { icon: LucideIcon; tone: Tone }> = {
  fee_paid: { icon: Banknote, tone: 'success' },
  attendance_saved: { icon: CalendarCheck, tone: 'info' },
  assignment_published: { icon: FileText, tone: 'info' },
  results_published: { icon: Award, tone: 'success' },
  student_added: { icon: UserPlus, tone: 'info' },
}

const activityToneClass: Record<Tone, string> = {
  success: 'text-success',
  danger: 'text-danger',
  info: 'text-primary',
}

export default function Dashboard() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'en') as AppLanguage

  const studentsQuery = useStudents()
  const invoicesQuery = useInvoices()
  const examsQuery = useExams()
  const assignmentsQuery = useAssignments()
  const attendanceQuery = useAttendanceOverview()
  const notificationsQuery = useNotifications()

  const activity = (notificationsQuery.data ?? []).slice(0, 5)
  const next = [
    ...(examsQuery.data ?? [])
      .filter((e) => e.state === 'scheduled')
      .map((e) => ({
        key: `exam-${e.id}`,
        icon: ClipboardList,
        name: e.name,
        date: e.exam_date ? formatDate(e.exam_date, lang) : '—',
        state: t('badge.scheduled'),
      })),
    ...(assignmentsQuery.data ?? [])
      .filter((a) => a.state === 'open')
      .map((a) => ({
        key: `asn-${a.id}`,
        icon: FileText,
        name: a.title,
        date: a.due_at ? formatDateTime(a.due_at, lang) : '—',
        state: `${formatNumber(a.submitted_count, lang)} ✓`,
      })),
  ].slice(0, 3)

  const students = studentsQuery.data ?? []
  const invoices = invoicesQuery.data ?? []
  const exams = examsQuery.data ?? []
  const days = attendanceQuery.data ?? []

  const classCount = new Set(students.map((s) => s.class_id).filter(Boolean)).size
  const upcomingExams = exams.filter((e) => e.state === 'scheduled').length

  // Attendance: latest saved day drives the KPI; last 6 saved days drive the chart.
  const latestDay = days[days.length - 1]
  const attendancePct = latestDay ? Math.round((latestDay.present / latestDay.total) * 100) : null
  const barData: Bar[] = days.slice(-6).map((d) => ({
    label: new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-US', { weekday: 'short' }).format(new Date(d.date)),
    value: d.total ? Math.round((d.present / d.total) * 100) : 0,
  }))

  // Fees: real sums from invoices.
  const feeTotals = invoices.reduce(
    (a, r) => {
      a.billed += r.amount
      a.paid += r.paid_amount
      const out = r.amount - r.paid_amount
      if (r.status === 'overdue') a.overdue += out
      else if (r.status !== 'paid') a.dueSoon += out
      return a
    },
    { billed: 0, paid: 0, dueSoon: 0, overdue: 0 },
  )
  const pendingFees = feeTotals.billed - feeTotals.paid
  const pendingCount = invoices.filter((r) => r.status !== 'paid').length
  const collectedPct = feeTotals.billed ? Math.round((feeTotals.paid / feeTotals.billed) * 100) : 0
  const feeSegments = [
    { key: 'paid', color: '#16A34A', value: feeTotals.paid, amount: feeTotals.paid },
    { key: 'dueSoon', color: '#D97706', value: feeTotals.dueSoon, amount: feeTotals.dueSoon },
    { key: 'overdue', color: '#DC2626', value: feeTotals.overdue, amount: feeTotals.overdue },
  ] as const

  return (
    <div>
      {/* Page head */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-fg-1">
            {t('dashboard.greeting', { name: 'Priya' })}
          </h1>
          <p className="mt-1 text-sm text-fg-3">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={<Download size={16} />}>
            {t('dashboard.export')}
          </Button>
          <Button variant="primary" icon={<Plus size={16} />}>
            {t('dashboard.quickAdd')}
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPI
          icon={CalendarCheck}
          label={t('dashboard.kpi.attendanceToday')}
          value={attendancePct != null ? `${formatNumber(attendancePct, lang)}%` : '—'}
          delta={attendancePct != null ? t('dashboard.kpi.attendanceDelta', { pct: formatNumber(3, lang) }) : undefined}
          deltaTone="up"
        />
        <KPI
          icon={Users}
          label={t('dashboard.kpi.activeStudents')}
          value={formatNumber(students.length, lang)}
          footer={t('dashboard.kpi.activeStudentsFooter', { count: formatNumber(classCount, lang) })}
        />
        <KPI
          icon={Banknote}
          label={t('dashboard.kpi.pendingFees')}
          value={formatTaka(pendingFees, lang)}
          delta={t('dashboard.kpi.pendingFeesDelta', { count: formatNumber(pendingCount, lang) })}
          deltaTone="down"
        />
        <KPI
          icon={ClipboardList}
          label={t('dashboard.kpi.upcomingExams')}
          value={formatNumber(upcomingExams, lang)}
          footer={t('dashboard.kpi.upcomingExamsFooter')}
        />
      </div>

      {/* Attendance chart + fee donut */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title={t('dashboard.attendanceCard.title')}
          sub={t('dashboard.attendanceCard.sub')}
        >
          {barData.length === 0 ? (
            <div className="grid h-[220px] place-items-center text-sm text-fg-3">{t('dashboard.noAttendanceData')}</div>
          ) : (
            <BarChart data={barData} height={220} formatValue={(v) => formatNumber(v, lang)} />
          )}
        </Card>

        <Card title={t('dashboard.feeCard.title')} sub={t('dashboard.feeCard.sub')}>
          <div className="flex items-center gap-4">
            <Donut
              size={140}
              thickness={18}
              centerValue={`${formatNumber(collectedPct, lang)}%`}
              centerLabel={t('dashboard.feeCard.collected')}
              segments={feeSegments.map((s) => ({ value: s.value, color: s.color }))}
            />
            <div className="flex flex-1 flex-col gap-2.5">
              {feeSegments.map((s) => (
                <div key={s.key} className="flex items-center gap-2 text-[13px]">
                  <span
                    className="h-2.5 w-2.5 rounded-[3px]"
                    style={{ background: s.color }}
                  />
                  <span className="flex-1 text-fg-2">{t(`dashboard.feeCard.${s.key}`)}</span>
                  <span className="font-semibold">{formatTaka(s.amount, lang)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Activity + what's next */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title={t('dashboard.activity.title')}
          actions={
            <Button variant="ghost" size="sm">
              {t('dashboard.activity.viewAll')}
            </Button>
          }
        >
          <div className="flex flex-col">
            {activity.length === 0 ? (
              <div className="py-8 text-center text-sm text-fg-3">{t('dashboard.activityEmpty')}</div>
            ) : (
              activity.map((n, i) => {
                const meta = NOTIF_ICONS[n.type ?? ''] ?? { icon: Bell, tone: 'info' as Tone }
                const Icon = meta.icon
                return (
                  <div
                    key={n.id}
                    className={cn(
                      'flex items-center gap-3 py-2.5',
                      i > 0 && 'border-t border-divider',
                    )}
                  >
                    <span
                      className={cn(
                        'grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-app',
                        activityToneClass[meta.tone],
                      )}
                    >
                      <Icon size={16} />
                    </span>
                    <div className="flex-1 text-sm text-fg-2">{notificationText(n, t, lang)}</div>
                    <span className="shrink-0 text-xs text-fg-3">{formatRelativeTime(n.created_at, lang)}</span>
                  </div>
                )
              })
            )}
          </div>
        </Card>

        <Card
          title={t('dashboard.next.title')}
          actions={
            <Button variant="ghost" size="sm" icon={<Plus size={14} />}>
              {t('dashboard.next.add')}
            </Button>
          }
        >
          <div className="flex flex-col gap-2.5">
            {next.length === 0 ? (
              <div className="py-8 text-center text-sm text-fg-3">{t('dashboard.nextEmpty')}</div>
            ) : (
              next.map((u) => {
                const Icon = u.icon
                return (
                  <div
                    key={u.key}
                    className="flex items-center gap-3 rounded-md border border-divider p-2.5"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-primary-tint text-primary">
                      <Icon size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{u.name}</div>
                      <div className="text-xs text-fg-3">{u.date}</div>
                    </div>
                    <span className="shrink-0 text-[11px] font-medium text-fg-3">{u.state}</span>
                  </div>
                )
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
