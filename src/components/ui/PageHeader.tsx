import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: ReactNode
  sub?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ title, sub, actions }: PageHeaderProps) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight text-fg-1">{title}</h1>
        {sub && <p className="mt-1 text-sm text-fg-3">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
