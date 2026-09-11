import { useTranslation } from 'react-i18next'
import {
  CalendarCheck,
  Award,
  Banknote,
  Command,
  Phone,
  Mail,
  Clock,
  BookOpen,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

interface HelpModalProps {
  open: boolean
  onClose: () => void
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-primary" />
          <span>{t('help.title')}</span>
        </div>
      }
      sub={t('help.subtitle')}
      width={640}
      footer={
        <Button variant="secondary" onClick={onClose}>
          {t('actions.cancel')}
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Guides */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-3">
            {t('help.guidesTitle')}
          </h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-app p-3.5">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-primary-tint text-primary">
                <CalendarCheck size={18} />
              </span>
              <div className="mt-2.5 font-semibold text-sm text-fg-1">{t('help.guideAttendance')}</div>
              <div className="mt-1 text-xs text-fg-3 leading-relaxed">{t('help.guideAttendanceDesc')}</div>
            </div>

            <div className="rounded-lg border border-border bg-app p-3.5">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-success-tint text-success">
                <Award size={18} />
              </span>
              <div className="mt-2.5 font-semibold text-sm text-fg-1">{t('help.guideResults')}</div>
              <div className="mt-1 text-xs text-fg-3 leading-relaxed">{t('help.guideResultsDesc')}</div>
            </div>

            <div className="rounded-lg border border-border bg-app p-3.5">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-warning-tint text-warning">
                <Banknote size={18} />
              </span>
              <div className="mt-2.5 font-semibold text-sm text-fg-1">{t('help.guideFees')}</div>
              <div className="mt-1 text-xs text-fg-3 leading-relaxed">{t('help.guideFeesDesc')}</div>
            </div>
          </div>
        </div>

        {/* Shortcuts */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-3">
            {t('help.shortcutsTitle')}
          </h3>
          <div className="mt-2.5 flex flex-col divide-y divide-divider rounded-lg border border-border bg-surface">
            <div className="flex items-center justify-between px-3.5 py-2.5 text-sm">
              <span className="text-fg-2">{t('help.shortcutSearch')}</span>
              <kbd className="flex items-center gap-1 rounded border border-border bg-app px-2 py-0.5 font-mono text-xs text-fg-3">
                <Command size={12} />
                <span>K / Ctrl+K</span>
              </kbd>
            </div>
            <div className="flex items-center justify-between px-3.5 py-2.5 text-sm">
              <span className="text-fg-2">{t('help.shortcutClose')}</span>
              <kbd className="rounded border border-border bg-app px-2 py-0.5 font-mono text-xs text-fg-3">
                Esc
              </kbd>
            </div>
          </div>
        </div>

        {/* Support contacts */}
        <div className="rounded-lg border border-border bg-neutral-50 p-4">
          <div className="font-medium text-sm text-fg-1">{t('help.supportTitle')}</div>
          <div className="mt-0.5 text-xs text-fg-3">{t('help.supportDesc')}</div>
          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-xs">
            <div className="flex items-center gap-2 text-fg-2">
              <Phone size={14} className="text-primary" />
              <span className="font-mono font-medium">{t('help.supportPhone')}</span>
            </div>
            <div className="flex items-center gap-2 text-fg-2">
              <Mail size={14} className="text-primary" />
              <span className="font-mono font-medium">{t('help.supportEmail')}</span>
            </div>
            <div className="flex items-center gap-2 text-fg-3 sm:col-span-2">
              <Clock size={14} />
              <span>{t('help.supportHours')}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
