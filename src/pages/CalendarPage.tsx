import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ExternalLink, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, ClipboardList, Users, FileText,
  Sparkles, CalendarX, Briefcase, BookOpen,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Segmented } from '@/components/ui/Segmented'
import { Modal } from '@/components/ui/Modal'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { formatNumber, cn } from '@/lib/utils'
import { useCalendarEvents, useDeleteCalendarEvent, useSaveCalendarEvent } from '@/data/calendar'
import { useClasses } from '@/data/students'
import { useAuth } from '@/auth/context'
import type { EventType as DbEventType } from '@/types/models'
import type { AppLanguage } from '@/i18n'

type EventType = 'Exam' | 'PTM' | 'Assignment' | 'Event' | 'Holiday' | 'Meeting' | 'Class'

interface CalEvent {
  id: string
  title: string
  date: string
  time: string
  type: EventType
  location: string | null
  description: string | null
  classId: string | null
}

interface EventDraft { id:string|null; title:string; description:string; type:DbEventType; date:string; time:string; location:string; classId:string }

const DB_TYPE_TO_UI: Record<DbEventType, EventType> = {
  exam: 'Exam',
  ptm: 'PTM',
  assignment: 'Assignment',
  event: 'Event',
  holiday: 'Holiday',
  meeting: 'Meeting',
  class: 'Class',
}
const UI_TYPE_TO_DB = Object.fromEntries(Object.entries(DB_TYPE_TO_UI).map(([db,ui]) => [ui,db])) as Record<EventType,DbEventType>

const TYPE_META: Record<EventType, { color: string; tint: string; icon: LucideIcon }> = {
  Exam: { color: '#2F6FED', tint: '#EAF1FE', icon: ClipboardList },
  PTM: { color: '#7C3AED', tint: '#EDE9FE', icon: Users },
  Assignment: { color: '#D97706', tint: '#FEF3C7', icon: FileText },
  Event: { color: '#16A34A', tint: '#DCFCE7', icon: Sparkles },
  Holiday: { color: '#DC2626', tint: '#FEE2E2', icon: CalendarX },
  Meeting: { color: '#475569', tint: '#E5E7EB', icon: Briefcase },
  Class: { color: '#0891B2', tint: '#CFFAFE', icon: BookOpen },
}

