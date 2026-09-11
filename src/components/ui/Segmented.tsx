import { cn } from '@/lib/utils'

interface Option<T extends string> {
  label: string
  value: T
}

interface SegmentedProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: Option<T>[]
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: SegmentedProps<T>) {
  return (
    <div className="inline-flex rounded-sm bg-neutral-100 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cn(
            'h-7 rounded-[6px] px-3 text-[13px] font-medium transition-colors',
            value === o.value
              ? 'bg-surface text-fg-1 shadow-sm'
              : 'text-fg-3 hover:text-fg-2',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
