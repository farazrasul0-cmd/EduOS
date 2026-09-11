import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastTone = 'success' | 'danger' | 'info'

export interface ToastItem {
  id: string
  title?: string
  message: string
  tone: ToastTone
  duration?: number
}

interface ToastContextValue {
  toasts: ToastItem[]
  show: (item: Omit<ToastItem, 'id'>) => string
  success: (message: string, title?: string) => string
  error: (message: string, title?: string) => string
  info: (message: string, title?: string) => string
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}

const ICONS = {
  success: CheckCircle2,
  danger: AlertCircle,
  info: Info,
}

const TONE_STYLES = {
  success: {
    container: 'border-success/30 bg-surface text-fg-1 shadow-md',
    iconWrapper: 'text-success bg-success-tint',
  },
  danger: {
    container: 'border-danger/30 bg-surface text-fg-1 shadow-md',
    iconWrapper: 'text-danger bg-danger-tint',
  },
  info: {
    container: 'border-primary/30 bg-surface text-fg-1 shadow-md',
    iconWrapper: 'text-primary bg-primary-tint',
  },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback(
    (item: Omit<ToastItem, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const newItem: ToastItem = { ...item, id }
      setToasts((prev) => [...prev, newItem])

      const duration = item.duration ?? 4000
      if (duration > 0) {
        setTimeout(() => {
          dismiss(id)
        }, duration)
      }
      return id
    },
    [dismiss],
  )

  const success = useCallback((message: string, title?: string) => show({ message, title, tone: 'success' }), [show])
  const error = useCallback((message: string, title?: string) => show({ message, title, tone: 'danger' }), [show])
  const info = useCallback((message: string, title?: string) => show({ message, title, tone: 'info' }), [show])

  const value = useMemo(
    () => ({
      toasts,
      show,
      success,
      error,
      info,
      dismiss,
    }),
    [toasts, show, success, error, info, dismiss],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container floating at bottom-right */}
      <div
        aria-live="polite"
        role="region"
        aria-label="Notifications"
        className="pointer-events-none fixed bottom-5 right-5 z-[120] flex w-full max-w-sm flex-col gap-2.5 px-4 sm:px-0"
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.tone]
          const style = TONE_STYLES[t.tone]

          return (
            <div
              key={t.id}
              role={t.tone === 'danger' ? 'alert' : 'status'}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-lg border p-3.5 transition-all duration-200 ease-out animate-in fade-in slide-in-from-bottom-2',
                style.container,
              )}
            >
              <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-full', style.iconWrapper)}>
                <Icon size={16} />
              </span>
              <div className="flex-1 pt-0.5">
                {t.title && <div className="text-sm font-semibold text-fg-1">{t.title}</div>}
                <div className="text-[13px] text-fg-2">{t.message}</div>
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="grid h-6 w-6 shrink-0 place-items-center rounded-sm text-fg-3 hover:bg-neutral-100 hover:text-fg-1"
                aria-label="Close notification"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
