import { avatarColor, initials, cn } from '@/lib/utils'

interface AvatarProps {
  name: string
  /** Photo URL; falls back to colored initials when absent. */
  src?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClass = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-16 w-16 text-[22px]',
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={cn('shrink-0 rounded-full object-cover', sizeClass[size], className)}
        aria-hidden
      />
    )
  }
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        sizeClass[size],
        className,
      )}
      style={{ background: avatarColor(name) }}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}
