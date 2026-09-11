import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Check, Settings, Banknote, CalendarCheck, FileText, Award, UserPlus, Bell, Loader2,
  type LucideIcon,
} from 'lucide-react'
import { Segmented } from '@/components/ui/Segmented'
import { Button } from '@/components/ui/Button'
import { useNotifications, useMarkAllNotificationsRead } from '@/data/notifications'
import { notificationText } from '@/lib/notification-text'
import { formatRelativeTime, cn } from '@/lib/utils'
import type { AppLanguage } from '@/i18n'

type Tone = 'success' | 'danger' | 'warning' | 'info'

const TYPE_META: Record<string, { Icon: LucideIcon; tone: Tone }> = {
  fee_paid: { Icon: Banknote, tone: 'success' },
  attendance_saved: { Icon: CalendarCheck, tone: 'info' },
  assignment_published: { Icon: FileText, tone: 'info' },
  results_published: { Icon: Award, tone: 'success' },
  student_added: { Icon: UserPlus, tone: 'info' },
}

const toneClass: Record<Tone, string> = {
  success: 'bg-success-tint text-success',
  danger: 'bg-danger-tint text-danger',
  warning: 'bg-warning-tint text-warning',
  info: 'bg-primary-tint text-primary',
}

export function Notifications({ onClose }: { onClose: () => void }) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'en') as AppLanguage
  const [tab, setTab] = useState<'all' | 'unread'>('all')

  const notificationsQuery = useNotifications()
  const markAllRead = useMarkAllNotificationsRead()
  const items = (notificationsQuery.data ?? []).filter((n) => tab === 'all' || !n.read)

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute right-0 top-11 z-50 w-[calc(100vw-2rem)] max-w-[360px] sm:w-[360px] overflow-hidden rounded-md border border-border bg-surface shadow-md"
    >
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-3.5">
        <div className="flex-1 font-semibold">{t('notifications.title')}</div>
        <button
          className="grid h-7 w-7 place-items-center rounded-sm text-fg-3 hover:bg-neutral-100"
          aria-label={t('nav.settings')}
        >
          <Settings size={14} />
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-divider px-3 py-2.5">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { label: t('notifications.all'), value: 'all' },
            { label: t('notifications.unread'), value: 'unread' },
          ]}
        />
        <Button
          variant="ghost"
          size="sm"
          icon={markAllRead.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          className="ml-auto"
          disabled={markAllRead.isPending}
          onClick={() => markAllRead.mutate()}
        >
          {t('notifications.markAllRead')}
        </Button>
      </div>

      <div className="max-h-[380px] overflow-y-auto">
        {notificationsQuery.isPending ? (
          <div className="grid place-items-center p-6">
            <Loader2 className="animate-spin text-primary" size={20} />
          </div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center text-[13px] text-fg-3">{t('notifications.empty')}</div>
        ) : (
          items.map((n, i) => {
            const meta = TYPE_META[n.type ?? ''] ?? { Icon: Bell, tone: 'info' as Tone }
            const Icon = meta.Icon
            return (
              <div
                key={n.id}
                className={cn(
                  'flex cursor-pointer gap-3 px-4 py-3',
                  i > 0 && 'border-t border-divider',
                  !n.read && 'bg-primary-tint/40',
                )}
              >
                <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-sm', toneClass[meta.tone])}>
                  <Icon size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] leading-snug text-fg-2">{notificationText(n, t, lang)}</div>
                  <div className="mt-1 text-[11px] text-fg-3">{formatRelativeTime(n.created_at, lang)}</div>
                </div>
                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
              </div>
            )
          })
        )}
      </div>

      <div className="border-t border-border bg-neutral-50 p-3">
        <button
          onClick={onClose}
          className="h-8 w-full rounded-sm text-[13px] font-semibold text-primary hover:bg-neutral-100"
        >
          {t('notifications.viewAll')}
        </button>
      </div>
    </div>
  )
}
