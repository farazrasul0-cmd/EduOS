export type NoticeCategory =
  | 'academic'
  | 'exam'
  | 'holiday'
  | 'emergency'
  | 'administrative'

export type NoticeAudience = 'all' | 'students' | 'teachers' | 'parents'

export type NoticePriority = 'normal' | 'important' | 'urgent'

export interface NoticeRecord {
  id: string
  noticeNo: string // e.g. "MEMO-DMSC-2026-042"
  title: string
  titleBn?: string
  category: NoticeCategory
  targetAudience: NoticeAudience
  priority: NoticePriority
  publishDate: string // YYYY-MM-DD
  expiryDate?: string
  content: string
  contentBn?: string
  signedBy: string
  designation: string
  isPinned: boolean
  isPublished: boolean
  sendSmsBroadcast?: boolean
  smsStatus?: 'sent' | 'not_sent' | 'pending'
  smsRecipientsCount?: number
  attachmentName?: string
}

export interface CreateNoticePayload {
  noticeNo?: string
  title: string
  titleBn?: string
  category: NoticeCategory
  targetAudience: NoticeAudience
  priority: NoticePriority
  publishDate: string
  expiryDate?: string
  content: string
  contentBn?: string
  signedBy?: string
  designation?: string
  isPinned?: boolean
  sendSmsBroadcast?: boolean
}

/**
 * Generates an official institutional memo serial number.
 */
export function generateNoticeMemoNo(sequenceNumber: number, schoolCode = 'DMSC', year = 2026): string {
  return `MEMO-${schoolCode}-${year}-${String(sequenceNumber).padStart(3, '0')}`
}

/**
 * Sorts notices by priority:
 * 1. Pinned notices first
 * 2. Urgent notices
 * 3. Important notices
 * 4. Normal notices
 * Sub-sorted by publishDate descending
 */
export function sortNoticesByImportance(notices: NoticeRecord[]): NoticeRecord[] {
  const priorityWeight: Record<NoticePriority, number> = {
    urgent: 3,
    important: 2,
    normal: 1,
  }

  return [...notices].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1

    const weightA = priorityWeight[a.priority] || 1
    const weightB = priorityWeight[b.priority] || 1
    if (weightA !== weightB) {
      return weightB - weightA
    }

    return b.publishDate.localeCompare(a.publishDate)
  })
}

/**
 * Generates SMS broadcast message text for a notice.
 * Formats notice content cleanly and truncates within carrier limits.
 */
export function formatNoticeSmsText(
  notice: { title: string; category: NoticeCategory; noticeNo?: string },
  schoolName: string,
  isBangla = false,
): string {
  const prefix =
    notice.category === 'emergency'
      ? isBangla
        ? 'জরুরি নোটিশ: '
        : 'URGENT NOTICE: '
      : isBangla
      ? 'বিজ্ঞপ্তি: '
      : 'Notice: '

  const school = schoolName || 'EduOS High School'
  const maxContentLength = isBangla ? 50 : 110
  const titleSnippet =
    notice.title.length > maxContentLength
      ? notice.title.slice(0, maxContentLength - 3) + '...'
      : notice.title

  return `${prefix}${titleSnippet}. — ${school}`
}

/**
 * Validates notice creation payload.
 */
export function validateNoticePayload(payload: Partial<CreateNoticePayload>): {
  valid: boolean
  error?: string
} {
  if (!payload.title || payload.title.trim().length < 5) {
    return { valid: false, error: 'Notice title must be at least 5 characters.' }
  }
  if (!payload.content || payload.content.trim().length < 10) {
    return { valid: false, error: 'Notice content must be at least 10 characters.' }
  }
  if (!payload.publishDate) {
    return { valid: false, error: 'Publish date is required.' }
  }
  if (payload.expiryDate && payload.expiryDate < payload.publishDate) {
    return { valid: false, error: 'Expiry date cannot be earlier than publish date.' }
  }
  return { valid: true }
}
