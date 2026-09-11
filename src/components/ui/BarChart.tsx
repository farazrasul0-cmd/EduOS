import { cn } from '@/lib/utils'

export interface Bar {
  label: string
  value: number
  dim?: boolean
}

interface BarChartProps {
  data: Bar[]
  height?: number
  /** Render the numeric label on top of each bar (e.g. for Bangla numerals). */
  formatValue?: (value: number) => string
}

const Y_TICKS = 4

export function BarChart({ data, height = 200, formatValue = String }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value))
  const niceMax = Math.ceil(max / 10) * 10 || 10

  return (
    <div className="w-full">
      <div
        className="relative flex items-end gap-3.5 border-b border-border px-1"
        style={{ height }}
      >
        {Array.from({ length: Y_TICKS }).map((_, i) => (
          <div
            key={i}
            className="pointer-events-none absolute right-0 left-0 border-t border-dashed border-divider"
            style={{ bottom: `${(i / (Y_TICKS - 1)) * 100}%` }}
          />
        ))}
        {data.map((d, i) => {
          const h = (d.value / niceMax) * (height - 10)
          return (
            <div key={i} className="z-[1] flex flex-1 flex-col items-center gap-1">
              <div className="text-[11px] tabular-nums text-fg-3">{formatValue(d.value)}</div>
              <div
                className={cn('w-full max-w-[28px] rounded-t-md bg-primary', d.dim && 'opacity-35')}
                style={{ height: h }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-3.5 px-1 pt-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-xs text-fg-3">
            {d.label}
          </div>
        ))}
      </div>
    </div>
  )
}
