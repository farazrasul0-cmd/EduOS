import { useState } from 'react'
import { ArrowLeft, CalendarCheck, Banknote, Award, FileText, Loader2, UserRound, Pencil, Archive, UserPlus, Mail, Phone } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Empty } from '@/components/ui/Empty'
import { KPI } from '@/components/ui/KPI'
import { TableWrap, Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { Field, Input, Select } from '@/components/ui/form'
import { useStudentDetail, useClasses, useUpdateStudent, useLinkGuardian, useInviteGuardian } from '@/data/students'
import { useAuth } from '@/auth/context'
import { formatDate, formatNumber, formatTaka } from '@/lib/utils'
import type { AppLanguage } from '@/i18n'
import { guardianFormSchema, studentFormSchema } from '@/lib/student-validation'

export default function StudentDetail() {
  const { studentId } = useParams()
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'en') as AppLanguage
  const detail = useStudentDetail(studentId)
  const classes = useClasses()
  const updateStudent = useUpdateStudent()
  const linkGuardian = useLinkGuardian()
  const inviteGuardian = useInviteGuardian()
  const { profile } = useAuth()
  const [editOpen, setEditOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [edit, setEdit] = useState({ full_name: '', roll_no: '', dob: '', class_id: '' })
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [guardianOpen, setGuardianOpen] = useState(false)
  const [guardian, setGuardian] = useState({ name: '', email: '', phone: '', relationship: '', primary: false })
  const [invitedEmail, setInvitedEmail] = useState<string | null>(null)

  if (detail.isPending) return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="animate-spin text-primary" size={28} /></div>
  if (detail.isError || !detail.data) {
    return <Empty icon={UserRound} title={t('students.detail.notFound')} sub={t('common.error')} action={<Button variant="secondary" onClick={() => void detail.refetch()}>{t('common.retry')}</Button>} />
  }

  const { student, attendance, invoices, submissions, results, guardians } = detail.data
  const canManage = profile?.role === 'owner' || profile?.role === 'admin'

  function openEdit() {
    setEdit({
      full_name: student.full_name,
      roll_no: student.roll_no ?? '',
      dob: student.dob ?? '',
      class_id: student.class_id ?? '',
    })
    setMutationError(null)
    setEditOpen(true)
  }

  async function saveEdit() {
    if (!studentId) return
    setMutationError(null)
    const parsed = studentFormSchema.safeParse(edit)
    if (!parsed.success) {
      setMutationError(t('students.validation.invalid'))
      return
    }
    try {
      await updateStudent.mutateAsync({
        id: studentId,
        update: {
          full_name: parsed.data.full_name,
          roll_no: parsed.data.roll_no,
          dob: parsed.data.dob,
          class_id: parsed.data.class_id,
        },
      })
      setEditOpen(false)
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : t('common.error'))
    }
  }

  async function archiveStudent() {
    if (!studentId) return
    setMutationError(null)
    try {
      await updateStudent.mutateAsync({ id: studentId, update: { status: 'inactive' } })
      setArchiveOpen(false)
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : t('common.error'))
    }
  }

  async function saveGuardian() {
    if (!studentId) return
    setMutationError(null)
    const parsed = guardianFormSchema.safeParse(guardian)
    if (!parsed.success) {
      setMutationError(t('students.validation.guardianInvalid'))
      return
    }
    try {
      await linkGuardian.mutateAsync({
        studentId,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        relationship: parsed.data.relationship,
        primary: parsed.data.primary,
      })
      setGuardian({ name: '', email: '', phone: '', relationship: '', primary: false })
      setGuardianOpen(false)
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : t('common.error'))
    }
  }

  async function sendGuardianInvite(email: string) {
    setMutationError(null)
    setInvitedEmail(null)
    try {
      await inviteGuardian.mutateAsync(email)
      setInvitedEmail(email)
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : t('common.error'))
    }
  }
  const attendancePct = attendance.length
    ? Math.round((attendance.filter((row) => row.status === 'present').length / attendance.length) * 100)
    : null
  const due = invoices.reduce((sum, row) => sum + Math.max(0, Number(row.amount) - Number(row.paid_amount)), 0)
  const scored = results.filter((row) => row.marks_obtained != null && row.total_marks > 0)
  const avg = scored.length
    ? Math.round(scored.reduce((sum, row) => sum + (Number(row.marks_obtained) / row.total_marks) * 100, 0) / scored.length)
    : null
  const attendanceBadgeKey: Record<string, string> = { present: 'attendance.status.present', absent: 'attendance.status.absent', late: 'attendance.status.late', leave: 'badge.leave' }
  const submissionBadgeKey: Record<string, string> = { in_progress: 'badge.inProgress', submitted: 'badge.submitted', graded: 'badge.graded', missing: 'badge.missing' }

  return (
    <div>
      <Link to="/students" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-fg-3 hover:text-primary">
        <ArrowLeft size={16} /> {t('students.detail.back')}
      </Link>

      <Card className="mb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar name={student.full_name} src={student.avatar_url} size="lg" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-fg-1">{student.full_name}</h1>
              <Badge tone={student.status === 'active' ? 'success' : 'neutral'}>{student.status === 'active' ? t('students.statusActive') : student.status}</Badge>
            </div>
            <div className="mt-1 text-sm text-fg-3">
              {student.class_name ?? '—'} · {t('students.table.roll')} {student.roll_no ?? '—'}
              {student.dob ? ` · ${t('students.modal.dob')} ${formatDate(student.dob, lang)}` : ''}
            </div>
          </div>
          {canManage && (
            <div className="flex gap-2">
              <Button variant="secondary" icon={<Pencil size={16} />} onClick={openEdit}>{t('actions.edit')}</Button>
              {student.status === 'active' && <Button variant="danger" icon={<Archive size={16} />} onClick={() => { setMutationError(null); setArchiveOpen(true) }}>{t('students.detail.archive')}</Button>}
            </div>
          )}
        </div>
      </Card>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPI icon={CalendarCheck} label={t('students.detail.attendanceRate')} value={attendancePct == null ? '—' : `${formatNumber(attendancePct, lang)}%`} footer={t('students.detail.records', { count: formatNumber(attendance.length, lang) })} />
        <KPI icon={Banknote} label={t('students.detail.feesDue')} value={formatTaka(due, lang)} footer={t('students.detail.invoices', { count: formatNumber(invoices.length, lang) })} />
        <KPI icon={Award} label={t('students.detail.resultAverage')} value={avg == null ? '—' : `${formatNumber(avg, lang)}%`} footer={t('students.detail.publishedResults', { count: formatNumber(results.length, lang) })} />
        <KPI icon={FileText} label={t('students.detail.assignments')} value={formatNumber(submissions.length, lang)} footer={t('students.detail.graded', { count: formatNumber(submissions.filter((row) => row.status === 'graded').length, lang) })} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title={t('students.detail.guardians')} actions={canManage ? <Button size="sm" variant="secondary" icon={<UserPlus size={14} />} onClick={() => { setMutationError(null); setGuardianOpen(true) }}>{t('students.detail.addGuardian')}</Button> : undefined}>
          {guardians.length === 0 ? <Empty icon={UserRound} title={t('students.detail.noGuardians')} /> : <div className="flex flex-col">{guardians.map((row) => <div key={row.id} className="flex items-center gap-3 border-b border-divider py-3 last:border-0"><Avatar name={row.full_name} /><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="font-medium">{row.full_name}</span>{row.is_primary && <Badge tone="info">{t('students.detail.primary')}</Badge>}{row.profile_id && <Badge tone="success">{t('students.detail.portalLinked')}</Badge>}</div><div className="text-xs text-fg-3">{row.relationship ?? '—'}</div><div className="mt-1 flex flex-wrap gap-3 text-xs text-fg-3">{row.email && <span className="inline-flex items-center gap-1"><Mail size={12} />{row.email}</span>}{row.phone && <span className="inline-flex items-center gap-1"><Phone size={12} />{row.phone}</span>}</div></div>{canManage && row.email && !row.profile_id && <Button size="sm" variant="secondary" disabled={inviteGuardian.isPending} onClick={() => void sendGuardianInvite(row.email!)}>{t('students.detail.sendInvite')}</Button>}</div>)}</div>}
          {invitedEmail && <div className="mt-3 rounded-sm bg-success-tint px-3 py-2 text-sm text-success">{t('students.detail.inviteSent', { email: invitedEmail })}</div>}
          {mutationError && !guardianOpen && !editOpen && !archiveOpen && <div className="mt-3 rounded-sm bg-danger-tint px-3 py-2 text-sm text-danger">{mutationError}</div>}
        </Card>

        <HistoryCard title={t('students.detail.recentAttendance')} empty={attendance.length === 0}>
          {attendance.slice(0, 8).map((row) => <HistoryRow key={row.id} label={formatDate(row.date, lang)} value={<Badge tone={row.status === 'present' ? 'success' : row.status === 'late' ? 'warning' : 'danger'}>{t(attendanceBadgeKey[row.status] ?? row.status)}</Badge>} />)}
        </HistoryCard>

        <Card title={t('students.detail.feeHistory')} pad={false}>
          {invoices.length === 0 ? <Empty icon={Banknote} title={t('students.detail.noFees')} /> : (
            <TableWrap className="border-0 shadow-none"><Table><THead><TR><TH>{t('fees.table.invoice')}</TH><TH>{t('fees.table.dueDate')}</TH><TH num>{t('fees.table.amount')}</TH><TH>{t('fees.table.status')}</TH></TR></THead><TBody>
              {invoices.map((row) => <TR key={row.id}><TD>{row.invoice_no}</TD><TD>{row.due_date ? formatDate(row.due_date, lang) : '—'}</TD><TD num>{formatTaka(Number(row.amount), lang)}</TD><TD><Badge tone={row.status === 'paid' ? 'success' : row.status === 'overdue' ? 'danger' : 'warning'}>{t(`badge.${row.status}`)}</Badge></TD></TR>)}
            </TBody></Table></TableWrap>
          )}
        </Card>

        <HistoryCard title={t('students.detail.assignmentHistory')} empty={submissions.length === 0}>
          {submissions.slice(0, 8).map((row) => <HistoryRow key={row.id} label={row.assignment_title} sub={row.submitted_at ? formatDate(row.submitted_at, lang) : undefined} value={row.grade == null ? <Badge tone="neutral">{t(submissionBadgeKey[row.status] ?? row.status)}</Badge> : <strong>{formatNumber(row.grade, lang)}/{formatNumber(row.assignment_points, lang)}</strong>} />)}
        </HistoryCard>

        <HistoryCard title={t('students.detail.resultHistory')} empty={results.length === 0}>
          {results.map((row) => <HistoryRow key={row.id} label={row.exam_name} sub={[row.subject_name, row.exam_date ? formatDate(row.exam_date, lang) : null].filter(Boolean).join(' · ')} value={<strong>{row.marks_obtained == null ? '—' : `${formatNumber(Number(row.marks_obtained), lang)}/${formatNumber(row.total_marks, lang)}`} {row.grade ? `· ${row.grade}` : ''}</strong>} />)}
        </HistoryCard>
      </div>

      <Modal
        open={guardianOpen}
        onClose={() => setGuardianOpen(false)}
        title={t('students.detail.addGuardian')}
        sub={t('students.detail.guardianSub')}
        footer={<><Button variant="ghost" onClick={() => setGuardianOpen(false)}>{t('actions.cancel')}</Button><Button variant="primary" disabled={linkGuardian.isPending || !guardian.name.trim()} onClick={() => void saveGuardian()}>{linkGuardian.isPending ? t('common.saving') : t('students.detail.linkGuardian')}</Button></>}
      >
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Field label={t('students.detail.guardianName')}><Input value={guardian.name} onChange={(event) => setGuardian((value) => ({ ...value, name: event.target.value }))} /></Field>
          <Field label={t('students.detail.relationship')}><Input value={guardian.relationship} onChange={(event) => setGuardian((value) => ({ ...value, relationship: event.target.value }))} /></Field>
          <Field label={t('students.detail.guardianEmail')}><Input type="email" value={guardian.email} onChange={(event) => setGuardian((value) => ({ ...value, email: event.target.value }))} /></Field>
          <Field label={t('students.detail.guardianPhone')}><Input value={guardian.phone} onChange={(event) => setGuardian((value) => ({ ...value, phone: event.target.value }))} /></Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={guardian.primary} onChange={(event) => setGuardian((value) => ({ ...value, primary: event.target.checked }))} />{t('students.detail.makePrimary')}</label>
        </div>
        {mutationError && <div className="mt-3 rounded-sm bg-danger-tint px-3 py-2 text-sm text-danger">{mutationError}</div>}
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={t('students.detail.editTitle')}
        footer={<><Button variant="ghost" onClick={() => setEditOpen(false)}>{t('actions.cancel')}</Button><Button variant="primary" disabled={updateStudent.isPending || !edit.full_name.trim()} onClick={() => void saveEdit()}>{updateStudent.isPending ? t('common.saving') : t('actions.saveChanges')}</Button></>}
      >
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Field label={t('students.modal.fullName')}><Input value={edit.full_name} onChange={(event) => setEdit((value) => ({ ...value, full_name: event.target.value }))} /></Field>
          <Field label={t('students.modal.rollNo')}><Input value={edit.roll_no} onChange={(event) => setEdit((value) => ({ ...value, roll_no: event.target.value }))} /></Field>
          <Field label={t('students.modal.dob')}><Input type="date" value={edit.dob} onChange={(event) => setEdit((value) => ({ ...value, dob: event.target.value }))} /></Field>
          <Field label={t('students.modal.class')}><Select value={edit.class_id} onChange={(event) => setEdit((value) => ({ ...value, class_id: event.target.value }))}><option value="">—</option>{(classes.data ?? []).map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</Select></Field>
        </div>
        {mutationError && <div className="mt-3 rounded-sm bg-danger-tint px-3 py-2 text-sm text-danger">{mutationError}</div>}
      </Modal>

      <Modal
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        title={t('students.detail.archiveTitle')}
        sub={t('students.detail.archiveBody', { name: student.full_name })}
        footer={<><Button variant="ghost" onClick={() => setArchiveOpen(false)}>{t('actions.cancel')}</Button><Button variant="danger" disabled={updateStudent.isPending} onClick={() => void archiveStudent()}>{updateStudent.isPending ? t('common.saving') : t('students.detail.archive')}</Button></>}
      >
        {mutationError && <div className="rounded-sm bg-danger-tint px-3 py-2 text-sm text-danger">{mutationError}</div>}
      </Modal>
    </div>
  )
}

function HistoryCard({ title, empty, children }: { title: string; empty: boolean; children: ReactNode }) {
  return <Card title={title}>{empty ? <div className="py-6 text-center text-sm text-fg-3">—</div> : <div className="flex flex-col">{children}</div>}</Card>
}

function HistoryRow({ label, sub, value }: { label: string; sub?: string; value: ReactNode }) {
  return <div className="flex items-center gap-3 border-b border-divider py-3 last:border-0"><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{label}</div>{sub && <div className="text-xs text-fg-3">{sub}</div>}</div><div className="text-sm">{value}</div></div>
}
