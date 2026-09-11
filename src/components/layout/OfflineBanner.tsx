import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { WifiOff, Wifi } from 'lucide-react'

export function OfflineBanner() {
  const { t } = useTranslation()
  const [isOffline, setIsOffline] = useState(() => {
    return typeof navigator !== 'undefined' ? !navigator.onLine : false
  })
  const [showRestored, setShowRestored] = useState(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null

    function handleOnline() {
      setIsOffline(false)
      setShowRestored(true)
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        setShowRestored(false)
      }, 3500)
    }

    function handleOffline() {
      if (timer) clearTimeout(timer)
      setShowRestored(false)
      setIsOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (timer) clearTimeout(timer)
    }
  }, [])

  if (!isOffline && !showRestored) {
    return null
  }

  if (showRestored) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center justify-center gap-2 border-b border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs text-emerald-800 transition-colors dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
      >
        <Wifi size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span className="font-medium">{t('offline.restored')}</span>
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-xs text-amber-900 transition-colors dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
    >
      <WifiOff size={14} className="shrink-0 text-amber-600 dark:text-amber-400" />
      <span className="font-medium">{t('offline.title')}</span>
      <span className="hidden text-amber-700 sm:inline dark:text-amber-300">
        — {t('offline.description')}
      </span>
    </div>
  )
}
