import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Send, TrendingUp, Award, CircleAlert, FileText, Save, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { KPI } from '@/components/ui/KPI'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Empty } from '@/components/ui/Empty'
import { Avatar } from '@/components/ui/Avatar'
import { Segmented } from '@/components/ui/Segmented'
import { Field, Input, Select } from '@/components/ui/form'
import { TableWrap, Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { formatNumber, cn } from '@/lib/utils'
import { useExams } from '@/data/exams'
import { useStudents } from '@/data/students'
import { useResults, useSaveResults, gradeFromPct, type SaveResultRow } from '@/data/results'
import type { AppLanguage } from '@/i18n'
import { useAuth } from '@/auth/context'
import { averageGpa, gradeForPercentage, validMarks } from '@/lib/grading'
import { createReportCardPdf } from '@/lib/report-card-pdf'

const gradeColors: Record<string, [string, string]> = {
  'A+': ['#16A34A', '#DCFCE7'],
  A: ['#16A34A', '#DCFCE7'],
  'A-': ['#2F6FED', '#EAF1FE'],
  B: ['#2F6FED', '#EAF1FE'],
  C: ['#D97706', '#FEF3C7'],
  D: ['#DC2626', '#FEE2E2'],
  F: ['#DC2626', '#FEE2E2'],
}

function GradePill({ g }: { g: string }) {
  const [c, bg] = gradeColors[g] ?? gradeColors.F
  return (
    <span className="rounded-sm px-2 py-0.5 text-xs font-bold" style={{ color: c, background: bg }}>
      {g}
    </span>
  )
}

interface GradebookRow {
  student_id: string
  name: string
  roll: string | null
  bySubject: Record<string, number>
  avg: number
}

function EnterMarksTab() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'en') as AppLanguage

  const examsQuery = useExams()
  const studentsQuery = useStudents()
  const resultsQuery = useResults()
  const saveResults = useSaveResults()

  const exams = examsQuery.data ?? []
  const [examId, setExamId] = useState<string>('')
  // Local typed marks layered over saved ones; reset when switching exam.
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [publishConfirm, setPublishConfirm] = useState(false)
  const [validationError, setValidationError] = useState('')

  const exam = exams.find((e) => e.id === examId) ?? exams[0]
  const total = exam?.total_marks ?? 100
  const roster = (studentsQuery.data ?? []).filter((s) => !exam?.class_id || s.class_id === exam.class_id)
  const saved = new Map(
    (resultsQuery.data ?? [])
      .filter((r) => r.exam_id === exam?.id)
      .map((r) => [r.student_id, r.marks_obtained]),
  )

  function markFor(studentId: string): string {
    if (studentId in edits) return edits[studentId]
    const m = saved.get(studentId)
    return m != null ? String(m) : ''
  }

  function commit(published: boolean) {
    if (!exam) return
    const invalid = roster.filter((student) => {
      const raw = markFor(student.id)
      return raw !== '' && !validMarks(raw, total)
    })
    if (invalid.length || (published && roster.some((student) => !validMarks(markFor(student.id), total)))) {
      setValidationError(published ? t('results.publishIncomplete') : t('results.invalidMarks'))
      return
    }
    const rows: SaveResultRow[] = roster
      .map((s): SaveResultRow | null => {
        const raw = markFor(s.id)
        if (raw === '') return null
        const marks = Number(raw)
        return {
          school_id: exam.school_id,
          exam_id: exam.id,
          student_id: s.id,
          marks_obtained: marks,
          grade: gradeFromPct((marks / total) * 100),
          published,
        }
      })
      .filter((r): r is SaveResultRow => r !== null)
    if (rows.length) saveResults.mutate({ rows, examName: exam.name }, { onSuccess: () => { setEdits({}); setValidationError(''); setPublishConfirm(false) } })
  }

  const loading = examsQuery.isPending || studentsQuery.isPending || resultsQuery.isPending

  return (
    <>
      <Card>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[2fr_1fr_1fr]">
          <Field label={t('results.table.exam')}>
            <Select
              value={exam?.id ?? ''}
              onChange={(e) => {
                setExamId(e.target.value)
                setEdits({})
              }}
            >
              {exams.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('results.table.class')}>
            <Input value={exam?.class_name ?? '—'} readOnly />
          </Field>
          <Field label={t('results.table.totalMarks')}>
            <Input value={formatNumber(total, lang)} readOnly />
          </Field>
        </div>
      </Card>
      <div className="h-4" />
      <TableWrap>
        <Table className="min-w-[560px]">
          <THead>
            <TR>
              <TH>{t('results.table.student')}</TH>
              <TH>{t('results.table.roll')}</TH>
              <TH num className="w-40">
                {t('results.table.marksOf', { total: formatNumber(total, lang) })}
              </TH>
              <TH className="w-20">{t('results.table.grade')}</TH>
            </TR>
          </THead>
          <TBody>
            {loading ? (
              <TR>
                <TD className="py-10 text-center" colSpan={4}>
                  <Loader2 className="mx-auto animate-spin text-primary" size={22} />
                </TD>
              </TR>
            ) : roster.length === 0 ? (
              <TR>
                <TD className="py-8 text-center text-sm text-fg-3" colSpan={4}>
                  {t('students.empty')}
                </TD>
              </TR>
            ) : (
              roster.map((s) => {
                const raw = markFor(s.id)
                const pct = raw === '' ? null : (Number(raw) / total) * 100
                return (
                  <TR key={s.id}>
                    <TD>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={s.full_name} />
                        <div className="font-semibold">{s.full_name}</div>
                      </div>
                    </TD>
                    <TD className="text-xs text-fg-3">{s.roll_no ?? '—'}</TD>
                    <TD num>
                      <div className="inline-flex items-center justify-end gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={total}
                          value={raw}
                          onChange={(e) => setEdits((p) => ({ ...p, [s.id]: e.target.value }))}
                          className="w-[72px] text-right"
                        />
                        <span className="text-xs text-fg-3">/ {formatNumber(total, lang)}</span>
                      </div>
                    </TD>
                    <TD>{pct != null ? <GradePill g={gradeFromPct(pct)} /> : <span className="text-fg-4">—</span>}</TD>
                  </TR>
                )
              })
            )}
          </TBody>
        </Table>
      </TableWrap>
      <div className="mt-3.5 flex justify-end gap-2">
        {validationError && <span className="mr-auto self-center text-sm text-danger">{validationError}</span>}
        {saveResults.isError && <span className="mr-auto self-center text-sm text-danger">{saveResults.error.message}</span>}
        <Button variant="secondary" icon={<Save size={16} />} disabled={saveResults.isPending} onClick={() => commit(false)}>
          {t('actions.saveDraft')}
        </Button>
        <Button
          variant="primary"
          icon={saveResults.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          disabled={saveResults.isPending}
          onClick={() => {
            if (roster.some((student) => !validMarks(markFor(student.id), total))) setValidationError(t('results.publishIncomplete'))
            else setPublishConfirm(true)
          }}
        >
          {saveResults.isPending ? t('common.saving') : t('actions.publishResults')}
        </Button>
      </div>
      <Modal open={publishConfirm} onClose={() => setPublishConfirm(false)} title={t('results.publishTitle')} sub={t('results.publishBody')} footer={<><Button variant="secondary" onClick={() => setPublishConfirm(false)}>{t('actions.cancel')}</Button><Button variant="primary" onClick={() => commit(true)} disabled={saveResults.isPending}>{t('actions.publishResults')}</Button></>}><p className="text-sm text-fg-2">{t('results.publishWarning')}</p></Modal>
    </>
  )
}

