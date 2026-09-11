import { Fragment, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Printer, Download, Plus, Trash2, Clock, Calendar, Users, Bookmark, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { KPI } from '@/components/ui/KPI'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Field, Input, Select } from '@/components/ui/form'
import { formatNumber, cn } from '@/lib/utils'
import { useDeleteTimetableSlot, useSaveTimetableSlot, useTimetable, useTimetableTeachers, type SlotJoined } from '@/data/timetable'
import { useClasses } from '@/data/students'
import { useSubjects } from '@/data/assignments'
import { useAuth } from '@/auth/context'
import type { AppLanguage } from '@/i18n'

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

// Fixed school-day skeleton: P1–P8 plus break/lunch rows. Slot rows from the DB
// land in their period; slot start/end times override the defaults when present.
const PERIODS: { p: string | null; period: number | null; time: string; label?: 'break' | 'lunch' }[] = [
  { p: 'P1', period: 1, time: '8:00 – 8:40' },
  { p: 'P2', period: 2, time: '8:45 – 9:25' },
  { p: 'P3', period: 3, time: '9:30 – 10:10' },
  { p: null, period: null, time: '', label: 'break' },
  { p: 'P4', period: 4, time: '10:25 – 11:05' },
  { p: 'P5', period: 5, time: '11:10 – 11:50' },
  { p: 'P6', period: 6, time: '11:55 – 12:35' },
  { p: null, period: null, time: '', label: 'lunch' },
  { p: 'P7', period: 7, time: '1:30 – 2:10' },
  { p: 'P8', period: 8, time: '2:15 – 2:55' },
]

const SUBJECT_COLORS: Record<string, [string, string]> = {
  Mathematics: ['#2F6FED', '#EAF1FE'],
  Science: ['#16A34A', '#DCFCE7'],
  English: ['#7C3AED', '#EDE9FE'],
  History: ['#D97706', '#FEF3C7'],
  Geography: ['#0891B2', '#CFFAFE'],
}

function SlotCell({ slot, freeText, onClick }: { slot: SlotJoined | undefined; freeText: string; onClick?: () => void }) {
  if (!slot) {
    return <button type="button" onClick={onClick} className="flex h-full w-full items-center justify-center text-xs text-fg-4 hover:bg-primary-tint/60">{freeText}</button>
  }
  const subject = slot.subject_name ?? '—'
  const [color, tint] = SUBJECT_COLORS[subject] ?? ['#475569', '#F1F3F6']
  return (
    <button type="button" onClick={onClick} className="flex h-full w-full flex-col justify-center gap-0.5 px-2 py-1.5 text-left" style={{ background: tint, borderLeft: `3px solid ${color}` }}>
      <div className="text-xs font-bold leading-tight" style={{ color }}>
        {slot.class_name ?? subject}
      </div>
      {slot.class_name && <div className="text-[11px] leading-tight text-fg-2">{subject}</div>}
      {(slot.teacher_name || slot.room) && <div className="truncate text-[10px] text-fg-3">{[slot.teacher_name, slot.room].filter(Boolean).join(' · ')}</div>}
    </button>
  )
}

interface SlotDraft { id: string | null; classId: string; subjectId: string; teacherId: string; day: number; period: number; start: string; end: string; room: string }
const blankDraft = (day = 1, period = 1): SlotDraft => ({ id:null, classId:'', subjectId:'', teacherId:'', day, period, start:'', end:'', room:'' })

