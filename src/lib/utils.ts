import { clsx, type ClassValue } from 'clsx'
import type { AppLanguage } from '@/i18n'

/** Merge conditional class names. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}

function intlLocale(lang: AppLanguage): string {
  // bn-BD renders Bangla numerals; en-US keeps Western digits with grouping.
  return lang === 'bn' ? 'bn-BD' : 'en-US'
}

/**
 * Format an amount as Bangladeshi Taka (৳).
 * We prepend the ৳ glyph ourselves for a consistent symbol across locales,
 * and let Intl handle digit shaping + grouping (Bangla numerals when bn).
 */
export function formatTaka(
  amount: number,
  lang: AppLanguage = 'en',
  options: { decimals?: number } = {},
): string {
  const { decimals = 0 } = options
  const formatted = new Intl.NumberFormat(intlLocale(lang), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
  return `৳${formatted}`
}

/** Locale-aware number (Bangla numerals when bn). */
export function formatNumber(value: number, lang: AppLanguage = 'en'): string {
  return new Intl.NumberFormat(intlLocale(lang)).format(value)
}

/** Locale-aware medium date, e.g. "5 Jun 2026" / Bangla equivalent. */
export function formatDate(
  date: Date | string | number,
  lang: AppLanguage = 'en',
): string {
  const d = date instanceof Date ? date : new Date(date)
  return new Intl.DateTimeFormat(intlLocale(lang), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

/** Locale-aware date + time, e.g. "27 May, 11:59 PM" / Bangla equivalent. */
export function formatDateTime(
  date: Date | string | number,
  lang: AppLanguage = 'en',
): string {
  const d = date instanceof Date ? date : new Date(date)
  return new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-US', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d)
}

/** Relative time like "5m ago" / Bangla equivalent, for notification feeds. */
export function formatRelativeTime(
  date: Date | string | number,
  lang: AppLanguage = 'en',
): string {
  const d = date instanceof Date ? date : new Date(date)
  const diffSec = Math.round((d.getTime() - Date.now()) / 1000)
  const rtf = new Intl.RelativeTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-US', {
    numeric: 'auto',
    style: 'narrow',
  })
  const abs = Math.abs(diffSec)
  if (abs < 60) return rtf.format(Math.trunc(diffSec), 'second')
  if (abs < 3600) return rtf.format(Math.trunc(diffSec / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.trunc(diffSec / 3600), 'hour')
  return rtf.format(Math.trunc(diffSec / 86400), 'day')
}

// ---- Avatar helpers -------------------------------------------------------

const AVATAR_COLORS = [
  '#2F6FED',
  '#16A34A',
  '#D97706',
  '#7C3AED',
  '#0284C7',
  '#DC2626',
  '#475569',
  '#0891B2',
]

/** Deterministic avatar background color from a name. */
export function avatarColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

/** Up-to-two-letter initials from a name. */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0] ?? '')
    .join('')
    .toUpperCase()
}
