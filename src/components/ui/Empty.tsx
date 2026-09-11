import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyProps {
  icon: LucideIcon
  title: string
  sub?: string
  action?: ReactNode
}

export function Empty({ icon: Icon, title, sub, action }: EmptyProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center text-fg-3">
      <span className="grid h-14 w-14 place-items-center rounded-lg bg-primary-tint text-primary">
        <Icon size={24} />
      </span>
      <h3 className="text-base font-semibold text-fg-1">{title}</h3>
      {sub && <div className="max-w-sm text-sm">{sub}</div>}
      {action}
    </div>
  )
}
