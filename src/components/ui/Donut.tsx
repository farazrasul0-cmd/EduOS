export interface DonutSegment {
  value: number
  color: string
}

interface DonutProps {
  segments: DonutSegment[]
  size?: number
  thickness?: number
  centerValue?: string
  centerLabel?: string
}

export function Donut({
  segments,
  size = 140,
  thickness = 18,
  centerValue,
  centerLabel,
}: DonutProps) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const r = size / 2 - thickness / 2
  const circumference = 2 * Math.PI * r

  // Precompute each arc's length + cumulative offset purely (no mutation
  // during render). Segment counts are tiny, so the O(n²) prefix sum is fine.
  const arcs = segments.map((s, i) => {
    const len = (s.value / total) * circumference
    const offset = segments
      .slice(0, i)
      .reduce((sum, p) => sum + (p.value / total) * circumference, 0)
    return { color: s.color, len, offset }
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--eduos-divider-row)"
        strokeWidth={thickness}
      />
      {arcs.map((a, i) => (
        <circle
          key={i}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={a.color}
          strokeWidth={thickness}
          strokeDasharray={`${a.len} ${circumference - a.len}`}
          strokeDashoffset={-a.offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      ))}
      {centerValue && (
        <>
          <text
            x={size / 2}
            y={size / 2 - 2}
            textAnchor="middle"
            fill="var(--fg-1)"
            fontWeight={700}
            fontSize={22}
          >
            {centerValue}
          </text>
          {centerLabel && (
            <text
              x={size / 2}
              y={size / 2 + 16}
              textAnchor="middle"
              fill="var(--fg-3)"
              fontSize={11}
            >
              {centerLabel}
            </text>
          )}
        </>
      )}
    </svg>
  )
}