export default function Timetable() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'en') as AppLanguage
  const timetableQuery = useTimetable()
  const classesQuery = useClasses()
  const subjectsQuery = useSubjects()
  const saveSlot = useSaveTimetableSlot()
  const deleteSlot = useDeleteTimetableSlot()
  const { profile } = useAuth()
  const canManage = profile?.role === 'owner' || profile?.role === 'admin' || profile?.role === 'teacher'
  const teachersQuery = useTimetableTeachers(canManage)
  const [draft, setDraft] = useState<SlotDraft | null>(null)
  const [formError, setFormError] = useState('')
  const slots = timetableQuery.data ?? []

  // day_of_week is 1-based Mon..Sat in our schema.
  const todayIdx = 0 // demo highlight: Monday
  const byCell = new Map<string, SlotJoined>()
  for (const s of slots) byCell.set(`${s.day_of_week}-${s.period}`, s)

  const teaching = slots.filter((s) => s.day_of_week === todayIdx + 1).length
  const totalSlots = 6 * 8
  const loadPct = totalSlots ? Math.round((slots.length / totalSlots) * 100) : 0
  const classNames = [...new Set(slots.map((s) => s.class_name).filter(Boolean))] as string[]
  const subjectNames = [...new Set(slots.map((s) => s.subject_name).filter(Boolean))] as string[]

  function editSlot(slot: SlotJoined | undefined, day: number, period: number) {
    if (!canManage) return
    setFormError('')
    setDraft(slot ? { id:slot.id, classId:slot.class_id, subjectId:slot.subject_id ?? '', teacherId:slot.teacher_id ?? '', day:slot.day_of_week, period:slot.period, start:slot.start_time?.slice(0,5) ?? '', end:slot.end_time?.slice(0,5) ?? '', room:slot.room ?? '' } : blankDraft(day, period))
  }

  async function submitSlot() {
    if (!draft || !draft.classId || !draft.subjectId || (draft.start && !draft.end) || (!draft.start && draft.end) || (draft.start && draft.end && draft.start >= draft.end)) { setFormError(t('timetable.form.invalid')); return }
    setFormError('')
    try {
      await saveSlot.mutateAsync({ id:draft.id, classId:draft.classId, subjectId:draft.subjectId, teacherId:draft.teacherId || null, day:draft.day, period:draft.period, start:draft.start || null, end:draft.end || null, room:draft.room })
      setDraft(null)
    } catch (error) { setFormError(error instanceof Error && error.message.includes('timetable_clash') ? t('timetable.form.clash') : t('common.error')) }
  }

  return (
    <div>
      <PageHeader
        title={t('timetable.title')}
        sub={t('timetable.sub')}
        actions={
          <>
            <Button variant="secondary" icon={<Printer size={16} />}>
              {t('actions.print')}
            </Button>
            <Button variant="secondary" icon={<Download size={16} />}>
              {t('actions.export')}
            </Button>
            {canManage && <Button variant="primary" icon={<Plus size={16} />} onClick={() => editSlot(undefined, 1, 1)}>
              {t('actions.editTimetable')}
            </Button>}
          </>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPI icon={Clock} label={t('timetable.kpi.teachingToday')} value={t('timetable.kpi.teachingTodayValue', { count: formatNumber(teaching, lang) })} footer={t('timetable.kpi.teachingTodayFooter')} />
        <KPI icon={Calendar} label={t('timetable.kpi.weeklyLoad')} value={`${formatNumber(slots.length, lang)} / ${formatNumber(totalSlots, lang)}`} delta={`${formatNumber(loadPct, lang)}%`} deltaTone="up" footer={t('timetable.kpi.weeklyLoadFooter')} />
        <KPI icon={Users} label={t('timetable.kpi.classes')} value={formatNumber(classNames.length, lang)} footer={classNames.join(' · ') || '—'} />
        <KPI icon={Bookmark} label={t('timetable.kpi.subjects')} value={subjectNames[0] ?? '—'} footer={t('timetable.kpi.subjectsFooter')} />
      </div>

      <Card
        title={t('timetable.weekOf')}
        pad={false}
        actions={
          <>
            <button className="grid h-9 w-9 place-items-center rounded-sm text-fg-2 hover:bg-neutral-100">
              <ChevronLeft size={16} />
            </button>
            <Button variant="secondary" size="sm" icon={<Calendar size={14} />}>
              {t('actions.thisWeek')}
            </Button>
            <button className="grid h-9 w-9 place-items-center rounded-sm text-fg-2 hover:bg-neutral-100">
              <ChevronRight size={16} />
            </button>
          </>
        }
      >
        {timetableQuery.isPending ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="animate-spin text-primary" size={22} />
          </div>
        ) : (
          <div className="overflow-auto">
            <div className="grid min-w-[980px] grid-cols-[120px_repeat(6,1fr)]">
              {/* Header row */}
              <div className="border-b border-border bg-neutral-50 px-3 py-2.5" />
              {DAY_KEYS.map((d, i) => (
                <div
                  key={d}
                  className={cn(
                    'border-b border-l border-divider px-3 py-2.5 text-center text-[13px] font-semibold',
                    i === todayIdx ? 'bg-primary-tint text-primary' : 'bg-neutral-50 text-fg-2',
                  )}
                >
                  {t(`common.weekdaysShort.${d}`)}
                  {i === todayIdx && <span className="ml-1 text-[10px] font-bold tracking-wide">· {t('timetable.today')}</span>}
                </div>
              ))}

              {/* Period rows */}
              {PERIODS.map((row, rIdx) => {
                const isBreak = row.period == null
                const last = rIdx === PERIODS.length - 1
                return (
                  <Fragment key={rIdx}>
                    <div
                      className={cn(
                        'flex flex-col justify-center gap-0.5 px-3 py-2',
                        isBreak ? 'bg-neutral-50' : 'bg-surface',
                        !last && 'border-b border-divider',
                      )}
                    >
                      <div className={cn('text-[13px] font-bold', isBreak ? 'text-fg-3' : 'text-fg-1')}>
                        {row.p ?? t(`timetable.${row.label}`)}
                      </div>
                      {row.p && <div className="text-[11px] tabular-nums text-fg-3">{row.time}</div>}
                    </div>
                    {DAY_KEYS.map((d, dIdx) => (
                      <div
                        key={d + rIdx}
                        className={cn(
                          'h-[58px] border-l border-divider',
                          !last && 'border-b border-divider',
                          isBreak ? 'bg-neutral-50' : dIdx === todayIdx ? 'bg-primary-tint/35' : 'bg-surface',
                        )}
                      >
                        {isBreak ? (
                          <div className="flex h-full items-center justify-center text-[11px] font-medium uppercase tracking-wide text-fg-4">
                            {t(`timetable.${row.label}`)}
                          </div>
                        ) : (
                          <SlotCell slot={byCell.get(`${dIdx + 1}-${row.period}`)} freeText={t('timetable.free')} onClick={() => editSlot(byCell.get(`${dIdx + 1}-${row.period}`), dIdx + 1, row.period!)} />
                        )}
                      </div>
                    ))}
                  </Fragment>
                )
              })}
            </div>
          </div>
        )}
      </Card>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <div className="text-[11px] font-medium uppercase tracking-wider text-fg-3">{t('timetable.subjectsLegend')}</div>
        {Object.entries(SUBJECT_COLORS).map(([s, [c]]) => (
          <div key={s} className="inline-flex items-center gap-1.5 text-xs">
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: c }} />
            <span className="text-fg-2">{s}</span>
          </div>
        ))}
      </div>

      <Modal open={draft != null} onClose={() => setDraft(null)} title={draft?.id ? t('timetable.form.editTitle') : t('timetable.form.addTitle')} footer={<><Button variant="secondary" onClick={() => setDraft(null)}>{t('actions.cancel')}</Button>{draft?.id && <Button variant="ghost" icon={<Trash2 size={14}/>} disabled={deleteSlot.isPending} onClick={async () => { if (!draft || !confirm(t('timetable.form.deleteConfirm'))) return; try { await deleteSlot.mutateAsync(draft.id!); setDraft(null) } catch { setFormError(t('common.error')) } }}>{t('actions.remove')}</Button>}<Button variant="primary" disabled={saveSlot.isPending} onClick={() => void submitSlot()}>{saveSlot.isPending ? t('common.saving') : t('actions.save')}</Button></>}>
        {draft && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('timetable.form.class')}><Select value={draft.classId} onChange={(e) => setDraft({...draft,classId:e.target.value})}><option value="">—</option>{(classesQuery.data ?? []).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select></Field>
          <Field label={t('timetable.form.subject')}><Select value={draft.subjectId} onChange={(e) => setDraft({...draft,subjectId:e.target.value})}><option value="">—</option>{(subjectsQuery.data ?? []).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select></Field>
          <Field label={t('timetable.form.teacher')}><Select value={draft.teacherId} onChange={(e) => setDraft({...draft,teacherId:e.target.value})}><option value="">—</option>{(teachersQuery.data ?? []).map((x) => <option key={x.id} value={x.id}>{x.full_name}</option>)}</Select></Field>
          <Field label={t('timetable.form.day')}><Select value={draft.day} onChange={(e) => setDraft({...draft,day:Number(e.target.value)})}>{DAY_KEYS.map((x,i) => <option key={x} value={i+1}>{t(`common.weekdaysShort.${x}`)}</option>)}</Select></Field>
          <Field label={t('timetable.form.period')}><Select value={draft.period} onChange={(e) => setDraft({...draft,period:Number(e.target.value)})}>{Array.from({length:8},(_,i) => <option key={i+1} value={i+1}>P{i+1}</option>)}</Select></Field>
          <Field label={t('timetable.form.room')}><Input value={draft.room} onChange={(e) => setDraft({...draft,room:e.target.value})}/></Field>
          <Field label={t('timetable.form.start')}><Input type="time" value={draft.start} onChange={(e) => setDraft({...draft,start:e.target.value})}/></Field>
          <Field label={t('timetable.form.end')}><Input type="time" value={draft.end} onChange={(e) => setDraft({...draft,end:e.target.value})}/></Field>
          {formError && <div className="sm:col-span-2 rounded-sm bg-danger-tint px-3 py-2 text-sm text-danger">{formError}</div>}
        </div>}
      </Modal>
    </div>
  )
}
