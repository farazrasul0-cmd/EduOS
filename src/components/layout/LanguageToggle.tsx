import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { SUPPORTED_LANGUAGES, type AppLanguage } from '@/i18n'

/** EN / BN switch. Persists via i18next's localStorage detector. */
export function LanguageToggle() {
  const { i18n, t } = useTranslation()
  const current = (i18n.resolvedLanguage ?? 'en') as AppLanguage

  return (
    <div
      role="group"
      aria-label={t('lang.toggle')}
      className="inline-flex rounded-sm border border-border bg-surface p-0.5"
    >
      {SUPPORTED_LANGUAGES.map((lng) => (
        <button
          key={lng}
          type="button"
          onClick={() => void i18n.changeLanguage(lng)}
          aria-pressed={current === lng}
          className={cn(
            'h-7 rounded-[6px] px-2.5 text-[13px] font-medium transition-colors',
            current === lng
              ? 'bg-primary text-white'
              : 'text-fg-3 hover:text-fg-1',
          )}
        >
          {t(`lang.${lng}`)}
        </button>
      ))}
    </div>
  )
}
