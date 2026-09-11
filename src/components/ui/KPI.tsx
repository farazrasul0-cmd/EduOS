import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

type DeltaTone = 'up' | 'down' | 'neutral'

interface KPIProps {
  icon: LucideIcon
  label: string
  value: string
  delta?: string
  deltaTone?: DeltaTone
  footer?: string
}

const deltaClass: Record<DeltaTone, string> = {
  up: 'text-success',
  down: 'text-danger',
  neutral: 'text-fg-3',
}

export function KPI({
  icon: Icon,
  label,
  value,
  delta,
  deltaTone = 'up',
  footer,
}: KPIProps) {
  const DeltaIcon =
    deltaTone === 'up' ? TrendingUp : deltaTone === 'down' ? TrendingDown : Minus

  return (
    <div className="rounded-md border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-sm bg-primary-tint text-primary">
          <Icon size={18} />
        </span>
        <span className="text-[13px] text-fg-3">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-fg-1">{value}</div>
      {(delta || footer) && (
        <div className="mt-1.5 flex items-center gap-2 text-xs">
          {delta && (
            <span
              className={cn('inline-flex items-center gap-1 font-medium', deltaClass[deltaTone])}
            >
              <DeltaIcon size={12} />
              {delta}
            </span>
          )}
          {footer && <span className="text-fg-3">{footer}</span>}
        </div>
      )}
    </div>
  )
}
