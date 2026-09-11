import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  sub?: ReactNode
  footer?: ReactNode
  width?: number
  children: ReactNode
}

export function Modal({ open, onClose, title, sub, footer, width = 560, children }: ModalProps) {
  useEffect(() => {
    if (!open) return
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(15,23,42,0.4)] p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width }}
        className="max-h-[90vh] w-full max-w-full overflow-y-auto rounded-lg bg-surface shadow-md"
      >
        {(title || sub) && (
          <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
            <div>
              {title && <div className="text-lg font-semibold text-fg-1">{title}</div>}
              {sub && <div className="mt-1 text-[13px] text-fg-3">{sub}</div>}
            </div>
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-sm text-fg-2 hover:bg-neutral-100"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2.5 border-t border-border bg-neutral-50 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
