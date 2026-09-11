import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Download, Plus, ClipboardList, Inbox, FileEdit, CheckCircle, FileText, Image as ImageIcon,
  ArrowRight, ArrowLeft, Send, Bell, Pencil, ChevronRight, Check, UploadCloud, X, Hourglass, CircleAlert, ExternalLink, Loader2,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { KPI } from '@/components/ui/KPI'
import { Card } from '@/components/ui/Card'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Segmented } from '@/components/ui/Segmented'
import { Modal } from '@/components/ui/Modal'
import { Empty } from '@/components/ui/Empty'
import { Field, Input, Select, Textarea, SearchInput } from '@/components/ui/form'
import { Toggle } from '@/components/ui/Toggle'
import { Toolbar, TableWrap, Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { formatNumber, formatDateTime, cn } from '@/lib/utils'
import { useAuth } from '@/auth/context'
import { useStudents, useClasses } from '@/data/students'
import {
  useAssignments, useSubmissions, useGradeSubmission, useSubjects, useCreateAssignment, useSubmitAssignment, openAssignmentFile, validAssignmentFile,
  type AssignmentWithStats,
} from '@/data/assignments'
import type { AssignmentState, SubmissionStatus } from '@/types/models'
import type { AppLanguage } from '@/i18n'

const asnStateTone: Record<AssignmentState, BadgeTone> = { open: 'info', closed: 'neutral', draft: 'warning' }
const asnStateKey: Record<AssignmentState, string> = { open: 'badge.open', closed: 'badge.closed', draft: 'badge.draft' }

function SubStatus({ s, late }: { s: SubmissionStatus; late: boolean }) {
  const { t } = useTranslation()
  if (s === 'graded') return <Badge tone="success">{t('badge.graded')}</Badge>
  if (s === 'submitted')
    return late ? <Badge tone="warning">{t('badge.submittedLate')}</Badge> : <Badge tone="info">{t('badge.submitted')}</Badge>
  if (s === 'missing') return <Badge tone="danger">{t('badge.missing')}</Badge>
  return <Badge tone="neutral">{t('badge.inProgress')}</Badge>
}

function renderFileIcon(f: string | null, size: number, className?: string) {
  if (f && /\.(jpg|jpeg|png|gif|webp)$/i.test(f)) return <ImageIcon size={size} className={className} />
  return <FileText size={size} className={className} />
}

function AsnList({ onOpen, onCreate, canManage }: { onOpen: (id: string) => void; onCreate: () => void; canManage: boolean }) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'en') as AppLanguage
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')

  const assignmentsQuery = useAssignments()
  const studentsQuery = useStudents()
  const assignments = assignmentsQuery.data ?? []

  const classCounts = new Map<string, number>()
  for (const s of studentsQuery.data ?? []) {
    if (s.class_id) classCounts.set(s.class_id, (classCounts.get(s.class_id) ?? 0) + 1)
  }
  const totalFor = (a: AssignmentWithStats) => (a.class_id ? (classCounts.get(a.class_id) ?? 0) : 0)

  const rows = assignments.filter(
    (a) =>
      (filter === 'all' || a.state === filter) &&
      (q === '' || a.title.toLowerCase().includes(q.toLowerCase())),
  )
  const stats = assignments.reduce(
    (acc, x) => {
      if (x.state === 'open') {
        acc.open++
        acc.toGrade += x.submitted_count - x.graded_count
      }
      if (x.state === 'draft') acc.draft++
      return acc
    },
    { open: 0, draft: 0, toGrade: 0 },
  )

  return (
    <>
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPI icon={ClipboardList} label={t('assignments.kpi.open')} value={formatNumber(stats.open, lang)} footer={t('assignments.kpi.openFooter')} />
        <KPI icon={Inbox} label={t('assignments.kpi.toGrade')} value={formatNumber(stats.toGrade, lang)} delta={t('assignments.kpi.toGradeDelta')} deltaTone="up" />
        <KPI icon={FileEdit} label={t('assignments.kpi.drafts')} value={formatNumber(stats.draft, lang)} footer={t('assignments.kpi.draftsFooter')} />
        <KPI icon={CheckCircle} label={t('assignments.kpi.onTime')} value={`${formatNumber(92, lang)}%`} delta={t('assignments.kpi.onTimeDelta')} deltaTone="up" />
      </div>

      <Toolbar>
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { label: t('assignments.filter.all'), value: 'all' },
            { label: t('assignments.filter.open'), value: 'open' },
            { label: t('assignments.filter.closed'), value: 'closed' },
            { label: t('assignments.filter.draft'), value: 'draft' },
          ]}
        />
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('assignments.searchPlaceholder')} />
        <span className="ml-auto text-[13px] text-fg-3">{t('assignments.count', { count: formatNumber(rows.length, lang) })}</span>
        {canManage && (
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={onCreate}>
            {t('actions.newAssignment')}
          </Button>
        )}
      </Toolbar>

      <TableWrap className="rounded-t-none">
        <Table className="min-w-[900px]">
          <THead>
            <TR>
              <TH>{t('assignments.table.assignment')}</TH>
              <TH>{t('assignments.table.class')}</TH>
              <TH>{t('assignments.table.due')}</TH>
              <TH>{t('assignments.table.submissions')}</TH>
              <TH>{t('assignments.table.toGrade')}</TH>
              <TH num>{t('assignments.table.points')}</TH>
              <TH>{t('assignments.table.status')}</TH>
              <TH className="w-24" />
            </TR>
          </THead>
          <TBody>
            {assignmentsQuery.isPending ? (
              <TR>
                <TD className="py-10 text-center" colSpan={8}>
                  <Loader2 className="mx-auto animate-spin text-primary" size={22} />
                </TD>
              </TR>
            ) : assignmentsQuery.isError ? (
              <TR>
                <TD className="py-10 text-center" colSpan={8}>
                  <div className="text-sm text-danger">{t('common.error')}</div>
                  <Button variant="secondary" size="sm" className="mx-auto mt-3" onClick={() => void assignmentsQuery.refetch()}>
                    {t('common.retry')}
                  </Button>
                </TD>
              </TR>
            ) : rows.length === 0 ? (
              <TR>
                <TD className="py-4" colSpan={8}>
                  <Empty icon={ClipboardList} title={t('assignments.empty')} sub={t('assignments.emptySub')} />
                </TD>
              </TR>
            ) : (
              rows.map((a) => {
                const total = totalFor(a)
                const toGrade = a.submitted_count - a.graded_count
                const pct = total ? Math.round((a.submitted_count / total) * 100) : 0
                return (
                  <TR key={a.id}>
                    <TD>
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-primary-tint text-primary">
                          <FileText size={16} />
                        </span>
                        <div>
                          <div className="font-semibold">{a.title}</div>
                          <div className="text-xs text-fg-3">{a.subject_name ?? '—'}</div>
                        </div>
                      </div>
                    </TD>
                    <TD>{a.class_name ?? '—'}</TD>
                    <TD>{a.due_at ? formatDateTime(a.due_at, lang) : '—'}</TD>
                    <TD>
                      <div className="flex min-w-[120px] items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
                          <div className={cn('h-full', pct === 100 ? 'bg-success' : 'bg-primary')} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-semibold tabular-nums text-fg-2">
                          {formatNumber(a.submitted_count, lang)}/{formatNumber(total, lang)}
                        </span>
                      </div>
                    </TD>
                    <TD>
                      {toGrade > 0 ? (
                        <span className="font-semibold text-warning">{formatNumber(toGrade, lang)}</span>
                      ) : (
                        <span className="text-fg-3">—</span>
                      )}
                    </TD>
                    <TD num className="font-semibold">
                      {formatNumber(a.points, lang)}
                    </TD>
                    <TD>
                      <Badge tone={asnStateTone[a.state]}>{t(asnStateKey[a.state])}</Badge>
                    </TD>
                    <TD>
                      {a.state === 'draft' && canManage ? (
                        <Button variant="ghost" size="sm" icon={<Send size={14} />}>
                          {t('actions.publish')}
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" icon={<ArrowRight size={14} />} onClick={() => onOpen(a.id)}>
                          {t('actions.open')}
                        </Button>
                      )}
                    </TD>
                  </TR>
                )
              })
            )}
          </TBody>
        </Table>
      </TableWrap>
    </>
  )
}

