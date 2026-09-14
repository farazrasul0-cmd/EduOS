import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/** Rounded, bordered wrapper around a table (or a toolbar + table). */
export function TableWrap({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'overflow-x-auto rounded-md border border-divider bg-surface shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Toolbar bar that sits directly above a TableWrap (joined corners). */
export function Toolbar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2.5 rounded-t-md border border-b-0 border-divider bg-surface p-3',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <table className={cn('w-full border-collapse text-sm tabular-nums', className)}>
      {children}
    </table>
  )
}

export function THead({ children }: { children: ReactNode }) {
  return <thead>{children}</thead>
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>
}

export function TR({
  children,
  onClick,
  className,
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'border-t border-divider first:border-t-0 hover:bg-neutral-50',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </tr>
  )
}

interface ThProps extends ThHTMLAttributes<HTMLTableCellElement> {
  num?: boolean
}
export function TH({ num, className, children, ...rest }: ThProps) {
  return (
    <th
      className={cn(
        'border-b border-border bg-neutral-50 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-fg-3',
        num && 'text-right',
        className,
      )}
      {...rest}
    >
      {children}
    </th>
  )
}

interface TdProps extends TdHTMLAttributes<HTMLTableCellElement> {
  num?: boolean
}
export function TD({ num, className, children, ...rest }: TdProps) {
  return (
    <td
      className={cn('px-4 py-3 align-middle text-fg-1', num && 'text-right', className)}
      {...rest}
    >
      {children}
    </td>
  )
}
