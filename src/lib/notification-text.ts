import type { TFunction } from 'i18next'
import { formatTaka, formatNumber, formatDate } from '@/lib/utils'
import type { AppNotification } from '@/data/notifications'
import type { AppLanguage } from '@/i18n'

/** Localize a notification from its type + params; `title` is the fallback. */
export function notificationText(n: AppNotification, t: TFunction, lang: AppLanguage): string {
  switch (n.type) {
    case 'fee_paid':
      return t('notif.fee_paid', { name: n.params.name, amount: formatTaka(Number(n.params.amount || 0), lang) })
    case 'attendance_saved':
      return t('notif.attendance_saved', {
        date: n.params.date ? formatDate(n.params.date, lang) : '—',
        present: formatNumber(Number(n.params.present || 0), lang),
        absent: formatNumber(Number(n.params.absent || 0), lang),
      })
    case 'attendance_absent':
      return t('notif.attendance_absent', {
        name: n.params.name,
        date: n.params.date ? formatDate(n.params.date, lang) : '—',
      })
    case 'assignment_published':
      return t('notif.assignment_published', { title: n.params.title })
    case 'results_published':
      return t('notif.results_published', { exam: n.params.exam })
    case 'student_added':
      return t('notif.student_added', { name: n.params.name })
    default:
      return n.title
  }
}
