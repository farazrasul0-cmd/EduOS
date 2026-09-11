import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function NotFound() {
  const { t } = useTranslation()
  return (
    <div className="grid min-h-[60vh] place-items-center text-center">
      <div>
        <div className="text-5xl font-bold text-fg-1">404</div>
        <p className="mt-2 text-sm text-fg-3">{t('common.comingSoon')}</p>
        <Link
          to="/"
          className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
        >
          {t('nav.dashboard')}
        </Link>
      </div>
    </div>
  )
}
