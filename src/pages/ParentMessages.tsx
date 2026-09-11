import { useEffect, useState, useRef, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Megaphone, MessageSquarePlus, Search, Phone, MoreHorizontal, Paperclip, Send,
  MessagesSquare, Loader2, ArrowLeft, Info,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Empty } from '@/components/ui/Empty'
import { Input } from '@/components/ui/form'
import { Field, Select } from '@/components/ui/form'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { formatNumber, formatDateTime, cn } from '@/lib/utils'
import { useAuth } from '@/auth/context'
import { useCreateThread, useMarkThreadRead, useMessageRecipients, useThreads, useMessages, useSendMessage, useStudentStats } from '@/data/messages'
import type { AppLanguage } from '@/i18n'

export default function ParentMessages() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'en') as AppLanguage
  const { user, profile } = useAuth()

  const threadsQuery = useThreads(user?.id)
  const threads = threadsQuery.data ?? []
  const [activeId, setActiveId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showStudentInfoMobile, setShowStudentInfoMobile] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const th = threads.find((x) => x.id === activeId) ?? threads[0] ?? null

  const messagesQuery = useMessages(th?.id ?? null)
  const statsQuery = useStudentStats(th?.student_id ?? null)
  const sendMessage = useSendMessage()
  const markRead = useMarkThreadRead()
  const markThreadRead = markRead.mutate
  const recipientsQuery = useMessageRecipients()
  const createThread = useCreateThread()
  const [draft, setDraft] = useState('')
  const [newOpen, setNewOpen] = useState(false)
  const [recipientKey, setRecipientKey] = useState('')
  const [createError, setCreateError] = useState('')

  const stats = statsQuery.data
  useEffect(() => { if (th?.unread_count) markThreadRead(th.id) }, [th?.id, th?.unread_count, markThreadRead])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messagesQuery.data?.length, activeId])

  const filteredThreads = threads.filter((tr) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      (tr.guardian_name ?? '').toLowerCase().includes(q) ||
      (tr.student_name ?? '').toLowerCase().includes(q) ||
      (tr.last_body ?? '').toLowerCase().includes(q)
    )
  })

  async function onCreateThread() {
    const recipient = (recipientsQuery.data ?? []).find((x) => `${x.guardian_id}:${x.student_id}` === recipientKey)
    if (!recipient) { setCreateError(t('parent.newThread.required')); return }
    try {
      const id = await createThread.mutateAsync({ guardianId: recipient.guardian_id, studentId: recipient.student_id })
      setActiveId(id)
      setNewOpen(false)
      setRecipientKey('')
    }
    catch { setCreateError(t('common.error')) }
  }

  function timeOf(iso: string): string {
    return new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso))
  }

  function onSend(e: FormEvent) {
    e.preventDefault()
    if (!th || !user || !profile?.school_id || !draft.trim()) return
    sendMessage.mutate(
      { school_id: profile.school_id, thread_id: th.id, sender_id: user.id, body: draft.trim() },
      { onSuccess: () => setDraft('') },
    )
  }

  return (
    <div>
      <PageHeader
        title={t('parent.title')}
        sub={t('parent.sub')}
        actions={
          <>
            <Button variant="secondary" icon={<Megaphone size={16} />}>
              {t('actions.newAnnouncement')}
            </Button>
            <Button variant="primary" icon={<MessageSquarePlus size={16} />} onClick={() => { setCreateError(''); setNewOpen(true) }}>
              {t('actions.newMessage')}
            </Button>
          </>
        }
      />

      {threadsQuery.isPending ? (
        <div className="grid min-h-[400px] place-items-center rounded-md border border-divider bg-surface">
          <Loader2 className="animate-spin text-primary" size={22} />
        </div>
      ) : threads.length === 0 ? (
        <div className="rounded-md border border-divider bg-surface">
          <Empty icon={MessagesSquare} title={t('parent.empty')} sub={t('parent.emptySub')} />
        </div>
      ) : (
        <div className="grid min-h-[560px] grid-cols-1 overflow-hidden rounded-md border border-divider bg-surface shadow-sm lg:grid-cols-[320px_1fr_280px]">
          {/* Thread list */}
          <div className={cn('flex flex-col border-r border-divider', activeId != null ? 'hidden lg:flex' : 'flex')}>
            <div className="border-b border-divider p-3">
              <div className="flex h-8 items-center gap-2 rounded-sm bg-app px-2.5">
                <Search size={14} className="text-fg-3" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-[13px] outline-none placeholder:text-fg-4"
                  placeholder={t('parent.searchPlaceholder')}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredThreads.map((tr) => (
                <div
                  key={tr.id}
                  onClick={() => {
                    setActiveId(tr.id)
                    setShowStudentInfoMobile(false)
                  }}
                  className={cn(
                    'flex cursor-pointer gap-2.5 border-b border-divider p-3.5 transition-colors',
                    th && tr.id === th.id ? 'border-l-[3px] border-l-primary bg-primary-tint' : 'border-l-[3px] border-l-transparent hover:bg-neutral-50 dark:hover:bg-neutral-900/40',
                  )}
                >
                  <Avatar name={tr.guardian_name ?? '?'} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 truncate text-sm font-semibold">{tr.guardian_name ?? '—'}</div>
                      <span className="text-[11px] text-fg-3">
                        {tr.last_message_at ? formatDateTime(tr.last_message_at, lang) : ''}
                      </span>
                    </div>
                    <div className="text-[11px] text-fg-3">{t('parent.parentOf', { child: tr.student_name ?? '—' })}</div>
                    {tr.last_body && <div className="mt-1 truncate text-xs text-fg-2">{tr.last_body}</div>}
                    {tr.unread_count > 0 && <div className="mt-1"><Badge tone="info">{t('parent.unreadCount', { count: formatNumber(tr.unread_count, lang) })}</Badge></div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conversation */}
          <div className={cn('flex flex-col', activeId != null ? 'flex' : 'hidden lg:flex')}>
            {th && (
              <>
                <div className="flex items-center gap-2 sm:gap-3 border-b border-divider px-3 py-3 sm:px-4 sm:py-3.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveId(null)
                      setShowStudentInfoMobile(false)
                    }}
                    className="grid h-8 w-8 place-items-center rounded-sm text-fg-2 hover:bg-neutral-100 lg:hidden"
                    aria-label={t('parent.back')}
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <Avatar name={th.guardian_name ?? '?'} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-sm sm:text-base">{th.guardian_name ?? '—'}</div>
                    <div className="truncate text-xs text-fg-3">{t('parent.parentOfClass', { child: th.student_name ?? '—' })}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowStudentInfoMobile((v) => !v)}
                    className={cn(
                      'grid h-8 w-8 place-items-center rounded-sm text-fg-2 hover:bg-neutral-100 lg:hidden',
                      showStudentInfoMobile && 'bg-primary-tint text-primary',
                    )}
                    aria-label={showStudentInfoMobile ? t('parent.hideStudentInfo') : t('parent.studentInfo')}
                  >
                    <Info size={16} />
                  </button>
                  <button className="grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-sm text-fg-2 hover:bg-neutral-100" aria-label={t('actions.call')}>
                    <Phone size={16} />
                  </button>
                  <button className="grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-sm text-fg-2 hover:bg-neutral-100" aria-label={t('actions.more')}>
                    <MoreHorizontal size={16} />
                  </button>
                </div>

                {/* Mobile collapsible student info */}
                {showStudentInfoMobile && (
                  <div className="border-b border-divider bg-surface p-3.5 lg:hidden">
                    <div className="mb-2.5 flex items-center gap-2.5">
                      <Avatar name={th.student_name ?? '?'} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold">{th.student_name ?? '—'}</div>
                        <div className="text-[11px] text-fg-3">{th.student_roll ?? '—'}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-sm bg-app p-2">
                        <div className="text-[11px] text-fg-3">{t('parent.sidebar.attendance')}</div>
                        <div className="text-base font-bold text-success">
                          {stats?.attendancePct != null ? `${formatNumber(stats.attendancePct, lang)}%` : '—'}
                        </div>
                      </div>
                      <div className="rounded-sm bg-app p-2">
                        <div className="text-[11px] text-fg-3">{t('parent.sidebar.avgScore')}</div>
                        <div className="text-base font-bold">
                          {stats?.avgScorePct != null ? formatNumber(stats.avgScorePct, lang) : '—'}
                        </div>
                      </div>
                      <div className="rounded-sm bg-app p-2">
                        <div className="text-[11px] text-fg-3">{t('parent.sidebar.fees')}</div>
                        <div className={cn('mt-0.5 text-xs font-bold', stats?.feesStatus === 'paid' ? 'text-success' : 'text-warning')}>
                          {stats?.feesStatus === 'paid' ? t('badge.paid') : stats?.feesStatus === 'pending' ? t('badge.due') : '—'}
                        </div>
                      </div>
                      <div className="rounded-sm bg-app p-2">
                        <div className="text-[11px] text-fg-3">{t('parent.sidebar.lastExam')}</div>
                        <div className="mt-0.5 text-xs font-bold">
                          {stats?.avgScorePct != null ? formatNumber(stats.avgScorePct, lang) : '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-app p-3 sm:p-4">
                  {messagesQuery.isPending ? (
                    <Loader2 className="mx-auto mt-8 animate-spin text-primary" size={20} />
                  ) : (
                    (messagesQuery.data ?? []).map((m) => {
                      const mine = m.sender_id != null && m.sender_id === user?.id
                      return (
                        <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                          <div
                            className={cn(
                              'max-w-[85%] sm:max-w-[75%] px-3.5 py-2.5 text-sm leading-5',
                              mine
                                ? 'rounded-[14px_14px_4px_14px] bg-primary text-white'
                                : 'rounded-[14px_14px_14px_4px] border border-divider bg-surface text-fg-1',
                            )}
                          >
                            <div>{m.body}</div>
                            <div className={cn('mt-1 text-right text-[11px]', mine ? 'text-white/80' : 'text-fg-3')}>
                              {timeOf(m.created_at)}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={onSend} className="flex items-center gap-2 sm:gap-2.5 border-t border-divider p-2.5 sm:p-3.5">
                  <button type="button" className="grid h-9 w-9 place-items-center rounded-sm text-fg-2 hover:bg-neutral-100">
                    <Paperclip size={18} />
                  </button>
                  <Input
                    className="flex-1"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={t('parent.replyPlaceholder')}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    icon={sendMessage.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    disabled={sendMessage.isPending || !draft.trim()}
                  >
                    {t('actions.send')}
                  </Button>
                </form>
              </>
            )}
          </div>

          {/* Student sidebar */}
          <div className="hidden flex-col gap-4 border-l border-divider p-4 lg:flex">
            {th && (
              <>
                <div className="text-center">
                  <Avatar name={th.student_name ?? '?'} className="mx-auto" />
                  <div className="mt-2 text-[15px] font-semibold">{th.student_name ?? '—'}</div>
                  <div className="text-xs text-fg-3">{th.student_roll ?? '—'}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-sm bg-app p-2.5">
                    <div className="text-fg-3">{t('parent.sidebar.attendance')}</div>
                    <div className="text-lg font-bold text-success">
                      {stats?.attendancePct != null ? `${formatNumber(stats.attendancePct, lang)}%` : '—'}
                    </div>
                  </div>
                  <div className="rounded-sm bg-app p-2.5">
                    <div className="text-fg-3">{t('parent.sidebar.avgScore')}</div>
                    <div className="text-lg font-bold">
                      {stats?.avgScorePct != null ? formatNumber(stats.avgScorePct, lang) : '—'}
                    </div>
                  </div>
                  <div className="rounded-sm bg-app p-2.5">
                    <div className="text-fg-3">{t('parent.sidebar.fees')}</div>
                    <div className={cn('mt-1 text-[13px] font-bold', stats?.feesStatus === 'paid' ? 'text-success' : 'text-warning')}>
                      {stats?.feesStatus === 'paid' ? t('badge.paid') : stats?.feesStatus === 'pending' ? t('badge.due') : '—'}
                    </div>
                  </div>
                  <div className="rounded-sm bg-app p-2.5">
                    <div className="text-fg-3">{t('parent.sidebar.lastExam')}</div>
                    <div className="mt-1 text-[13px] font-bold">
                      {stats?.avgScorePct != null ? formatNumber(stats.avgScorePct, lang) : '—'}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <Modal open={newOpen} onClose={() => setNewOpen(false)} title={t('parent.newThread.title')} sub={t('parent.newThread.sub')} footer={<><Button variant="secondary" onClick={() => setNewOpen(false)}>{t('actions.cancel')}</Button><Button variant="primary" disabled={createThread.isPending} onClick={() => void onCreateThread()}>{createThread.isPending ? t('common.saving') : t('parent.newThread.start')}</Button></>}>
        <Field label={t('parent.newThread.recipient')}><Select value={recipientKey} onChange={(e) => setRecipientKey(e.target.value)}><option value="">—</option>{(recipientsQuery.data ?? []).map((x) => <option key={`${x.guardian_id}:${x.student_id}`} value={`${x.guardian_id}:${x.student_id}`}>{x.guardian_name} · {x.student_name}</option>)}</Select></Field>
        {createError && <div className="mt-3 rounded-sm bg-danger-tint px-3 py-2 text-sm text-danger">{createError}</div>}
      </Modal>
    </div>
  )
}
