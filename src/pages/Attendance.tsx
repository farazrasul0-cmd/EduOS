import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, UserCheck, UserX, Clock, Save, Check, X, Loader2, CalendarDays, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { KPI } from '@/components/ui/KPI'
import { Avatar } from '@/components/ui/Avatar'
import { Donut } from '@/components/ui/Donut'
import { Toggle } from '@/components/ui/Toggle'
import { formatDate, formatNumber, cn } from '@/lib/utils'
import { useStudents } from '@/data/students'
import { useAttendance, useAttendanceOverview, useSaveAttendance, type SaveAttendanceRow } from '@/data/attendance'
import { attendanceCounts, attendanceErrorMessage, hasAttendanceChanges, type AttendanceStatusMap } from '@/lib/attendance'
import type { AppLanguage } from '@/i18n'
import type { AttendanceStatus } from '@/types/models'

type Status = AttendanceStatus

const STATUS_META: Record<Status, { icon: LucideIcon; color: string; tint: string }> = {
  present: { icon: Check, color: '#16A34A', tint: '#DCFCE7' },
  absent: { icon: X, color: '#DC2626', tint: '#FEE2E2' },
  late: { icon: Clock, color: '#D97706', tint: '#FEF3C7' },
  leave: { icon: CalendarDays, color: '#2563EB', tint: '#DBEAFE' },
}
const STATUS_ORDER: Status[] = ['present', 'absent', 'late', 'leave']

