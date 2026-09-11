import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Info, ArrowRight, X } from 'lucide-react'
import { useAuth } from '@/auth/context'

const DEMO_SCHOOL_ID = '11111111-1111-1111-1111-111111111111'

export function DemoBanner() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || profile?.school_id !== DEMO_SCHOOL_ID) {
    return null
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-primary/20 bg-primary-tint/60 px-4 py-2 text-xs text-primary-dark">
      <div className="flex items-center gap-2 overflow-hidden">
        <Info size={15} className="shrink-0 text-primary" />
        <span className="font-semibold text-fg-1">{t('demo.bannerTitle')}</span>
        <span className="hidden sm:inline text-fg-3">—</span>
        <span className="hidden sm:inline text-fg-2">{t('demo.bannerDesc')}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => navigate('/onboarding')}
          className="flex items-center gap-1 rounded bg-primary px-2.5 py-1 text-white font-medium hover:bg-primary/90 transition-colors"
        >
          <span>{t('demo.createOwnSchool')}</span>
          <ArrowRight size={12} />
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="grid h-6 w-6 place-items-center rounded text-fg-3 hover:bg-primary-tint"
          aria-label={t('demo.dismiss')}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
