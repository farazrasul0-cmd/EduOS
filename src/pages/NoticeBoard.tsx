import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Megaphone,
  Pin,
  AlertTriangle,
  Send,
  Plus,
  Download,
  Calendar,
  Eye,
  Trash2,
  Users,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { KPI } from '@/components/ui/KPI'
import { Segmented } from '@/components/ui/Segmented'
import { Modal } from '@/components/ui/Modal'
import { Field, Input, Select, SearchInput } from '@/components/ui/form'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/auth/context'
import { formatDate, formatNumber } from '@/lib/utils'
import type { AppLanguage } from '@/i18n'
import type {
  NoticeRecord,
  NoticeCategory,
  NoticeAudience,
  NoticePriority,
} from '@/lib/notices'
import {
  validateNoticePayload,
  formatNoticeSmsText,
} from '@/lib/notices'
import { createNoticeCircularPdf } from '@/lib/notice-pdf'
import { calculateSmsParts } from '@/lib/sms-gateway'
import {
  useNotices,
  useCreateNotice,
  useTogglePinNotice,
  useDeleteNotice,
} from '@/data/notices'

export default function NoticeBoard() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'en') as AppLanguage
  const toast = useToast()
  const { profile } = useAuth()

  const [activeCategory, setActiveCategory] = useState<NoticeCategory | 'all'>('all')
  const [selectedAudience, setSelectedAudience] = useState<NoticeAudience | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals state
  const [publishModalOpen, setPublishModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedNoticeForView, setSelectedNoticeForView] = useState<NoticeRecord | null>(null)

  // Publish Form State
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<NoticeCategory>('academic')
  const [priority, setPriority] = useState<NoticePriority>('normal')
  const [targetAudience, setTargetAudience] = useState<NoticeAudience>('all')
  const [publishDate, setPublishDate] = useState(new Date().toISOString().slice(0, 10))
  const [expiryDate, setExpiryDate] = useState('')
  const [content, setContent] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [sendSmsBroadcast, setSendSmsBroadcast] = useState(false)
  const [signedBy, setSignedBy] = useState(profile?.full_name || 'Principal M. A. Karim')
  const [designation, setDesignation] = useState('Headmaster / Principal')

  // Queries & Mutations
  const noticesQuery = useNotices({
    category: activeCategory,
    audience: selectedAudience,
  })
  const createNoticeMutation = useCreateNotice()
  const togglePinMutation = useTogglePinNotice()
  const deleteNoticeMutation = useDeleteNotice()

  const notices = useMemo(() => noticesQuery.data ?? [], [noticesQuery.data])

  // Filter by search query
  const filteredNotices = useMemo(() => {
    if (!searchQuery.trim()) return notices
    const q = searchQuery.toLowerCase()
    return notices.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.noticeNo.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q),
    )
  }, [notices, searchQuery])

  // Summary KPIs
  const totalActive = notices.length
  const totalPinned = notices.filter((n) => n.isPinned).length
  const totalEmergency = notices.filter((n) => n.category === 'emergency' || n.priority === 'urgent').length
  const totalSmsSent = notices.reduce((acc, n) => acc + (n.smsRecipientsCount || 0), 0)

  // SMS parts calculation preview for form
  const smsPreviewText = useMemo(() => {
    return formatNoticeSmsText(
      { title: title || 'Notice announcement', category },
      'Dhaka Model School & College',
      false,
    )
  }, [title, category])

  const smsCalculation = useMemo(() => {
    return calculateSmsParts(smsPreviewText)
  }, [smsPreviewText])

  const handleOpenView = (notice: NoticeRecord) => {
    setSelectedNoticeForView(notice)
    setViewModalOpen(true)
  }

  const handleTogglePin = async (notice: NoticeRecord) => {
    try {
      await togglePinMutation.mutateAsync(notice.id)
      toast.show({
        tone: 'success',
        title: notice.isPinned ? 'Unpinned' : 'Pinned to Top',
        message: notice.isPinned
          ? 'Notice unpinned from top.'
          : 'Notice successfully pinned to the top of the notice board.',
      })
    } catch {
      toast.show({
        tone: 'danger',
        title: 'Error',
        message: 'Could not update pin status.',
      })
    }
  }

  const handleDelete = async (noticeId: string) => {
    try {
      await deleteNoticeMutation.mutateAsync(noticeId)
      toast.show({
        tone: 'info',
        title: t('notices.modals.successDeleted'),
        message: 'Notice removed from active board.',
      })
    } catch {
      toast.show({
        tone: 'danger',
        title: 'Error',
        message: 'Failed to delete notice.',
      })
    }
  }

  const handleSubmitPublish = async (e: React.FormEvent) => {
    e.preventDefault()
    const validation = validateNoticePayload({
      title,
      content,
      publishDate,
      expiryDate: expiryDate || undefined,
    })

    if (!validation.valid) {
      toast.show({
        tone: 'danger',
        title: 'Validation Error',
        message: validation.error ?? 'Please verify all required fields.',
      })
      return
    }

    try {
      await createNoticeMutation.mutateAsync({
        title,
        category,
        priority,
        targetAudience,
        publishDate,
        expiryDate: expiryDate || undefined,
        content,
        signedBy,
        designation,
        isPinned,
        sendSmsBroadcast,
      })

      toast.show({
        tone: 'success',
        title: t('notices.publishNotice'),
        message: sendSmsBroadcast
          ? 'Notice published and SMS broadcast sent to recipients.'
          : t('notices.modals.successPublished'),
      })

      setPublishModalOpen(false)
      setTitle('')
      setContent('')
      setIsPinned(false)
      setSendSmsBroadcast(false)
    } catch {
      toast.show({
        tone: 'danger',
        title: 'Error',
        message: 'Failed to publish notice.',
      })
    }
  }

  const downloadNoticePdf = (notice: NoticeRecord) => {
    const school = {
      schoolName: 'Dhaka Model School & College',
      eiin: '108234',
      address: 'Dhanmondi, Dhaka, Bangladesh',
    }
    const bytes = createNoticeCircularPdf(notice, school)
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Notice_Circular_${notice.noticeNo}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('notices.title')}
        sub={t('notices.subtitle')}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => setPublishModalOpen(true)}
            >
              {t('notices.publishNotice')}
            </Button>
            <Button
              variant="secondary"
              icon={<Download size={16} />}
              onClick={() => {
                if (filteredNotices[0]) downloadNoticePdf(filteredNotices[0])
              }}
            >
              {t('notices.exportSummary')}
            </Button>
          </div>
        }
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPI
          icon={Megaphone}
          label={t('notices.kpis.activeNotices')}
          value={formatNumber(totalActive, lang)}
        />
        <KPI
          icon={Pin}
          label={t('notices.kpis.pinnedNotices')}
          value={formatNumber(totalPinned, lang)}
          delta={totalPinned > 0 ? `${formatNumber(totalPinned, lang)} Pinned` : undefined}
          deltaTone="neutral"
        />
        <KPI
          icon={AlertTriangle}
          label={t('notices.kpis.emergencyNotices')}
          value={formatNumber(totalEmergency, lang)}
          delta={totalEmergency > 0 ? 'Urgent Actions' : undefined}
          deltaTone={totalEmergency > 0 ? 'down' : 'up'}
        />
        <KPI
          icon={Send}
          label={t('notices.kpis.smsDispatched')}
          value={formatNumber(totalSmsSent, lang)}
          delta="EduOS Gateway"
          deltaTone="up"
        />
      </div>

      {/* Filter and Category Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={activeCategory}
          onChange={(val) => setActiveCategory(val as typeof activeCategory)}
          options={[
            { label: t('notices.categories.all'), value: 'all' },
            { label: t('notices.categories.academic'), value: 'academic' },
            { label: t('notices.categories.exam'), value: 'exam' },
            { label: t('notices.categories.holiday'), value: 'holiday' },
            { label: t('notices.categories.emergency'), value: 'emergency' },
            { label: t('notices.categories.administrative'), value: 'administrative' },
          ]}
        />

        <div className="flex items-center gap-3">
          <div className="w-56">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('common.search')}
            />
          </div>
          <Select
            value={selectedAudience}
            onChange={(e) => setSelectedAudience(e.target.value as typeof selectedAudience)}
            className="w-40 text-xs"
          >
            <option value="all">{t('notices.audiences.all')}</option>
            <option value="students">{t('notices.audiences.students')}</option>
            <option value="teachers">{t('notices.audiences.teachers')}</option>
            <option value="parents">{t('notices.audiences.parents')}</option>
          </Select>
        </div>
      </div>

      {/* Notice Board Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredNotices.length === 0 ? (
          <div className="col-span-full rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
            No notices found matching current filters.
          </div>
        ) : (
          filteredNotices.map((notice) => {
            const isUrgent = notice.priority === 'urgent'
            return (
              <div
                key={notice.id}
                className={`relative flex flex-col justify-between rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md ${
                  notice.isPinned
                    ? 'border-primary/40 ring-1 ring-primary/20'
                    : isUrgent
                    ? 'border-danger/40 bg-red-50/20'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {notice.isPinned && (
                        <Badge tone="info">
                          <Pin size={11} className="mr-1 inline" />
                          {t('notices.badges.pinned')}
                        </Badge>
                      )}
                      {notice.priority !== 'normal' && (
                        <Badge tone={isUrgent ? 'danger' : 'warning'}>
                          {t(`notices.priorities.${notice.priority}` as const)}
                        </Badge>
                      )}
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                        {t(`notices.categories.${notice.category}` as const)}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      title={t('notices.card.pinToggle')}
                      onClick={() => handleTogglePin(notice)}
                    >
                      <Pin
                        size={14}
                        className={notice.isPinned ? 'fill-primary text-primary' : 'text-slate-400'}
                      />
                    </Button>
                  </div>

                  <div className="mb-2">
                    <div className="text-[11px] font-mono font-medium text-slate-400">
                      {notice.noticeNo}
                    </div>
                    <h3 className="font-semibold text-slate-900 text-base leading-snug line-clamp-2 mt-0.5">
                      {notice.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                    {notice.content}
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-3 text-xs text-slate-500 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} className="text-slate-400" />
                      {formatDate(notice.publishDate, lang)}
                    </span>
                    <span className="flex items-center gap-1 text-slate-600 font-medium">
                      <Users size={12} className="text-slate-400" />
                      {t(`notices.audiences.${notice.targetAudience}` as const)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<Eye size={13} />}
                        onClick={() => handleOpenView(notice)}
                      >
                        {t('notices.card.readMore')}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        title={t('notices.card.downloadPdf')}
                        onClick={() => downloadNoticePdf(notice)}
                      >
                        <Download size={14} />
                      </Button>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-400 hover:text-danger"
                      onClick={() => handleDelete(notice.id)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal: Publish Notice */}
      <Modal
        open={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        title={t('notices.modals.createTitle')}
        width={620}
      >
        <form onSubmit={handleSubmitPublish} className="space-y-4">
          <Field label={t('notices.modals.titleLabel')}>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Summer Vacation & Holy Eid-ul-Adha Holiday Notice"
              required
            />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label={t('notices.modals.categoryLabel')}>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as NoticeCategory)}
              >
                <option value="academic">{t('notices.categories.academic')}</option>
                <option value="exam">{t('notices.categories.exam')}</option>
                <option value="holiday">{t('notices.categories.holiday')}</option>
                <option value="emergency">{t('notices.categories.emergency')}</option>
                <option value="administrative">{t('notices.categories.administrative')}</option>
              </Select>
            </Field>

            <Field label={t('notices.modals.priorityLabel')}>
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value as NoticePriority)}
              >
                <option value="normal">{t('notices.priorities.normal')}</option>
                <option value="important">{t('notices.priorities.important')}</option>
                <option value="urgent">{t('notices.priorities.urgent')}</option>
              </Select>
            </Field>

            <Field label={t('notices.modals.audienceLabel')}>
              <Select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as NoticeAudience)}
              >
                <option value="all">{t('notices.audiences.all')}</option>
                <option value="students">{t('notices.audiences.students')}</option>
                <option value="teachers">{t('notices.audiences.teachers')}</option>
                <option value="parents">{t('notices.audiences.parents')}</option>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('notices.modals.publishDateLabel')}>
              <Input
                type="date"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
                required
              />
            </Field>
            <Field label={t('notices.modals.expiryDateLabel')}>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </Field>
          </div>

          <Field label={t('notices.modals.contentLabel')}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter full circular resolution, institutional instructions, or emergency directives..."
              rows={4}
              required
              className="w-full rounded-md border border-slate-300 p-2.5 text-sm focus:border-primary focus:outline-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('notices.modals.signLabel')}>
              <Input
                value={signedBy}
                onChange={(e) => setSignedBy(e.target.value)}
                required
              />
            </Field>
            <Field label="Designation">
              <Input
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                required
              />
            </Field>
          </div>

          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
            <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="rounded text-primary"
              />
              <span>{t('notices.modals.pinLabel')}</span>
            </label>

            <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={sendSmsBroadcast}
                onChange={(e) => setSendSmsBroadcast(e.target.checked)}
                className="rounded text-primary"
              />
              <span>{t('notices.modals.smsBroadcastLabel')}</span>
            </label>

            {sendSmsBroadcast && (
              <div className="rounded border border-blue-200 bg-blue-50/60 p-2.5 space-y-1 text-slate-700">
                <div className="font-semibold text-blue-900">
                  {t('notices.modals.smsPreview')}:
                </div>
                <div className="font-mono text-[11px] text-slate-600 bg-white p-2 rounded border border-blue-100">
                  {smsPreviewText}
                </div>
                <div className="flex justify-between text-[11px] text-blue-800">
                  <span>Encoding: {smsCalculation.encoding}</span>
                  <span>
                    {smsCalculation.charCount} {t('notices.modals.chars')} ({smsCalculation.partsCount} {t('notices.modals.segments')})
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPublishModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createNoticeMutation.isPending}
            >
              {t('notices.publishNotice')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Notice Detail View */}
      <Modal
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={t('notices.modals.viewTitle')}
        width={650}
      >
        {selectedNoticeForView && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-xs text-slate-500">
                <span className="font-mono font-semibold text-slate-700">
                  {selectedNoticeForView.noticeNo}
                </span>
                <span>Date: {formatDate(selectedNoticeForView.publishDate, lang)}</span>
              </div>

              <div className="flex items-center gap-2">
                <Badge tone={selectedNoticeForView.priority === 'urgent' ? 'danger' : 'info'}>
                  {t(`notices.priorities.${selectedNoticeForView.priority}` as const)}
                </Badge>
                <Badge tone="neutral">
                  {t(`notices.categories.${selectedNoticeForView.category}` as const)}
                </Badge>
                <span className="text-xs text-slate-500">
                  Target: <b>{t(`notices.audiences.${selectedNoticeForView.targetAudience}` as const)}</b>
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-900 leading-snug">
                {selectedNoticeForView.title}
              </h2>

              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                {selectedNoticeForView.content}
              </p>

              {selectedNoticeForView.expiryDate && (
                <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
                  Effective until: <b>{formatDate(selectedNoticeForView.expiryDate, lang)}</b>
                </div>
              )}

              <div className="pt-4 flex justify-end text-right">
                <div className="text-xs text-slate-700">
                  <div className="font-semibold text-slate-900">{selectedNoticeForView.signedBy}</div>
                  <div className="text-slate-500">{selectedNoticeForView.designation}</div>
                  <div className="text-[11px] text-slate-400">Dhaka Model School & College</div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button
                variant="primary"
                icon={<Download size={15} />}
                onClick={() => downloadNoticePdf(selectedNoticeForView)}
              >
                {t('notices.card.downloadPdf')}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setViewModalOpen(false)}
              >
                {t('notices.modals.close')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