export default function Attendance() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'en') as AppLanguage

  const [date, setDate] = useState('2026-05-25') // seeded date shows real records
  const studentsQuery = useStudents()
  const attendanceQuery = useAttendance(date)
  const overviewQuery = useAttendanceOverview()
  const saveAttendance = useSaveAttendance()

  // Local edits layered over the saved (server) status — no effect needed.
  const [overrides, setOverrides] = useState<Record<string, Status>>({})
  const [notifyParents, setNotifyParents] = useState(true)
  const [savedMessage, setSavedMessage] = useState(false)

  const students = studentsQuery.data ?? []

  const serverStatus = useMemo(() => {
    const m = new Map<string, AttendanceStatus>()
    for (const a of attendanceQuery.data ?? []) {
      m.set(a.student_id, a.status)
    }
    return m
  }, [attendanceQuery.data])

  const statusFor = (id: string): Status => overrides[id] ?? serverStatus.get(id) ?? 'present'

  const total = students.length
  const currentStatuses = Object.fromEntries(students.map((student) => [student.id, statusFor(student.id)])) as AttendanceStatusMap
  const counts = attendanceCounts(Object.values(currentStatuses))
  const hasChanges = hasAttendanceChanges(students.map((student) => student.id), serverStatus, currentStatuses)
  const pct = total ? Math.round((counts.present / total) * 100) : 0

  function changeDate(next: string) {
    setDate(next)
    setOverrides({})
    setSavedMessage(false)
    saveAttendance.reset()
  }
  function shiftDate(days: number) {
    const next = new Date(`${date}T12:00:00`)
    next.setDate(next.getDate() + days)
    changeDate(next.toISOString().slice(0, 10))
  }
  function markAllPresent() {
    const next: Record<string, Status> = {}
    for (const s of students) next[s.id] = 'present'
    setOverrides(next)
  }
  function save() {
    const rows: SaveAttendanceRow[] = students.map((s) => ({
      school_id: s.school_id,
      student_id: s.id,
      class_id: s.class_id,
      date,
      status: statusFor(s.id) as AttendanceStatus,
    }))
    if (rows.length) saveAttendance.mutate(
      { rows, notifyParents },
      { onSuccess: () => { setOverrides({}); setSavedMessage(true) } },
    )
  }
  function exportHistory() {
    const lines = ['date,total,present,absent,late,leave', ...(overviewQuery.data ?? []).map((day) =>
      [day.date, day.total, day.present, day.absent, day.late, day.leave].join(','),
    )]
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'attendance-history.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const loading = studentsQuery.isPending || attendanceQuery.isPending

  return (
    <div>
      <PageHeader
        title={t('attendance.title')}
        sub={t('attendance.sub')}
        actions={
          <>
            <div className="flex items-center">
              <Button variant="secondary" aria-label={t('actions.previous')} onClick={() => shiftDate(-1)}><ChevronLeft size={16} /></Button>
              <input
                type="date"
                value={date}
                onChange={(e) => changeDate(e.target.value)}
                className="mx-1 h-9 rounded-sm border border-border-strong bg-surface px-3 text-sm text-fg-1 outline-none focus:border-primary"
              />
              <Button variant="secondary" aria-label={t('actions.next')} onClick={() => shiftDate(1)}><ChevronRight size={16} /></Button>
            </div>
            <Button variant="secondary" icon={<Users size={16} />} onClick={markAllPresent}>
              {t('actions.markAllPresent')}
            </Button>
            <Button
              variant="primary"
              icon={saveAttendance.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              disabled={saveAttendance.isPending || loading || !hasChanges}
              onClick={save}
            >
              {saveAttendance.isPending ? t('common.saving') : t('actions.saveAttendance')}
            </Button>
          </>
        }
      />

      {(savedMessage || saveAttendance.isError) && (
        <div className={cn('mb-4 rounded-sm border px-3 py-2 text-sm', saveAttendance.isError ? 'border-danger/30 bg-danger/5 text-danger' : 'border-success/30 bg-success/5 text-success')} role="status">
          {saveAttendance.isError ? t('attendance.saveError', { error: attendanceErrorMessage(saveAttendance.error) }) : t('attendance.saved')}
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPI icon={Users} label={t('attendance.kpi.total')} value={formatNumber(total, lang)} />
        <KPI icon={UserCheck} label={t('attendance.kpi.present')} value={formatNumber(counts.present, lang)} delta={`${formatNumber(pct, lang)}%`} deltaTone="up" />
        <KPI icon={UserX} label={t('attendance.kpi.absent')} value={formatNumber(counts.absent, lang)} delta={t('attendance.kpi.needsAttention')} deltaTone="down" />
        <KPI icon={Clock} label={t('attendance.kpi.late')} value={formatNumber(counts.late, lang)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" title={t('attendance.markTitle')} sub={t('attendance.markSub')}>
          {loading ? (
            <div className="grid place-items-center py-12">
              <Loader2 className="animate-spin text-primary" size={22} />
            </div>
          ) : students.length === 0 ? (
            <div className="py-8 text-center text-sm text-fg-3">{t('students.empty')}</div>
          ) : (
            <div className="flex flex-col">
              {students.map((s, i) => (
                <div key={s.id} className={cn('flex flex-wrap items-center gap-3 py-3', i > 0 && 'border-t border-divider')}>
                  <span className="w-12 text-xs font-medium text-fg-3">{s.roll_no ?? '—'}</span>
                  <div className="flex flex-1 items-center gap-2.5">
                    <Avatar name={s.full_name} />
                    <div className="font-semibold">{s.full_name}</div>
                  </div>
                  <div className="flex gap-1.5">
                    {STATUS_ORDER.map((k) => {
                      const m = STATUS_META[k]
                      const active = statusFor(s.id) === k
                      const Icon = m.icon
                      return (
                        <button
                          key={k}
                          onClick={() => setOverrides((prev) => ({ ...prev, [s.id]: k }))}
                          className="inline-flex h-[30px] items-center gap-1.5 rounded-sm border px-2.5 text-xs font-semibold"
                          style={{
                            borderColor: active ? m.color : 'var(--border-default)',
                            background: active ? m.tint : '#fff',
                            color: active ? m.color : 'var(--fg-2)',
                          }}
                        >
                          <Icon size={14} />
                          {t(`attendance.status.${k}`)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          <Card title={t('attendance.summaryTitle')}>
            <div className="flex items-center gap-4">
              <Donut
                size={120}
                thickness={16}
                centerValue={`${formatNumber(pct, lang)}%`}
                centerLabel={t('attendance.summaryCenter')}
                segments={[
                  { value: counts.present, color: '#16A34A' },
                  { value: counts.late, color: '#D97706' },
                  { value: counts.absent, color: '#DC2626' },
                  { value: counts.leave, color: '#2563EB' },
                ]}
              />
              <div className="flex flex-1 flex-col gap-2 text-[13px]">
                {([
                  ['present', '#16A34A', counts.present],
                  ['late', '#D97706', counts.late],
                  ['absent', '#DC2626', counts.absent],
                  ['leave', '#2563EB', counts.leave],
                ] as const).map(([k, c, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-[2px]" style={{ background: c }} />
                      {t(`attendance.status.${k}`)}
                    </span>
                    <b>{formatNumber(v, lang)}</b>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card title={t('attendance.notifyTitle')}>
            <p className="mb-3 text-[13px] leading-5 text-fg-2">{t('attendance.notifyBody')}</p>
            <div className="flex items-center justify-between py-2">
              <span className="text-[13px]">{t('attendance.notify.portal')}</span>
              <Toggle on={notifyParents} onChange={setNotifyParents} />
            </div>
            <p className="border-t border-divider pt-3 text-xs text-fg-3">{t('attendance.notifyExternalPending')}</p>
          </Card>
        </div>
      </div>

      <Card className="mt-4" title={t('attendance.historyTitle')} sub={t('attendance.historySub')} actions={<Button variant="secondary" icon={<Download size={15} />} onClick={exportHistory} disabled={!overviewQuery.data?.length}>{t('actions.export')}</Button>}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-divider text-xs text-fg-3"><th className="py-2">{t('attendance.history.date')}</th><th>{t('attendance.kpi.total')}</th><th>{t('attendance.status.present')}</th><th>{t('attendance.status.absent')}</th><th>{t('attendance.status.late')}</th><th>{t('attendance.status.leave')}</th></tr></thead>
            <tbody>{[...(overviewQuery.data ?? [])].reverse().map((day) => <tr key={day.date} className="cursor-pointer border-b border-divider last:border-0 hover:bg-surface-2" onClick={() => changeDate(day.date)}><td className="py-2 font-medium">{formatDate(day.date, lang)}</td><td>{formatNumber(day.total, lang)}</td><td>{formatNumber(day.present, lang)}</td><td>{formatNumber(day.absent, lang)}</td><td>{formatNumber(day.late, lang)}</td><td>{formatNumber(day.leave, lang)}</td></tr>)}</tbody>
          </table>
          {!overviewQuery.isPending && !overviewQuery.data?.length && <div className="py-6 text-center text-sm text-fg-3">{t('attendance.historyEmpty')}</div>}
        </div>
      </Card>
    </div>
  )
}