const badgeForType: Record<EventType, BadgeTone> = {
  Exam: 'info', PTM: 'info', Holiday: 'danger', Assignment: 'warning', Event: 'success', Meeting: 'neutral', Class: 'info',
}

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
const TODAY_ISO = '2026-05-25'

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function CalendarPage() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'en') as AppLanguage
  const intlLocale = lang === 'bn' ? 'bn-BD' : 'en-US'

  const [year, setYear] = useState(2026)
  const [month, setMonth] = useState(4) // May (0-indexed)
  const [selected, setSelected] = useState('2026-05-27')
  const [filter, setFilter] = useState<Set<EventType>>(new Set(Object.keys(TYPE_META) as EventType[]))
  const [draft, setDraft] = useState<EventDraft | null>(null)
  const [formError, setFormError] = useState('')
  const { user, profile } = useAuth()
  const canManage = profile?.role === 'owner' || profile?.role === 'admin' || profile?.role === 'teacher'
  const classesQuery = useClasses()
  const saveEvent = useSaveCalendarEvent()
  const deleteEvent = useDeleteCalendarEvent()

  const eventsQuery = useCalendarEvents()
  const EVENTS: CalEvent[] = (eventsQuery.data ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    date: e.event_date,
    time: e.event_time ?? '',
    type: DB_TYPE_TO_UI[e.type] ?? 'Event',
    location: e.location,
    description: e.description,
    classId: e.class_id,
  }))

  function openEvent(e?: CalEvent) {
    setFormError('')
    setDraft(e ? { id:e.id,title:e.title,description:e.description ?? '',type:UI_TYPE_TO_DB[e.type],date:e.date,time:e.time,location:e.location ?? '',classId:e.classId ?? '' } : { id:null,title:'',description:'',type:'event',date:selected,time:'',location:'',classId:'' })
  }
  async function submitEvent() {
    if (!draft || !draft.title.trim() || !draft.date || !profile?.school_id || !user) { setFormError(t('calendar.form.invalid')); return }
    try { await saveEvent.mutateAsync({ id:draft.id,school_id:profile.school_id,created_by:user.id,title:draft.title.trim(),description:draft.description.trim()||null,type:draft.type,event_date:draft.date,event_time:draft.time||null,location:draft.location.trim()||null,class_id:draft.classId||null }); setDraft(null) }
    catch { setFormError(t('common.error')) }
  }

  const monthName = new Date(year, month, 1).toLocaleString(intlLocale, { month: 'long' })

  const first = new Date(year, month, 1)
  const startWeekday = (first.getDay() + 6) % 7 // Mon = 0
  const numDays = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= numDays; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)

  const byDate = EVENTS.reduce<Record<string, CalEvent[]>>((m, e) => {
    ;(m[e.date] ||= []).push(e)
    return m
  }, {})
  const visible = EVENTS.filter((e) => filter.has(e.type))
  const selectedEvents = visible.filter((e) => e.date === selected).sort((a, b) => a.time.localeCompare(b.time))
  const upcoming = visible
    .filter((e) => e.date >= TODAY_ISO)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 6)

  function toggleFilter(ty: EventType) {
    const next = new Set(filter)
    if (next.has(ty)) next.delete(ty)
    else next.add(ty)
    setFilter(next)
  }

  function prevMonth() {
    if (month === 0) {
      setMonth(11)
      setYear(year - 1)
    } else setMonth(month - 1)
  }
  function nextMonth() {
    if (month === 11) {
      setMonth(0)
      setYear(year + 1)
    } else setMonth(month + 1)
  }

  const selectedTitle = new Date(selected).toLocaleDateString(intlLocale, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div>
      <PageHeader
        title={t('calendar.title')}
        sub={t('calendar.sub')}
        actions={
          <>
            <Button variant="secondary" icon={<ExternalLink size={16} />}>
              {t('actions.syncGoogle')}
            </Button>
            {canManage && <Button variant="primary" icon={<Plus size={16} />} onClick={() => openEvent()}>
              {t('actions.newEvent')}
            </Button>}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
        <Card pad={false}>
          <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
            <button onClick={prevMonth} className="grid h-9 w-9 place-items-center rounded-sm text-fg-2 hover:bg-neutral-100">
              <ChevronLeft size={16} />
            </button>
            <div className="min-w-40 text-base font-bold">
              {monthName} {formatNumber(year, lang)}
            </div>
            <button onClick={nextMonth} className="grid h-9 w-9 place-items-center rounded-sm text-fg-2 hover:bg-neutral-100">
              <ChevronRight size={16} />
            </button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setMonth(4)
                setYear(2026)
                setSelected(TODAY_ISO)
              }}
            >
              {t('actions.today')}
            </Button>
            <div className="ml-auto">
              <Segmented
                value="month"
                onChange={() => {}}
                options={[
                  { label: t('calendar.month'), value: 'month' },
                  { label: t('calendar.week'), value: 'week' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-7">
            {DAY_KEYS.map((d) => (
              <div key={d} className="border-b border-divider px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-fg-3">
                {t(`common.weekdaysShort.${d}`)}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {cells.map((d, i) => {
              if (!d) return <div key={i} className="min-h-24 border-r border-b border-divider bg-neutral-50" />
              const iso = toISO(d)
              const es = (byDate[iso] ?? []).filter((e) => filter.has(e.type))
              const isToday = iso === TODAY_ISO
              const isSel = iso === selected
              return (
                <div
                  key={i}
                  onClick={() => setSelected(iso)}
                  className={cn(
                    'min-h-24 cursor-pointer border-b border-divider p-1.5',
                    i % 7 === 6 ? '' : 'border-r',
                    isSel ? 'bg-primary-tint' : 'bg-surface',
                  )}
                >
                  <div className="mb-1 flex justify-end">
                    <span
                      className={cn(
                        'grid h-[22px] w-[22px] place-items-center rounded-full text-xs font-semibold',
                        isToday ? 'bg-primary text-white' : 'text-fg-1',
                      )}
                    >
                      {formatNumber(d.getDate(), lang)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {es.slice(0, 3).map((e) => {
                      const m = TYPE_META[e.type]
                      return (
                        <div
                          key={e.id}
                          className="truncate rounded-xs px-1.5 py-0.5 text-[11px] font-semibold"
                          style={{ background: m.tint, color: m.color, borderLeft: `2px solid ${m.color}` }}
                        >
                          {e.title}
                        </div>
                      )
                    })}
                    {es.length > 3 && <div className="px-1.5 text-[11px] text-fg-3">+{formatNumber(es.length - 3, lang)}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card title={t('calendar.filterTitle')}>
            <div className="flex flex-col gap-1.5">
              {(Object.keys(TYPE_META) as EventType[]).map((ty) => {
                const m = TYPE_META[ty]
                return (
                  <label key={ty} className="flex cursor-pointer items-center gap-2.5 px-1 py-1.5">
                    <input type="checkbox" checked={filter.has(ty)} onChange={() => toggleFilter(ty)} />
                    <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: m.color }} />
                    <span className="text-[13px] font-medium text-fg-1">{t(`calendar.types.${ty}`)}</span>
                    <span className="ml-auto text-xs text-fg-3">{formatNumber(EVENTS.filter((e) => e.type === ty).length, lang)}</span>
                  </label>
                )
              })}
            </div>
          </Card>

          <Card title={selectedTitle} sub={t('calendar.eventsCount', { count: formatNumber(selectedEvents.length, lang) })}>
            {selectedEvents.length === 0 ? (
              <div className="text-[13px] text-fg-3">{t('calendar.nothingScheduled')}</div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {selectedEvents.map((e) => {
                  const m = TYPE_META[e.type]
                  const Icon = m.icon
                  return (
                    <div key={e.id} className="flex gap-3 rounded-md border border-divider p-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm" style={{ background: m.tint, color: m.color }}>
                        <Icon size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold leading-snug">{e.title}</div>
                        <div className="mt-0.5 flex gap-2 text-xs text-fg-3">
                          <span>{e.time}</span>
                          {e.location && (
                            <>
                              <span>·</span>
                              <span>{e.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {canManage && <Button variant="ghost" size="sm" icon={<Pencil size={14}/>} onClick={() => openEvent(e)} aria-label={t('actions.edit')} />}
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <Card title={t('calendar.upNext')} actions={<Button variant="ghost" size="sm">{t('actions.viewAll')}</Button>}>
            <div className="flex flex-col gap-1">
              {upcoming.map((e, i) => {
                const m = TYPE_META[e.type]
                const d = new Date(e.date)
                return (
                  <div
                    key={e.id}
                    onClick={() => setSelected(e.date)}
                    className={cn('flex cursor-pointer gap-3 px-1 py-2.5', i > 0 && 'border-t border-divider')}
                  >
                    <div className="w-9 shrink-0 text-center">
                      <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: m.color }}>
                        {d.toLocaleString(intlLocale, { month: 'short' })}
                      </div>
                      <div className="text-lg font-bold leading-none tabular-nums text-fg-1">{formatNumber(d.getDate(), lang)}</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold leading-snug">{e.title}</div>
                      <div className="mt-0.5 text-xs text-fg-3">{e.time}</div>
                    </div>
                    <Badge tone={badgeForType[e.type]}>{t(`calendar.types.${e.type}`)}</Badge>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
      <Modal open={draft != null} onClose={() => setDraft(null)} title={draft?.id ? t('calendar.form.editTitle') : t('calendar.form.addTitle')} footer={<><Button variant="secondary" onClick={() => setDraft(null)}>{t('actions.cancel')}</Button>{draft?.id && <Button variant="ghost" icon={<Trash2 size={14}/>} disabled={deleteEvent.isPending} onClick={async () => { if (!draft || !confirm(t('calendar.form.deleteConfirm'))) return; try { await deleteEvent.mutateAsync(draft.id!); setDraft(null) } catch { setFormError(t('common.error')) } }}>{t('actions.remove')}</Button>}<Button variant="primary" disabled={saveEvent.isPending} onClick={() => void submitEvent()}>{saveEvent.isPending ? t('common.saving') : t('actions.save')}</Button></>}>
        {draft && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field label={t('calendar.form.title')}><Input value={draft.title} onChange={(e) => setDraft({...draft,title:e.target.value})}/></Field></div>
          <Field label={t('calendar.form.type')}><Select value={draft.type} onChange={(e) => setDraft({...draft,type:e.target.value as DbEventType})}>{Object.entries(DB_TYPE_TO_UI).map(([db,ui]) => <option key={db} value={db}>{t(`calendar.types.${ui}`)}</option>)}</Select></Field>
          <Field label={t('calendar.form.class')}><Select value={draft.classId} onChange={(e) => setDraft({...draft,classId:e.target.value})}><option value="">{t('calendar.form.allSchool')}</option>{(classesQuery.data ?? []).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select></Field>
          <Field label={t('calendar.form.date')}><Input type="date" value={draft.date} onChange={(e) => setDraft({...draft,date:e.target.value})}/></Field>
          <Field label={t('calendar.form.time')}><Input type="time" value={draft.time} onChange={(e) => setDraft({...draft,time:e.target.value})}/></Field>
          <div className="sm:col-span-2"><Field label={t('calendar.form.location')}><Input value={draft.location} onChange={(e) => setDraft({...draft,location:e.target.value})}/></Field></div>
          <div className="sm:col-span-2"><Field label={t('calendar.form.description')}><Textarea rows={3} value={draft.description} onChange={(e) => setDraft({...draft,description:e.target.value})}/></Field></div>
          {formError && <div className="sm:col-span-2 rounded-sm bg-danger-tint px-3 py-2 text-sm text-danger">{formError}</div>}
        </div>}
      </Modal>
    </div>
  )
}
