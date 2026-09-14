import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

const baseField =
  'w-full rounded-sm border border-border-strong bg-surface px-3 text-sm text-fg-1 outline-none transition-[border-color,box-shadow] placeholder:text-fg-4 focus:border-primary focus:shadow-[0_0_0_3px_rgba(47,111,237,0.25)]'

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(baseField, 'h-9', className)} {...rest} />
}

export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(baseField, 'h-9', className)} {...rest}>
      {children}
    </select>
  )
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(baseField, 'min-h-20 resize-y py-2.5 leading-5', className)} {...rest} />
  )
}

interface FieldProps {
  label?: ReactNode
  hint?: ReactNode
  className?: string
  required?: boolean
  children: ReactNode
}
export function Field({ label, hint, className, required, children }: FieldProps) {
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <span className="text-[13px] font-medium text-fg-2">
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </span>
      )}
      {children}
      {hint && <span className="text-xs text-fg-3">{hint}</span>}
    </label>
  )
}

/** Compact search box for table toolbars. */
export function SearchInput({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div
      className={cn(
        'flex h-8 max-w-xs flex-1 items-center gap-2 rounded-sm bg-app px-2.5',
        className,
      )}
    >
      <Search size={14} className="text-fg-3" />
      <input
        className="w-full bg-transparent text-[13px] outline-none placeholder:text-fg-4"
        {...rest}
      />
    </div>
  )
}
