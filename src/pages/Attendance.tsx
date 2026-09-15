import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Users, UserCheck, UserX, Clock, Save, Check, X, Loader2, CalendarDays,
  Download, ChevronLeft, ChevronRight, Send, Smartphone,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { KPI } from '@/components/ui/KPI'
import { Avatar } from '@/components/ui/Avatar'
import { Donut } from '@/components/ui/Donut'
import { Toggle } from '@/components/ui/Toggle'
import { Modal } from '@/components/ui/Modal'
import { Empty } from '@/components/ui/Empty'
import { Segmented } from '@/components/ui/Segmented'
import { TableWrap, Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { formatDate, formatNumber, cn } from '@/lib/utils'
import { useStudents } from '@/data/students'
import {
  useAttendance,
  useAttendanceOverview,
  useMonthlyAttendance,
  useSaveAttendance,
  type SaveAttendanceRow,
} from '@/data/attendance'
import {
  attendanceCounts,
  attendanceErrorMessage,
  hasAttendanceChanges,
  getAttendanceCollegiateStatus,
  generateAbsentSmsText,
  createMonthlyAttendancePdf,
  type AttendanceStatusMap,
  type CollegiateStatus,
  type MonthlyAttendanceStudentRow,
} from '@/lib/attendance'
import { calculateSmsParts, sendSms } from '@/lib/sms-gateway'
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

  const [tab, setTab] = useState<'daily' | 'monthly' | 'defaulters'>('daily')
  const [date, setDate] = useState('2026-05-25') // seeded date shows real records
  const [month, setMonth] = useState('2026-05')

  const studentsQuery = useStudents()
  const attendanceQuery = useAttendance(date)
  const overviewQuery = useAttendanceOverview()
  const monthlyQuery = useMonthlyAttendance(month)
  const saveAttendance = useSaveAttendance()

  // Local edits layered over the saved status
  const [overrides, setOverrides] = useState<Record<string, Status>>({})
  const [notifyParents, setNotifyParents] = useState(true)
  const [savedMessage, setSavedMessage] = useState(false)

  // SMS Modal State
  const [smsModalOpen, setSmsModalOpen] = useState(false)
  const [smsSending, setSmsSending] = useState(false)
  const [smsResultToast, setSmsResultToast] = useState<string | null>(null)

  const students = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data])

  const serverStatus = useMemo(() => {
    const m = new Map<string, AttendanceStatus>()
    for (const a of attendanceQuery.data ?? []) {
      m.set(a.student_id, a.status)
    }
    return m
  }, [attendanceQuery.data])

  const statusFor = (id: string): Status => overrides[id] ?? serverStatus.get(id) ?? 'present'

  const total = students.length
  const currentStatuses = Object.fromEntries(
    students.map((student) => [student.id, statusFor(student.id)]),
  ) as AttendanceStatusMap
  const counts = attendanceCounts(Object.values(currentStatuses))
  const hasChanges = hasAttendanceChanges(
    students.map((student) => student.id),
    serverStatus,
    currentStatuses,
  )
  const pct = total ? Math.round((counts.present / total) * 100) : 0

  // Absent students for today
  const absentStudents = students.filter((s) => statusFor(s.id) === 'absent')

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

  function handleSaveClick() {
    if (notifyParents && absentStudents.length > 0) {
      setSmsModalOpen(true)
    } else {
      executeSave(false)
    }
  }

  function executeSave(dispatchSms: boolean) {
    const rows: SaveAttendanceRow[] = students.map((s) => ({
      school_id: s.school_id,
      student_id: s.id,
      class_id: s.class_id,
      date,
      status: statusFor(s.id) as AttendanceStatus,
    }))

    if (!rows.length) return

    saveAttendance.mutate(
      { rows, notifyParents: dispatchSms },
      {
        onSuccess: async () => {
          setOverrides({})
          setSavedMessage(true)
          setSmsModalOpen(false)

          if (dispatchSms && absentStudents.length > 0) {
            setSmsSending(true)
            for (const st of absentStudents) {
              const text = generateAbsentSmsText(
                { name: st.full_name, roll: st.roll_no, className: '7-A' },
                t('app.school'),
                date,
                lang,
                '01711000000',
              )
              await sendSms('01700000000', text)
            }
            setSmsSending(false)
            setSmsResultToast(t('attendance.smsModal.sentSuccess'))
          }
        },
      },
    )
  }

  // Monthly aggregated data per student
  const monthlyStudentRows = useMemo(() => {
    const records = monthlyQuery.data ?? []
    return students.map((st) => {
      const studentRecords = records.filter((r) => r.student_id === st.id)
      const presentCount = studentRecords.filter((r) => r.status === 'present').length
      const absentCount = studentRecords.filter((r) => r.status === 'absent').length
      const lateCount = studentRecords.filter((r) => r.status === 'late').length
      const leaveCount = studentRecords.filter((r) => r.status === 'leave').length
      const totalMarked = presentCount + absentCount + lateCount + leaveCount
      const rate = totalMarked > 0 ? Number(((presentCount / totalMarked) * 100).toFixed(1)) : 100
      const status: CollegiateStatus = getAttendanceCollegiateStatus(rate)

      const dailyStatus: Record<number, 'P' | 'A' | 'L' | 'W' | 'H'> = {}
      studentRecords.forEach((r) => {
        if (!r.date) return
        const dayNum = parseInt(r.date.slice(8, 10), 10)
        if (r.status === 'present') dailyStatus[dayNum] = 'P'
        else if (r.status === 'absent') dailyStatus[dayNum] = 'A'
        else if (r.status === 'late') dailyStatus[dayNum] = 'L'
        else if (r.status === 'leave') dailyStatus[dayNum] = 'H'
      })

      return {
        studentId: st.id,
        studentName: st.full_name,
        rollNo: st.roll_no ?? '—',
        presentCount,
        absentCount,
        lateCount,
        leaveCount,
        totalMarked,
        attendanceRate: rate,
        collegiateStatus: status,
        dailyStatus,
      }
    })
  }, [students, monthlyQuery.data])

  // Defaulters (< 75% attendance)
  const defaulters = monthlyStudentRows.filter((r) => r.attendanceRate < 75)

  function downloadMonthlyRegisterPdf() {
    const [y, m] = month.split('-')
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ]
    const monthName = monthNames[parseInt(m, 10) - 1] || 'Month'

    const rows: MonthlyAttendanceStudentRow[] = monthlyStudentRows.map((r) => ({
      studentName: r.studentName,
      rollNo: r.rollNo,
      dailyStatus: r.dailyStatus,
      presentCount: r.presentCount,
      absentCount: r.absentCount,
      attendanceRate: r.attendanceRate,
      collegiateStatus: r.collegiateStatus,
    }))

    const pdfBytes = createMonthlyAttendancePdf({
      schoolName: t('app.school'),
      schoolAddress: 'Dhaka, Bangladesh',
      eiin: '134201',
      className: 'Class 7',
      sectionName: 'A',
      monthName,
      year: y,
      totalWorkingDays: 24,
      daysInMonth: 31,
      rows,
    })

    const url = URL.createObjectURL(new Blob([pdfBytes as BlobPart], { type: 'application/pdf' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `attendance-register-${month}.pdf`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function exportMonthlyRegisterCsv() {
    const header = 'roll,student_name,present_days,absent_days,attendance_rate,collegiate_status'
    const csvRows = monthlyStudentRows.map((r) =>
      [
        r.rollNo,
        JSON.stringify(r.studentName),
        r.presentCount,
        r.absentCount,
        `${r.attendanceRate}%`,
        r.collegiateStatus,
      ].join(','),
    )
    const csv = [header, ...csvRows].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `monthly-attendance-${month}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function exportHistory() {
    const lines = [
      'date,total,present,absent,late,leave',
      ...(overviewQuery.data ?? []).map((day) =>
        [day.date, day.total, day.present, day.absent, day.late, day.leave].join(','),
      ),
    ]
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'attendance-history.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const sampleAbsentSms = absentStudents[0]
    ? generateAbsentSmsText(
        { name: absentStudents[0].full_name, roll: absentStudents[0].roll_no, className: '7-A' },
        t('app.school'),
        date,
        lang,
        '01711000000',
      )
    : ''
  const smsStats = sampleAbsentSms ? calculateSmsParts(sampleAbsentSms) : null

  const loading = studentsQuery.isPending || attendanceQuery.isPending

  return (
    <div>
      <PageHeader
        title={t('attendance.title')}
        sub={t('attendance.sub')}
        actions={
          tab === 'daily' ? (
            <>
              <div className="flex items-center">
                <Button variant="secondary" aria-label={t('actions.previous')} onClick={() => shiftDate(-1)}>
                  <ChevronLeft size={16} />
                </Button>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => changeDate(e.target.value)}
                  className="mx-1 h-9 rounded-sm border border-border-strong bg-surface px-3 text-sm text-fg-1 outline-none focus:border-primary"
                />
                <Button variant="secondary" aria-label={t('actions.next')} onClick={() => shiftDate(1)}>
                  <ChevronRight size={16} />
                </Button>
              </div>
              <Button variant="secondary" icon={<Users size={16} />} onClick={markAllPresent}>
                {t('actions.markAllPresent')}
              </Button>
              <Button
                variant="primary"
                icon={saveAttendance.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                disabled={saveAttendance.isPending || loading || !hasChanges}
                onClick={handleSaveClick}
              >
                {saveAttendance.isPending ? t('common.saving') : t('actions.saveAttendance')}
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="h-9 rounded-sm border border-border-strong bg-surface px-3 text-sm text-fg-1 outline-none focus:border-primary"
              />
              <Button variant="primary" icon={<Download size={15} />} onClick={downloadMonthlyRegisterPdf}>
                {t('attendance.downloadMonthlyPdf')}
              </Button>
              <Button variant="secondary" icon={<Download size={15} />} onClick={exportMonthlyRegisterCsv}>
                {t('attendance.exportMonthlyCsv')}
              </Button>
            </div>
          )
        }
      />

      <div className="mb-4">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { label: t('attendance.tabs.daily'), value: 'daily' },
            { label: t('attendance.tabs.monthly'), value: 'monthly' },
            {
              label: `${t('attendance.tabs.defaulters')} (${formatNumber(defaulters.length, lang)})`,
              value: 'defaulters',
            },
          ]}
        />
      </div>

      {(savedMessage || saveAttendance.isError || smsResultToast) && (
        <div
          className={cn(
            'mb-4 rounded-sm border px-3 py-2 text-sm',
            saveAttendance.isError
              ? 'border-danger/30 bg-danger/5 text-danger'
              : 'border-success/30 bg-success/5 text-success',
          )}
          role="status"
        >
          {saveAttendance.isError
            ? t('attendance.saveError', { error: attendanceErrorMessage(saveAttendance.error) })
            : smsResultToast || t('attendance.saved')}
        </div>
      )}

      {tab === 'daily' && (
        <>
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KPI icon={Users} label={t('attendance.kpi.total')} value={formatNumber(total, lang)} />
            <KPI
              icon={UserCheck}
              label={t('attendance.kpi.present')}
              value={formatNumber(counts.present, lang)}
              delta={`${formatNumber(pct, lang)}%`}
              deltaTone="up"
            />
            <KPI
              icon={UserX}
              label={t('attendance.kpi.absent')}
              value={formatNumber(counts.absent, lang)}
              delta={t('attendance.kpi.needsAttention')}
              deltaTone="down"
            />
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
                    <div
                      key={s.id}
                      className={cn('flex flex-wrap items-center gap-3 py-3', i > 0 && 'border-t border-divider')}
                    >
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
                              className="inline-flex h-[30px] items-center gap-1.5 rounded-sm border px-2.5 text-xs font-semibold cursor-pointer transition-colors"
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
                  <span className="text-[13px] font-medium">{t('attendance.notify.sms')}</span>
                  <Toggle on={notifyParents} onChange={setNotifyParents} />
                </div>
                {notifyParents && (
                  <div className="mt-2 rounded-sm bg-primary-tint/30 p-2.5 text-xs text-fg-2 flex items-center gap-2">
                    <Smartphone size={15} className="text-primary shrink-0" />
                    <span>Instant BTRC SMS alerts dispatched to guardians upon saving.</span>
                  </div>
                )}
              </Card>
            </div>
          </div>

          <Card
            className="mt-4"
            title={t('attendance.historyTitle')}
            sub={t('attendance.historySub')}
            actions={
              <Button
                variant="secondary"
                icon={<Download size={15} />}
                onClick={exportHistory}
                disabled={!overviewQuery.data?.length}
              >
                {t('actions.export')}
              </Button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-divider text-xs text-fg-3">
                    <th className="py-2">{t('attendance.history.date')}</th>
                    <th>{t('attendance.kpi.total')}</th>
                    <th>{t('attendance.status.present')}</th>
                    <th>{t('attendance.status.absent')}</th>
                    <th>{t('attendance.status.late')}</th>
                    <th>{t('attendance.status.leave')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...(overviewQuery.data ?? [])].reverse().map((day) => (
                    <tr
                      key={day.date}
                      className="cursor-pointer border-b border-divider last:border-0 hover:bg-surface-2"
                      onClick={() => changeDate(day.date)}
                    >
                      <td className="py-2 font-medium">{formatDate(day.date, lang)}</td>
                      <td>{formatNumber(day.total, lang)}</td>
                      <td>{formatNumber(day.present, lang)}</td>
                      <td>{formatNumber(day.absent, lang)}</td>
                      <td>{formatNumber(day.late, lang)}</td>
                      <td>{formatNumber(day.leave, lang)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!overviewQuery.isPending && !overviewQuery.data?.length && (
                <div className="py-6 text-center text-sm text-fg-3">{t('attendance.historyEmpty')}</div>
              )}
            </div>
          </Card>
        </>
      )}

      {tab === 'monthly' && (
        <TableWrap>
          <Table className="min-w-[700px]">
            <THead>
              <TR>
                <TH className="w-16">{t('results.table.roll')}</TH>
                <TH>{t('results.table.student')}</TH>
                <TH num>{t('attendance.totalPresent')}</TH>
                <TH num>{t('attendance.totalAbsent')}</TH>
                <TH num>{t('attendance.attendanceRate')}</TH>
                <TH>{t('attendance.monthlyRegister')}</TH>
              </TR>
            </THead>
            <TBody>
              {monthlyQuery.isPending ? (
                <TR>
                  <TD className="py-10 text-center" colSpan={6}>
                    <Loader2 className="mx-auto animate-spin text-primary" size={22} />
                  </TD>
                </TR>
              ) : monthlyStudentRows.length === 0 ? (
                <TR>
                  <TD className="py-8 text-center text-sm text-fg-3" colSpan={6}>
                    {t('students.empty')}
                  </TD>
                </TR>
              ) : (
                monthlyStudentRows.map((st) => (
                  <TR key={st.studentId}>
                    <TD className="text-xs font-semibold text-fg-3">{st.rollNo}</TD>
                    <TD>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={st.studentName} />
                        <div className="font-semibold">{st.studentName}</div>
                      </div>
                    </TD>
                    <TD num className="font-medium text-success">
                      {formatNumber(st.presentCount, lang)}
                    </TD>
                    <TD num className={cn(st.absentCount > 0 && 'font-medium text-danger')}>
                      {formatNumber(st.absentCount, lang)}
                    </TD>
                    <TD num className="font-bold">
                      {formatNumber(st.attendanceRate, lang)}%
                    </TD>
                    <TD>
                      <span
                        className={cn(
                          'rounded-sm px-2 py-0.5 text-xs font-bold',
                          st.collegiateStatus === 'collegiate'
                            ? 'bg-success-tint text-success'
                            : st.collegiateStatus === 'non_collegiate'
                            ? 'bg-warning-tint text-warning'
                            : 'bg-danger-tint text-danger',
                        )}
                      >
                        {t(`attendance.collegiate.${st.collegiateStatus === 'non_collegiate' ? 'nonCollegiate' : st.collegiateStatus === 'dis_collegiate' ? 'disCollegiate' : 'collegiate'}`)}
                      </span>
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </TableWrap>
      )}

      {tab === 'defaulters' && (
        <div>
          {defaulters.length === 0 ? (
            <Card>
              <Empty
                icon={Check}
                title="No attendance defaulters"
                sub="All students in this class have achieved >= 75% attendance in this period."
              />
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {defaulters.map((st) => (
                <Card key={st.studentId}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={st.studentName} />
                      <div>
                        <div className="font-semibold">{st.studentName}</div>
                        <div className="text-xs text-fg-3">{st.rollNo}</div>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'rounded-sm px-2 py-0.5 text-xs font-bold',
                        st.collegiateStatus === 'non_collegiate'
                          ? 'bg-warning-tint text-warning'
                          : 'bg-danger-tint text-danger',
                      )}
                    >
                      {st.collegiateStatus === 'non_collegiate' ? 'Non-Collegiate' : 'Dis-Collegiate'}
                    </span>
                  </div>

                  <div className="my-4 grid grid-cols-2 gap-3 rounded-sm bg-app p-3 text-sm">
                    <div>
                      <span className="block text-xs text-fg-3">Attendance Rate</span>
                      <b className="text-danger">{formatNumber(st.attendanceRate, lang)}%</b>
                    </div>
                    <div>
                      <span className="block text-xs text-fg-3">Total Absences</span>
                      <b>{formatNumber(st.absentCount, lang)} days</b>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    icon={<Smartphone size={14} />}
                    className="w-full text-xs"
                    onClick={() => {
                      const text = generateAbsentSmsText(
                        { name: st.studentName, roll: st.rollNo, className: '7-A' },
                        t('app.school'),
                        date,
                        lang,
                      )
                      void sendSms('01700000000', text)
                      setSmsResultToast(`Attendance warning SMS sent to ${st.studentName}'s guardian.`)
                    }}
                  >
                    Send Attendance Warning SMS
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SMS Confirmation Modal */}
      <Modal
        open={smsModalOpen}
        onClose={() => setSmsModalOpen(false)}
        title={t('attendance.smsModal.title')}
        sub={t('attendance.smsModal.sub', { count: absentStudents.length })}
        footer={
          <>
            <Button variant="secondary" onClick={() => executeSave(false)}>
              Save without SMS
            </Button>
            <Button
              variant="primary"
              icon={smsSending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              disabled={smsSending}
              onClick={() => executeSave(true)}
            >
              {smsSending ? t('attendance.smsModal.sending') : t('attendance.smsModal.send', { count: absentStudents.length })}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <div className="text-xs font-semibold text-fg-3 uppercase tracking-wider mb-1.5">
              {t('attendance.smsModal.recipients')}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {absentStudents.map((st) => (
                <span key={st.id} className="rounded-full border border-divider bg-app px-2.5 py-1 text-xs font-medium text-fg-2">
                  {st.full_name} ({st.roll_no || '—'})
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-fg-3 uppercase tracking-wider mb-1.5">
              {t('attendance.smsModal.preview')}
            </div>
            <div className="rounded-md border border-border bg-app p-3 text-xs leading-5 text-fg-1 font-mono">
              {sampleAbsentSms}
            </div>
            {smsStats && (
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-fg-3">
                <span>Encoding: <b>{smsStats.encoding}</b></span>
                <span>Length: <b>{smsStats.charCount} characters</b> ({smsStats.partsCount} SMS part)</span>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
