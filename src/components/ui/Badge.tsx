import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const toneClass: Record<BadgeTone, string> = {
  success: 'bg-success-tint text-success [&>.dot]:bg-success',
  warning: 'bg-warning-tint text-warning [&>.dot]:bg-warning',
  danger: 'bg-danger-tint text-danger [&>.dot]:bg-danger',
  info: 'bg-primary-tint text-primary [&>.dot]:bg-primary',
  neutral: 'bg-neutral-100 text-fg-2 [&>.dot]:bg-fg-3',
}

interface BadgeProps {
  tone?: BadgeTone
  dot?: boolean
  children: ReactNode
}

export function Badge({ tone = 'neutral', dot = true, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        toneClass[tone],
      )}
    >
      {dot && <span className="dot h-1.5 w-1.5 rounded-full" />}
      {children}
    </span>
  )
}
