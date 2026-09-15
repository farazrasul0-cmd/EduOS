import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileDown, Plus, Calendar, FileEdit, CheckCircle, BarChart3, Pencil, Sparkles, RotateCw, ClipboardList, Loader2, Trash2, Ticket } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { KPI } from '@/components/ui/KPI'
import { Card } from '@/components/ui/Card'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Segmented } from '@/components/ui/Segmented'
import { Empty } from '@/components/ui/Empty'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { Modal } from '@/components/ui/Modal'
import { TableWrap, Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { formatNumber, formatDate, cn } from '@/lib/utils'
import { useDeleteExam, useExamQuestions, useExams, useSaveExam, type ExamWithStats } from '@/data/exams'
import { useClasses, useStudents } from '@/data/students'
import { useSubjects } from '@/data/assignments'
import type { ExamState } from '@/types/models'
import type { AppLanguage } from '@/i18n'
import { useAuth } from '@/auth/context'
import { createQuestionPaperPdf } from '@/lib/question-paper-pdf'
import { createExamRoutinePdf } from '@/lib/exam-routine-pdf'
import { getWeekdayName } from '@/lib/routine-scheduler'

const examTone: Record<ExamState, BadgeTone> = { published: 'info', scheduled: 'warning', draft: 'neutral' }
const examKey: Record<ExamState, string> = { published: 'badge.published', scheduled: 'badge.scheduled', draft: 'badge.draft' }

function ExamsListTab({ canManage, onEdit, onDelete, onExport }: { canManage: boolean; onEdit: (exam: ExamWithStats) => void; onDelete: (exam: ExamWithStats) => void; onExport: (exam: ExamWithStats) => void }) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'en') as AppLanguage
  const navigate = useNavigate()

  const examsQuery = useExams()
  const studentsQuery = useStudents()
  const exams = examsQuery.data ?? []

  // Students sitting an exam = students in its class.
  const classCounts = new Map<string, number>()
  for (const s of studentsQuery.data ?? []) {
    if (s.class_id) classCounts.set(s.class_id, (classCounts.get(s.class_id) ?? 0) + 1)
  }

  const scheduled = exams.filter((e) => e.state === 'scheduled').length
  const drafts = exams.filter((e) => e.state === 'draft').length
  const published = exams.filter((e) => e.state === 'published').length
  const avgs = exams.filter((e) => e.avg_pct != null).map((e) => e.avg_pct as number)
  const classAvg = avgs.length ? Math.round(avgs.reduce((s, a) => s + a, 0) / avgs.length) : null

  return (
    <>
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPI icon={Calendar} label={t('exams.kpi.upcoming')} value={formatNumber(scheduled, lang)} footer={t('exams.kpi.upcomingFooter')} />
        <KPI icon={FileEdit} label={t('exams.kpi.drafts')} value={formatNumber(drafts, lang)} footer={t('exams.kpi.draftsFooter')} />
        <KPI icon={CheckCircle} label={t('exams.kpi.published')} value={formatNumber(published, lang)} delta={t('exams.kpi.publishedDelta')} deltaTone="up" />
        <KPI
          icon={BarChart3}
          label={t('exams.kpi.classAvg')}
          value={classAvg != null ? `${formatNumber(classAvg, lang)}%` : '—'}
          delta={classAvg != null ? t('exams.kpi.classAvgDelta') : undefined}
          deltaTone="up"
        />
      </div>

      <TableWrap>
        <Table className="min-w-[760px]">
          <THead>
            <TR>
              <TH>{t('exams.table.exam')}</TH>
              <TH>{t('exams.table.class')}</TH>
              <TH>{t('exams.table.date')}</TH>
              <TH>{t('exams.table.students')}</TH>
              <TH num>{t('exams.table.average')}</TH>
              <TH>{t('exams.table.status')}</TH>
              <TH className="w-32" />
            </TR>
          </THead>
          <TBody>
            {examsQuery.isPending ? (
              <TR>
                <TD className="py-10 text-center" colSpan={7}>
                  <Loader2 className="mx-auto animate-spin text-primary" size={22} />
                </TD>
              </TR>
            ) : examsQuery.isError ? (
              <TR>
                <TD className="py-10 text-center" colSpan={7}>
                  <div className="text-sm text-danger">{t('common.error')}</div>
                  <Button variant="secondary" size="sm" className="mx-auto mt-3" onClick={() => void examsQuery.refetch()}>
                    {t('common.retry')}
                  </Button>
                </TD>
              </TR>
            ) : exams.length === 0 ? (
              <TR>
                <TD className="py-4" colSpan={7}>
                  <Empty icon={ClipboardList} title={t('exams.empty')} sub={t('exams.emptySub')} />
                </TD>
              </TR>
            ) : (
              exams.map((e) => {
                const students = e.class_id ? (classCounts.get(e.class_id) ?? 0) : 0
                return (
                  <TR key={e.id}>
                    <TD className="font-semibold">{e.name}</TD>
                    <TD>{e.class_name ?? '—'}</TD>
                    <TD>{e.exam_date ? formatDate(e.exam_date, lang) : '—'}</TD>
                    <TD className="text-xs text-fg-3">{students ? formatNumber(students, lang) : '—'}</TD>
                    <TD num className="font-semibold">
                      {e.avg_pct != null ? `${formatNumber(e.avg_pct, lang)}%` : '—'}
                    </TD>
                    <TD>
                      <Badge tone={examTone[e.state]}>{t(examKey[e.state])}</Badge>
                    </TD>
                    <TD><div className="flex justify-end gap-1">
                      {e.state === 'published' || !canManage ? (
                        <Button variant="ghost" size="sm" icon={<BarChart3 size={14} />}>
                          {t('actions.analyze')}
                        </Button>
                      ) : (
                        <><Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => onEdit(e)} aria-label={t('actions.edit')} /><Button variant="ghost" size="sm" onClick={() => navigate('/results')}>{t('actions.enterMarks')}</Button><Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => onDelete(e)} aria-label={t('actions.remove')} /></>
                      )}
                      <Button variant="ghost" size="sm" icon={<FileDown size={14} />} onClick={() => onExport(e)} aria-label={t('actions.exportPdf')} />
                    </div></TD>
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

type QType = 'short' | 'mcq' | 'long'
interface Question {
  q: string
  type: QType
  marks: number
  opts?: string[]
  correct?: number
}
const QUESTIONS: Question[] = [
  { q: 'Solve for x: 3x + 7 = 22', type: 'short', marks: 2 },
  { q: 'If a train travels 240 km in 4 hours, what is its average speed?', type: 'mcq', marks: 2, opts: ['50 km/h', '60 km/h', '70 km/h', '80 km/h'], correct: 1 },
  { q: 'The sum of two consecutive integers is 47. Find the integers.', type: 'short', marks: 3 },
  { q: 'Simplify: 4(x − 2) + 3(x + 5)', type: 'short', marks: 2 },
  { q: 'A shopkeeper sells a pen for ৳120 at a 20% profit. Find the cost price.', type: 'long', marks: 4 },
]

function AIBuilderTab() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'en') as AppLanguage
  const [grade, setGrade] = useState('7')
  const [difficulty, setDifficulty] = useState('medium')
  const [count, setCount] = useState(10)
  const [topics, setTopics] = useState('Algebra · linear equations, word problems')

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
      <Card title={t('exams.ai.settingsTitle')}>
        <div className="flex flex-col gap-3.5">
          <Field label={t('exams.ai.subject')}>
            <Select defaultValue="Mathematics">
              <option>Mathematics</option>
              <option>Science</option>
              <option>English</option>
              <option>History</option>
            </Select>
          </Field>
          <Field label={t('exams.ai.grade')}>
            <Select value={grade} onChange={(e) => setGrade(e.target.value)}>
              {['6', '7', '8', '9', '10'].map((g) => (
                <option key={g}>{g}</option>
              ))}
            </Select>
          </Field>
          <Field label={t('exams.ai.topics')} hint={t('exams.ai.topicsHint')}>
            <Textarea value={topics} onChange={(e) => setTopics(e.target.value)} rows={3} />
          </Field>
          <Field label={t('exams.ai.difficulty')}>
            <Segmented
              value={difficulty}
              onChange={setDifficulty}
              options={[
                { label: t('exams.ai.easy'), value: 'easy' },
                { label: t('exams.ai.medium'), value: 'medium' },
                { label: t('exams.ai.hard'), value: 'hard' },
              ]}
            />
          </Field>
          <Field label={t('exams.ai.questionCount')}>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={5}
                max={30}
                step={1}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="flex-1 accent-[var(--eduos-primary)]"
              />
              <span className="w-7 text-right font-semibold">{formatNumber(count, lang)}</span>
            </div>
          </Field>
          <Button variant="primary" icon={<Sparkles size={16} />}>
            {t('actions.generate')}
          </Button>
        </div>
      </Card>

      <Card
        title={t('exams.ai.draftTitle')}
        sub={t('exams.ai.draftSub', { grade, difficulty: t(`exams.ai.${difficulty}`), count: formatNumber(count, lang) })}
        actions={
          <>
            <Button variant="secondary" size="sm" icon={<RotateCw size={14} />}>
              {t('actions.regenerate')}
            </Button>
            <Button variant="ghost" size="sm" icon={<Pencil size={14} />}>
              {t('actions.edit')}
            </Button>
          </>
        }
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge tone="info">Algebra</Badge>
          <Badge tone="info">Linear equations</Badge>
          <Badge tone="info">Word problems</Badge>
          <Badge tone="neutral">{t('exams.ai.estimated')}</Badge>
        </div>
        <ol className="flex list-none flex-col gap-3.5 p-0">
          {QUESTIONS.map((qn, i) => (
            <li key={i} className="rounded-md border border-divider p-3.5">
              <div className="flex items-start gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-sm bg-primary-tint text-[13px] font-bold text-primary">
                  {formatNumber(i + 1, lang)}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{qn.q}</div>
                  {qn.opts && (
                    <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {qn.opts.map((o, j) => (
                        <label
                          key={j}
                          className={cn(
                            'flex items-center gap-2 rounded-sm border px-2.5 py-2 text-[13px]',
                            j === qn.correct ? 'border-success bg-success-tint/40' : 'border-border',
                          )}
                        >
                          <span
                            className={cn(
                              'inline-block h-3.5 w-3.5 rounded-full border-2',
                              j === qn.correct ? 'border-success bg-success' : 'border-border-strong',
                            )}
                          />
                          {o}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Badge tone="neutral">{t(`exams.ai.types.${qn.type}`)}</Badge>
                  <span className="text-xs text-fg-3">{t('exams.ai.marks', { count: formatNumber(qn.marks, lang) })}</span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  )
}

function ExamRoutineTab({
  canManage,
  onNew,
}: {
  canManage: boolean
  onNew: () => void
}) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'en') as AppLanguage
  const examsQuery = useExams()
  const classesQuery = useClasses()
  const subjectsQuery = useSubjects()
  const [selectedClassId, setSelectedClassId] = useState<string>('all')

  const exams = useMemo(() => examsQuery.data ?? [], [examsQuery.data])

  // Filter exams chronologically
  const filteredExams = useMemo(() => {
    let list = exams
    if (selectedClassId !== 'all') {
      list = list.filter((e) => e.class_id === selectedClassId)
    }
    return [...list].sort((a, b) => (a.exam_date ?? '').localeCompare(b.exam_date ?? ''))
  }, [exams, selectedClassId])

  // KPIs
  const uniqueDates = new Set(filteredExams.map((e) => e.exam_date).filter(Boolean))
  const activeHalls = Math.max(1, Math.min(filteredExams.length, 3))

  function downloadExamRoutine() {
    const targetClass = classesQuery.data?.find((c) => c.id === selectedClassId)
    const className = targetClass ? targetClass.name : 'All Classes'
    const subjectMap = new Map((subjectsQuery.data ?? []).map((s) => [s.id, s.code]))

    const bytes = createExamRoutinePdf({
      schoolName: t('app.school'),
      eiin: '108234',
      academicYear: '2026',
      examTitle: 'Half-Yearly Examination 2026',
      className,
      items: filteredExams.map((e, idx) => ({
        date: e.exam_date ?? '2026-06-15',
        dayOfWeek: getWeekdayName(e.exam_date ?? '', 'en'),
        timeSlot: idx % 2 === 0 ? '10:00 AM – 1:00 PM' : '2:00 PM – 5:00 PM',
        subjectName: e.subject_name ?? 'Subject',
        paperCode: subjectMap.get(e.subject_id ?? '') ?? `SUB-${101 + idx}`,
        totalMarks: e.total_marks,
        room: `Hall ${String.fromCharCode(65 + (idx % 3))}`,
        invigilator: 'Assigned Teacher',
      })),
    })

    const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `exam-routine-${className.toLowerCase().replace(/\s+/g, '-')}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportExamRoutineCsv() {
    const csv = [
      'date,day,time,class,subject,marks,room,invigilator,status',
      ...filteredExams.map((e, idx) =>
        [
          e.exam_date ?? '',
          getWeekdayName(e.exam_date ?? '', 'en'),
          idx % 2 === 0 ? '10:00 AM – 1:00 PM' : '2:00 PM – 5:00 PM',
          JSON.stringify(e.class_name ?? ''),
          JSON.stringify(e.subject_name ?? ''),
          e.total_marks,
          `Hall ${String.fromCharCode(65 + (idx % 3))}`,
          'Assigned Teacher',
          e.state,
        ].join(','),
      ),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `exam-routine-${selectedClassId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPI
          icon={Calendar}
          label={t('exams.routine.kpi.totalExams')}
          value={formatNumber(filteredExams.length, lang)}
          footer="Across scheduled sessions"
        />
        <KPI
          icon={CheckCircle}
          label={t('exams.routine.kpi.examDays')}
          value={formatNumber(uniqueDates.size, lang)}
          footer="Active examination days"
        />
        <KPI
          icon={ClipboardList}
          label={t('exams.routine.kpi.halls')}
          value={formatNumber(activeHalls, lang)}
          footer="Designated exam halls"
        />
        <KPI
          icon={BarChart3}
          label={t('exams.routine.kpi.status')}
          value="Official"
          footer="Session 2026"
          deltaTone="up"
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="h-9 py-1 text-xs"
            aria-label={t('exams.routine.classFilter')}
          >
            <option value="all">{t('exams.routine.allClasses')}</option>
            {(classesQuery.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            icon={<FileDown size={15} />}
            disabled={filteredExams.length === 0}
            onClick={downloadExamRoutine}
          >
            {t('exams.routine.downloadPdf')}
          </Button>
          <Button
            variant="secondary"
            icon={<FileDown size={15} />}
            disabled={filteredExams.length === 0}
            onClick={exportExamRoutineCsv}
          >
            {t('exams.routine.exportCsv')}
          </Button>
          {canManage && (
            <Button variant="primary" icon={<Plus size={15} />} onClick={onNew}>
              {t('actions.newExam')}
            </Button>
          )}
        </div>
      </div>

      <TableWrap>
        <Table className="min-w-[820px]">
          <THead>
            <TR>
              <TH>{t('exams.routine.table.dateDay')}</TH>
              <TH>{t('exams.routine.table.time')}</TH>
              <TH>{t('exams.routine.table.class')}</TH>
              <TH>{t('exams.routine.table.subject')}</TH>
              <TH num>{t('exams.routine.table.marks')}</TH>
              <TH>{t('exams.routine.table.room')}</TH>
              <TH>{t('exams.routine.table.invigilator')}</TH>
              <TH>{t('exams.table.status')}</TH>
            </TR>
          </THead>
          <TBody>
            {examsQuery.isPending ? (
              <TR>
                <TD className="py-10 text-center" colSpan={8}>
                  <Loader2 className="mx-auto animate-spin text-primary" size={22} />
                </TD>
              </TR>
            ) : filteredExams.length === 0 ? (
              <TR>
                <TD className="py-8" colSpan={8}>
                  <Empty
                    icon={ClipboardList}
                    title={t('exams.routine.empty')}
                    sub={t('exams.routine.emptySub')}
                  />
                </TD>
              </TR>
            ) : (
              filteredExams.map((e, idx) => {
                const dayName = getWeekdayName(e.exam_date ?? '', lang)
                const timeSlot = idx % 2 === 0 ? '10:00 AM – 1:00 PM' : '2:00 PM – 5:00 PM'
                const room = `Hall ${String.fromCharCode(65 + (idx % 3))}`
                return (
                  <TR key={e.id}>
                    <TD>
                      <div className="font-semibold text-fg-1">
                        {e.exam_date ? formatDate(e.exam_date, lang) : '—'}
                      </div>
                      <div className="text-xs text-fg-3">{dayName}</div>
                    </TD>
                    <TD className="text-xs font-mono text-fg-2">{timeSlot}</TD>
                    <TD className="font-medium text-fg-1">{e.class_name ?? '—'}</TD>
                    <TD>
                      <span className="font-semibold text-fg-1">{e.subject_name ?? '—'}</span>
                    </TD>
                    <TD num className="font-semibold">
                      {formatNumber(e.total_marks, lang)}
                    </TD>
                    <TD className="text-xs font-mono text-fg-2">{room}</TD>
                    <TD className="text-xs text-fg-3">Assigned Teacher</TD>
                    <TD>
                      <Badge tone={examTone[e.state]}>{t(examKey[e.state])}</Badge>
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

export default function Exams() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const canManage = profile?.role === 'owner' || profile?.role === 'admin' || profile?.role === 'teacher'
  const [tab, setTab] = useState<'list' | 'routine' | 'ai'>('list')
  const classesQuery = useClasses()
  const subjectsQuery = useSubjects()
  const saveExam = useSaveExam()
  const deleteExam = useDeleteExam()
  const [editorOpen, setEditorOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ExamWithStats | null>(null)
  const [exportTarget, setExportTarget] = useState<ExamWithStats | null>(null)
  const questionsQuery = useExamQuestions(exportTarget?.id ?? null)
  const [form, setForm] = useState({ id: null as string | null, name: '', classId: '', subjectId: '', date: '', totalMarks: '100', state: 'scheduled' as ExamState })

  function openNew() { setForm({ id: null, name: '', classId: '', subjectId: '', date: '', totalMarks: '100', state: 'scheduled' }); setEditorOpen(true); saveExam.reset() }
  function openEdit(exam: ExamWithStats) { setForm({ id: exam.id, name: exam.name, classId: exam.class_id ?? '', subjectId: exam.subject_id ?? '', date: exam.exam_date ?? '', totalMarks: String(exam.total_marks), state: exam.state }); setEditorOpen(true); saveExam.reset() }
  function submitExam() {
    const totalMarks = Number(form.totalMarks)
    if (!form.name.trim() || !form.classId || !form.subjectId || !form.date || totalMarks <= 0 || totalMarks > 1000) return
    saveExam.mutate({ id: form.id, name: form.name, classId: form.classId, subjectId: form.subjectId, date: form.date, totalMarks, state: form.state }, { onSuccess: () => setEditorOpen(false) })
  }
  useEffect(() => {
    if (!exportTarget || questionsQuery.isPending) return
    const questions = questionsQuery.data?.length ? questionsQuery.data.map((question) => ({ prompt: question.prompt, marks: question.marks, options: question.options })) : QUESTIONS.map((question) => ({ prompt: question.q, marks: question.marks, options: question.opts }))
    const bytes = createQuestionPaperPdf({ school: t('app.school'), exam: exportTarget.name, className: exportTarget.class_name ?? '—', subject: exportTarget.subject_name ?? '—', date: exportTarget.exam_date ?? '', totalMarks: exportTarget.total_marks, questions })
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `question-paper-${exportTarget.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`; anchor.click(); URL.revokeObjectURL(url); setTimeout(() => setExportTarget(null), 0)
  }, [exportTarget, questionsQuery.data, questionsQuery.isPending, t])

  return (
    <div>
      <PageHeader
        title={t('exams.title')}
        sub={t('exams.sub')}
        actions={canManage ? (
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={<Ticket size={16} />} onClick={() => navigate('/admit-cards')}>
              {t('nav.admitCards')}
            </Button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={openNew}>
              {t('actions.newExam')}
            </Button>
          </div>
        ) : undefined}
      />
      <div className="mb-4">
        <Segmented
          value={tab}
          onChange={setTab}
          options={canManage ? [
            { label: t('exams.tabs.list'), value: 'list' },
            { label: t('exams.tabs.routine'), value: 'routine' },
            { label: t('exams.tabs.ai'), value: 'ai' },
          ] : [
            { label: t('exams.tabs.list'), value: 'list' },
            { label: t('exams.tabs.routine'), value: 'routine' },
          ]}
        />
      </div>
      {tab === 'list' ? (
        <ExamsListTab canManage={canManage} onEdit={openEdit} onDelete={setDeleteTarget} onExport={setExportTarget} />
      ) : tab === 'routine' ? (
        <ExamRoutineTab canManage={canManage} onNew={openNew} />
      ) : canManage ? (
        <AIBuilderTab />
      ) : null}
      <Modal open={editorOpen} onClose={() => setEditorOpen(false)} title={form.id ? t('exams.schedule.editTitle') : t('exams.schedule.newTitle')} sub={t('exams.schedule.sub')} footer={<><Button variant="secondary" onClick={() => setEditorOpen(false)}>{t('actions.cancel')}</Button><Button variant="primary" onClick={submitExam} disabled={saveExam.isPending}>{saveExam.isPending ? t('common.saving') : t('actions.save')}</Button></>}>
        {saveExam.isError && <div className="mb-3 text-sm text-danger">{saveExam.error.message}</div>}
        <div className="grid gap-4 sm:grid-cols-2"><Field className="sm:col-span-2" label={t('exams.schedule.name')}><Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></Field><Field label={t('results.table.class')}><Select value={form.classId} onChange={(event) => setForm((current) => ({ ...current, classId: event.target.value }))}><option value="">—</option>{(classesQuery.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field><Field label={t('exams.ai.subject')}><Select value={form.subjectId} onChange={(event) => setForm((current) => ({ ...current, subjectId: event.target.value }))}><option value="">—</option>{(subjectsQuery.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field><Field label={t('exams.table.date')}><Input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} /></Field><Field label={t('results.table.totalMarks')}><Input type="number" min="1" max="1000" value={form.totalMarks} onChange={(event) => setForm((current) => ({ ...current, totalMarks: event.target.value }))} /></Field><Field className="sm:col-span-2" label={t('exams.table.status')}><Select value={form.state} onChange={(event) => setForm((current) => ({ ...current, state: event.target.value as ExamState }))}><option value="draft">{t('badge.draft')}</option><option value="scheduled">{t('badge.scheduled')}</option></Select></Field></div>
      </Modal>
      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title={t('exams.schedule.deleteTitle')} sub={deleteTarget?.name} footer={<><Button variant="secondary" onClick={() => setDeleteTarget(null)}>{t('actions.cancel')}</Button><Button variant="primary" onClick={() => deleteTarget && deleteExam.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })} disabled={deleteExam.isPending}>{t('actions.remove')}</Button></>}><p className="text-sm text-fg-2">{t('exams.schedule.deleteBody')}</p>{deleteExam.isError && <p className="mt-3 text-sm text-danger">{deleteExam.error.message}</p>}</Modal>
    </div>
  )
}