export default function Results() {
  const { t, i18n } = useTranslation()
  const { profile } = useAuth()
  const canManage = profile?.role === 'owner' || profile?.role === 'admin' || profile?.role === 'teacher'
  const lang = (i18n.resolvedLanguage ?? 'en') as AppLanguage
  const [tab, setTab] = useState<'gradebook' | 'marks' | 'reports'>('gradebook')

  const resultsQuery = useResults()
  const results = resultsQuery.data ?? []
  const published = results.filter((r) => r.published && r.marks_obtained != null)

  // Pivot: rows = students, columns = subjects that have published marks.
  const { rows, subjects } = useMemo(() => {
    const subjects = [...new Set(published.map((r) => r.subject_name ?? r.exam_name ?? '—'))]
    const byStudent = new Map<string, GradebookRow>()
    for (const r of published) {
      const key = r.student_id
      const subject = r.subject_name ?? r.exam_name ?? '—'
      const pct = Math.round(((r.marks_obtained as number) / r.exam_total) * 100)
      const row =
        byStudent.get(key) ??
        ({ student_id: key, name: r.student_name ?? '—', roll: r.student_roll, bySubject: {}, avg: 0 } as GradebookRow)
      row.bySubject[subject] = pct
      byStudent.set(key, row)
    }
    const rows = [...byStudent.values()].map((row) => {
      const vals = Object.values(row.bySubject)
      row.avg = vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0
      return row
    })
    rows.sort((a, b) => (a.roll ?? '').localeCompare(b.roll ?? ''))
    return { rows, subjects }
  }, [published])

  const classAvg = rows.length ? Math.round(rows.reduce((s, r) => s + r.avg, 0) / rows.length) : null
  const top = rows.reduce<GradebookRow | null>((a, r) => (a == null || r.avg > a.avg ? r : a), null)
  const below70 = rows.filter((r) => r.avg < 70).length
  const reportCards = useMemo(() => {
    const grouped = new Map<string, typeof published>()
    for (const result of published) grouped.set(result.student_id, [...(grouped.get(result.student_id) ?? []), result])
    return [...grouped.entries()].map(([studentId, items]) => {
      const percentages = items.map((item) => ((item.marks_obtained ?? 0) / item.exam_total) * 100)
      return { studentId, name: items[0]?.student_name ?? '—', roll: items[0]?.student_roll ?? '', items, average: percentages.reduce((sum, value) => sum + value, 0) / percentages.length, gpa: averageGpa(percentages) }
    })
  }, [published])

  function downloadReportCard(studentId: string) {
    const card = reportCards.find((item) => item.studentId === studentId)
    if (!card) return
    const bytes = createReportCardPdf({ school: t('app.school'), student: card.name, roll: card.roll, average: card.average, gpa: card.gpa, rows: card.items.map((item) => { const pct = ((item.marks_obtained ?? 0) / item.exam_total) * 100; const grade = gradeForPercentage(pct); return { subject: item.subject_name ?? '—', exam: item.exam_name ?? '—', marks: item.marks_obtained ?? 0, total: item.exam_total, grade: grade.letter, gpa: grade.gpa } }) })
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `report-card-${card.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`; anchor.click(); URL.revokeObjectURL(url)
  }
  function exportGradebook() {
    const csv = ['student,roll,average,grade,gpa', ...rows.map((row) => [JSON.stringify(row.name), row.roll ?? '', row.avg, gradeForPercentage(row.avg).letter, gradeForPercentage(row.avg).gpa].join(','))].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'gradebook.csv'; anchor.click(); URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHeader
        title={t('results.title')}
        sub={t('results.sub')}
        actions={canManage ? (
          <>
            <Button variant="secondary" icon={<Download size={16} />} onClick={exportGradebook}>
              {t('actions.export')}
            </Button>
          </>
        ) : undefined}
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPI
          icon={TrendingUp}
          label={t('results.kpi.classAverage')}
          value={classAvg != null ? `${formatNumber(classAvg, lang)}%` : '—'}
          delta={classAvg != null ? t('results.kpi.classAverageDelta') : undefined}
          deltaTone="up"
        />
        <KPI
          icon={Award}
          label={t('results.kpi.topPerformer')}
          value={top ? top.name.split(' ')[0] : '—'}
          footer={top ? t('results.kpi.topPerformerFooter', { pct: formatNumber(top.avg, lang) }) : undefined}
        />
        <KPI
          icon={CircleAlert}
          label={t('results.kpi.below70')}
          value={formatNumber(below70, lang)}
          delta={below70 > 0 ? t('results.kpi.below70Delta') : undefined}
          deltaTone="down"
        />
        <KPI icon={FileText} label={t('results.kpi.reportsDrafted')} value={formatNumber(reportCards.length, lang)} footer={t('results.kpi.reportsDraftedFooter')} />
      </div>

      <div className="mb-4">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { label: t('results.tabs.gradebook'), value: 'gradebook' },
            ...(canManage ? [{ label: t('results.tabs.marks'), value: 'marks' as const }] : []),
            { label: t('results.tabs.reports'), value: 'reports' },
          ]}
        />
      </div>

      {tab === 'marks' && <EnterMarksTab />}

      {tab === 'gradebook' && (
        <TableWrap>
          <Table className="min-w-[720px]">
            <THead>
              <TR>
                <TH>{t('results.table.student')}</TH>
                {subjects.map((s) => (
                  <TH key={s} num>
                    {s}
                  </TH>
                ))}
                <TH num>{t('results.table.average')}</TH>
                <TH>{t('results.table.grade')}</TH>
              </TR>
            </THead>
            <TBody>
              {resultsQuery.isPending ? (
                <TR>
                  <TD className="py-10 text-center" colSpan={subjects.length + 3}>
                    <Loader2 className="mx-auto animate-spin text-primary" size={22} />
                  </TD>
                </TR>
              ) : resultsQuery.isError ? (
                <TR>
                  <TD className="py-10 text-center" colSpan={subjects.length + 3}>
                    <div className="text-sm text-danger">{t('common.error')}</div>
                    <Button variant="secondary" size="sm" className="mx-auto mt-3" onClick={() => void resultsQuery.refetch()}>
                      {t('common.retry')}
                    </Button>
                  </TD>
                </TR>
              ) : rows.length === 0 ? (
                <TR>
                  <TD className="py-4" colSpan={subjects.length + 3}>
                    <Empty icon={FileText} title={t('results.gradebookEmpty')} sub={t('results.gradebookEmptySub')} />
                  </TD>
                </TR>
              ) : (
                rows.map((g) => (
                  <TR key={g.student_id}>
                    <TD>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={g.name} />
                        <div>
                          <div className="font-semibold">{g.name}</div>
                          <div className="text-xs text-fg-3">{g.roll ?? '—'}</div>
                        </div>
                      </div>
                    </TD>
                    {subjects.map((s) => {
                      const m = g.bySubject[s]
                      return (
                        <TD key={s} num className={cn(m != null && m < 70 && 'text-danger')}>
                          {m != null ? formatNumber(m, lang) : '—'}
                        </TD>
                      )
                    })}
                    <TD num className="font-bold">
                      {formatNumber(g.avg, lang)}
                    </TD>
                    <TD>
                      <GradePill g={gradeFromPct(g.avg)} />
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </TableWrap>
      )}

      {tab === 'reports' && (
        reportCards.length === 0 ? <Card><Empty icon={FileText} title={t('results.reportsEmptyTitle')} sub={t('results.reportsEmptySub')} /></Card> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{reportCards.map((card) => <Card key={card.studentId}><div className="flex items-center gap-3"><Avatar name={card.name} /><div><div className="font-semibold">{card.name}</div><div className="text-xs text-fg-3">{card.roll || '—'}</div></div></div><div className="my-4 grid grid-cols-2 gap-3 rounded-sm bg-app p-3 text-sm"><div><span className="block text-xs text-fg-3">{t('results.table.average')}</span><b>{formatNumber(Math.round(card.average), lang)}%</b></div><div><span className="block text-xs text-fg-3">{t('results.gpa')}</span><b>{formatNumber(card.gpa, lang)} / 5</b></div></div><Button variant="secondary" icon={<Download size={15} />} className="w-full" onClick={() => downloadReportCard(card.studentId)}>{t('results.downloadPdf')}</Button></Card>)}</div>
      )}
    </div>
  )
}
