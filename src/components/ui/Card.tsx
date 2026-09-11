import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  title?: ReactNode
  sub?: ReactNode
  actions?: ReactNode
  pad?: boolean
  className?: string
  bodyClassName?: string
  children: ReactNode
}

export function Card({
  title,
  sub,
  actions,
  pad = true,
  className,
  bodyClassName,
  children,
}: CardProps) {
  return (
    <div className={cn('rounded-md border border-border bg-surface shadow-sm', className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            {title && <h2 className="text-base font-semibold text-fg-1">{title}</h2>}
            {sub && <div className="mt-0.5 text-[13px] text-fg-3">{sub}</div>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn(pad && 'p-5', bodyClassName)}>{children}</div>
    </div>
  )
}
