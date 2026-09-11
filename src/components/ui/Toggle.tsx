import { cn } from '@/lib/utils'

interface ToggleProps {
  on: boolean
  onChange: (on: boolean) => void
  'aria-label'?: string
}

export function Toggle({ on, onChange, ...rest }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={cn(
        'relative h-5 w-9 shrink-0 rounded-full transition-colors',
        on ? 'bg-primary' : 'bg-border-strong',
      )}
      {...rest}
    >
      <span
        className={cn(
          'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-[left]',
          on ? 'left-[18px]' : 'left-0.5',
        )}
      />
    </button>
  )
}