interface RosterEntry {
  student_id: string
  name: string
  roll: string | null
  status: SubmissionStatus
  late: boolean
  grade: number | null
  when: string | null
  file: string | null
  submission_id: string | null
  feedback: string | null
}

function AsnDetail({ assignment, onBack, canManage }: { assignment: AssignmentWithStats; onBack: () => void; canManage: boolean }) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'en') as AppLanguage
  const a = assignment

  const studentsQuery = useStudents()
  const submissionsQuery = useSubmissions(a.id)
  const gradeSubmission = useGradeSubmission()
  const submitAssignment = useSubmitAssignment()
  const { user, profile } = useAuth()
  const submissionRef = useRef<HTMLInputElement>(null)

  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [gradeInput, setGradeInput] = useState<string | null>(null)
  const [feedbackInput, setFeedbackInput] = useState<string | null>(null)

  const subsByStudent = new Map((submissionsQuery.data ?? []).map((s) => [s.student_id, s]))
  const roster: RosterEntry[] = (studentsQuery.data ?? [])
    .filter((s) => !a.class_id || s.class_id === a.class_id)
    .map((s) => {
      const sub = subsByStudent.get(s.id)
      return {
        student_id: s.id,
        name: s.full_name,
        roll: s.roll_no,
        status: (sub?.status ?? 'missing') as SubmissionStatus,
        late: sub?.late ?? false,
        grade: sub?.grade ?? null,
        when: sub?.submitted_at ? formatDateTime(sub.submitted_at, lang) : null,
        file: sub?.file_name ?? null,
        submission_id: sub?.id ?? null,
        feedback: sub?.feedback ?? null,
      }
    })

  const counts = roster.reduce(
    (acc, s) => ({ ...acc, [s.status]: (acc[s.status] ?? 0) + 1 }),
    { graded: 0, submitted: 0, missing: 0, in_progress: 0 } as Record<SubmissionStatus, number>,
  )
  const filtered = roster.filter((s) => filter === 'all' || s.status === filter)
  const active = roster.find((s) => s.student_id === selectedId) ?? filtered[0] ?? roster[0]
  const total = roster.length
  const loading = studentsQuery.isPending || submissionsQuery.isPending

  function select(id: string) {
    setSelectedId(id)
    setGradeInput(null)
    setFeedbackInput(null)
  }
  function step(dir: 1 | -1) {
    if (!active) return
    const idx = filtered.findIndex((s) => s.student_id === active.student_id)
    const next = filtered[idx + dir]
    if (next) select(next.student_id)
  }
  function saveGrade() {
    if (!active?.submission_id) return
    const raw = gradeInput ?? (active.grade != null ? String(active.grade) : '')
    if (raw === '') return
    gradeSubmission.mutate({
      id: active.submission_id,
      grade: Math.max(0, Math.min(a.points, Number(raw))),
      feedback: feedbackInput ?? active.feedback,
    })
  }

  return (
    <div>
      <div className="mb-3.5 flex items-center gap-2 text-[13px] text-fg-3">
        <button onClick={onBack} className="grid h-7 w-7 place-items-center rounded-sm hover:bg-neutral-100">
          <ArrowLeft size={16} />
        </button>
        <button onClick={onBack} className="hover:text-fg-1">
          {t('assignments.title')}
        </button>
        <ChevronRight size={14} />
        <span className="font-semibold text-fg-1">{a.title}</span>
      </div>

      <PageHeader
        title={
          <span className="flex items-center gap-3">
            {a.title}
            <Badge tone={asnStateTone[a.state]}>{t(asnStateKey[a.state])}</Badge>
          </span>
        }
        sub={`${a.subject_name ?? '—'} · ${a.class_name ?? '—'} · ${a.due_at ? formatDateTime(a.due_at, lang) : '—'} · ${formatNumber(a.points, lang)}`}
        actions={canManage ? (
          <>
            <Button variant="secondary" icon={<Bell size={16} />}>
              {t('actions.remindMissing')}
            </Button>
            <Button variant="secondary" icon={<Download size={16} />}>
              {t('actions.downloadAll')}
            </Button>
            <Button variant="primary" icon={<Pencil size={16} />}>
              {t('actions.edit')}
            </Button>
          </>
        ) : undefined}
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPI icon={CheckCircle} label={t('assignments.detail.graded')} value={formatNumber(counts.graded, lang)} footer={t('assignments.detail.gradedFooter', { total: formatNumber(total, lang) })} />
        <KPI icon={Inbox} label={t('assignments.detail.toGrade')} value={formatNumber(counts.submitted, lang)} delta={t('assignments.detail.toGradeDelta')} deltaTone="up" />
        <KPI icon={Hourglass} label={t('assignments.detail.inProgress')} value={formatNumber(counts.in_progress, lang)} footer={t('assignments.detail.inProgressFooter')} />
        <KPI icon={CircleAlert} label={t('assignments.detail.missing')} value={formatNumber(counts.missing, lang)} delta={t('assignments.detail.missingDelta')} deltaTone="down" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card
          title={t('assignments.detail.submissionsTitle')}
          sub={t('assignments.detail.submissionsSub')}
          actions={
            <Segmented
              value={filter}
              onChange={setFilter}
              options={[
                { label: t('assignments.detail.filterAll'), value: 'all' },
                { label: t('assignments.detail.filterToGrade'), value: 'submitted' },
                { label: t('assignments.detail.filterGraded'), value: 'graded' },
                { label: t('assignments.detail.filterMissing'), value: 'missing' },
              ]}
            />
          }
        >
          {loading ? (
            <div className="grid place-items-center py-12">
              <Loader2 className="animate-spin text-primary" size={22} />
            </div>
          ) : (
            <div className="flex flex-col">
              {filtered.map((s, i) => (
                <div
                  key={s.student_id}
                  onClick={() => select(s.student_id)}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-sm px-2.5 py-3',
                    i > 0 && 'border-t border-divider',
                    active && s.student_id === active.student_id && 'bg-primary-tint',
                  )}
                >
                  <div className="flex flex-1 items-center gap-2.5">
                    <Avatar name={s.name} />
                    <div>
                      <div className="font-semibold">{s.name}</div>
                      <div className="text-xs text-fg-3">{s.roll ?? '—'}</div>
                    </div>
                  </div>
                  <div className="hidden text-xs text-fg-3 sm:block">{s.when ?? '—'}</div>
                  <SubStatus s={s.status} late={s.late} />
                  <div className="w-14 text-right text-sm font-semibold">
                    {s.grade != null ? `${formatNumber(s.grade, lang)}/${formatNumber(a.points, lang)}` : <span className="text-fg-3">—</span>}
                  </div>
                  <ChevronRight size={16} className="text-fg-4" />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          {active && (
            <>
              <div className="mb-3.5 flex items-center gap-3">
                <Avatar name={active.name} />
                <div className="flex-1">
                  <div className="font-semibold">{active.name}</div>
                  <div className="text-xs text-fg-3">
                    {active.roll ?? '—'} · {active.status === 'missing' ? t('assignments.detail.noSubmissionYet') : active.when}
                  </div>
                </div>
                <SubStatus s={active.status} late={active.late} />
              </div>

              {active.file ? (
                <>
                  <div className="mb-3.5 flex items-center gap-3 rounded-md border border-divider p-3.5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-primary-tint text-primary">
                      {renderFileIcon(active.file, 18)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{active.file}</div>
                      <div className="text-xs text-fg-3">{t('assignments.detail.uploaded', { when: active.when })}</div>
                    </div>
                    <Button variant="secondary" size="sm" icon={<ExternalLink size={14} />} onClick={() => active.submission_id && void openAssignmentFile(subsByStudent.get(active.student_id)?.file_url ?? '')}>
                      {t('actions.open')}
                    </Button>
                  </div>

                  {canManage && <Field className="mb-3" label={t('assignments.detail.grade')}>
                    <div className="flex items-center gap-2.5">
                      <Input
                        type="number"
                        min={0}
                        max={a.points}
                        value={gradeInput ?? (active.grade != null ? String(active.grade) : '')}
                        onChange={(e) => setGradeInput(e.target.value)}
                        placeholder="0"
                        className="w-[90px]"
                      />
                      <span className="text-[13px] text-fg-3">/ {formatNumber(a.points, lang)}</span>
                    </div>
                  </Field>}

                  {canManage && <Field label={t('assignments.detail.privateFeedback')}>
                    <Textarea
                      rows={3}
                      value={feedbackInput ?? active.feedback ?? ''}
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      placeholder={t('assignments.detail.feedbackPlaceholder')}
                    />
                  </Field>}

                  <div className="mt-3.5 flex items-center gap-2">
                    <Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={() => step(-1)}>
                      {t('actions.previous')}
                    </Button>
                    {canManage && <Button
                      variant="primary"
                      icon={gradeSubmission.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      className="ml-auto"
                      disabled={gradeSubmission.isPending}
                      onClick={saveGrade}
                    >
                      {gradeSubmission.isPending ? t('common.saving') : t('actions.saveGrade')}
                    </Button>}
                    <Button variant="ghost" icon={<ArrowRight size={16} />} onClick={() => step(1)}>
                      {t('actions.next')}
                    </Button>
                  </div>
                </>
              ) : (
                <Empty
                  icon={Inbox}
                  title={t('assignments.detail.noSubmissionTitle')}
                  sub={t('assignments.detail.noSubmissionSub', { name: active.name })}
                  action={canManage ? (
                    <Button variant="secondary" icon={<Bell size={16} />}>
                      {t('actions.sendReminder')}
                    </Button>
                  ) : <><Button variant="primary" icon={<UploadCloud size={16} />} onClick={() => submissionRef.current?.click()}>{t('assignments.detail.submitWork')}</Button><input ref={submissionRef} type="file" className="hidden" accept=".pdf,.docx,.png,.jpg,.jpeg" onChange={(event) => { const file = event.target.files?.[0]; if (file && user && profile?.school_id && active) submitAssignment.mutate({ studentId: active.student_id, schoolId: profile.school_id, assignmentId: a.id, userId: user.id, file, dueAt: a.due_at }) }} /></>}
                />
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  )
}

function NewAssignmentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const subjectsQuery = useSubjects()
  const classesQuery = useClasses()
  const createAssignment = useCreateAssignment()

  const [files, setFiles] = useState<File[]>([])
  const [notify, setNotify] = useState(true)
  const [form, setForm] = useState({ title: '', subject_id: '', class_id: '', due: '', points: '20', instructions: '' })
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLInputElement>(null)

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? [])
    if (list.some((file) => !validAssignmentFile(file))) { setError(t('assignments.modal.fileError')); return }
    setFiles((prev) => [...prev, ...list])
  }

  function reset() {
    setForm({ title: '', subject_id: '', class_id: '', due: '', points: '20', instructions: '' })
    setFiles([])
    setError(null)
    onClose()
  }

  async function submit(state: 'draft' | 'open') {
    if (!profile?.school_id || !form.title.trim()) return
    setError(null)
    try {
      await createAssignment.mutateAsync({
        school_id: profile.school_id,
        class_id: form.class_id || null,
        subject_id: form.subject_id || null,
        title: form.title.trim(),
        instructions: form.instructions.trim() || null,
        due_at: form.due ? new Date(form.due).toISOString() : null,
        points: Number(form.points) || 0,
        state,
        files,
      })
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.error'))
    }
  }

  return (
    <Modal
      open={open}
      onClose={reset}
      title={t('assignments.modal.title')}
      sub={t('assignments.modal.sub')}
      footer={
        <>
          <Button variant="ghost" disabled={createAssignment.isPending} onClick={() => void submit('draft')}>
            {t('actions.saveDraft')}
          </Button>
          <Button
            variant="primary"
            icon={createAssignment.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            disabled={createAssignment.isPending || !form.title.trim()}
            onClick={() => void submit('open')}
          >
            {createAssignment.isPending ? t('common.saving') : t('actions.publish')}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <Field className="sm:col-span-2" label={t('assignments.modal.titleField')}>
          <Input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder={t('assignments.modal.titlePlaceholder')}
          />
        </Field>
        <Field label={t('assignments.modal.subject')}>
          <Select value={form.subject_id} onChange={(e) => setForm((f) => ({ ...f, subject_id: e.target.value }))}>
            <option value="">—</option>
            {(subjectsQuery.data ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('assignments.modal.class')}>
          <Select value={form.class_id} onChange={(e) => setForm((f) => ({ ...f, class_id: e.target.value }))}>
            <option value="">—</option>
            {(classesQuery.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('assignments.modal.dueDate')}>
          <Input type="datetime-local" value={form.due} onChange={(e) => setForm((f) => ({ ...f, due: e.target.value }))} />
        </Field>
        <Field label={t('assignments.modal.points')}>
          <Input type="number" value={form.points} onChange={(e) => setForm((f) => ({ ...f, points: e.target.value }))} />
        </Field>
        <Field className="sm:col-span-2" label={t('assignments.modal.instructions')}>
          <Textarea
            rows={3}
            value={form.instructions}
            onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
            placeholder={t('assignments.modal.instructionsPlaceholder')}
          />
        </Field>
        <Field className="sm:col-span-2" label={t('assignments.modal.attachments')}>
          <div
            onClick={() => ref.current?.click()}
            className="cursor-pointer rounded-md border border-dashed border-border-strong p-4 text-center text-fg-3"
          >
            <UploadCloud size={20} className="mx-auto text-fg-3" />
            <div className="mt-1.5 text-[13px]">
              <b className="text-fg-1">{t('assignments.modal.uploadCta')}</b> {t('assignments.modal.uploadHint')}
            </div>
            <div className="mt-0.5 text-[11px]">{t('assignments.modal.uploadTypes')}</div>
          </div>
          <input ref={ref} type="file" multiple className="hidden" onChange={onPick} />
          {files.length > 0 && (
            <div className="mt-2.5 flex flex-col gap-1.5">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 rounded-sm border border-divider px-2.5 py-1.5 text-[13px]">
                  {renderFileIcon(f.name, 14, 'text-fg-3')}
                  <span className="flex-1 truncate">{f.name}</span>
                  <span className="text-[11px] text-fg-3">{Math.round(f.size / 1024)} KB</span>
                  <button
                    onClick={() => setFiles(files.filter((_, k) => k !== i))}
                    className="grid h-6 w-6 place-items-center rounded-sm hover:bg-neutral-100"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Field>
        <div className="sm:col-span-2">
          <div className="flex items-center gap-3 rounded-md bg-app px-3.5 py-2.5">
            <Bell size={16} className="text-fg-3" />
            <div className="flex-1 text-[13px]">{t('assignments.modal.notifyParents')}</div>
            <Toggle on={notify} onChange={setNotify} />
          </div>
        </div>
        {error && <div className="rounded-sm bg-danger-tint px-3 py-2 text-[13px] text-danger sm:col-span-2">{error}</div>}
      </div>
    </Modal>
  )
}

export default function Assignments() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const canManage = profile?.role === 'owner' || profile?.role === 'admin' || profile?.role === 'teacher'
  const [openId, setOpenId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const assignmentsQuery = useAssignments()
  const opened = (assignmentsQuery.data ?? []).find((a) => a.id === openId) ?? null

  return (
    <div>
      {opened == null ? (
        <>
          <PageHeader
            title={t('assignments.title')}
            sub={t('assignments.sub')}
            actions={canManage ? (
              <>
                <Button variant="secondary" icon={<Download size={16} />}>
                  {t('actions.export')}
                </Button>
                <Button variant="primary" icon={<Plus size={16} />} onClick={() => setCreating(true)}>
                  {t('actions.newAssignment')}
                </Button>
              </>
            ) : undefined}
          />
          <AsnList onOpen={setOpenId} onCreate={() => setCreating(true)} canManage={canManage} />
        </>
      ) : (
        <AsnDetail assignment={opened} onBack={() => setOpenId(null)} canManage={canManage} />
      )}
      {canManage && <NewAssignmentModal open={creating} onClose={() => setCreating(false)} />}
    </div>
  )
}
