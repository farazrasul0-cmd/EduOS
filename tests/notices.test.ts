import { describe, it, expect } from 'vitest'
import {
  generateNoticeMemoNo,
  sortNoticesByImportance,
  formatNoticeSmsText,
  validateNoticePayload,
  type NoticeRecord,
} from '@/lib/notices'
import { createNoticeCircularPdf } from '@/lib/notice-pdf'

const mockSchool = {
  schoolName: 'Dhaka Model School & College',
  eiin: '108234',
  address: 'Dhanmondi, Dhaka, Bangladesh',
}

const mockNotice: NoticeRecord = {
  id: 'NTC-2026-001',
  noticeNo: 'MEMO-DMSC-2026-042',
  title: 'Temporary School Closure Due to Extreme Heatwave',
  category: 'emergency',
  targetAudience: 'all',
  priority: 'urgent',
  publishDate: '2026-05-24',
  expiryDate: '2026-05-28',
  content:
    'All classes are provisionally suspended for the next 3 days per Ministry of Education heatwave advisory.',
  signedBy: 'Principal M. A. Karim',
  designation: 'Headmaster / Principal',
  isPinned: true,
  isPublished: true,
  sendSmsBroadcast: true,
  smsStatus: 'sent',
  smsRecipientsCount: 520,
}

describe('Notice Board Domain Engine', () => {
  it('generates institutional memo numbers correctly', () => {
    expect(generateNoticeMemoNo(42, 'DMSC', 2026)).toBe('MEMO-DMSC-2026-042')
    expect(generateNoticeMemoNo(7, 'IDEAL', 2026)).toBe('MEMO-IDEAL-2026-007')
  })

  it('sorts notices with pinned circulars first, followed by urgent priority and recent dates', () => {
    const list: NoticeRecord[] = [
      {
        ...mockNotice,
        id: '1',
        title: 'Normal notice',
        isPinned: false,
        priority: 'normal',
        publishDate: '2026-05-20',
      },
      {
        ...mockNotice,
        id: '2',
        title: 'Urgent notice',
        isPinned: false,
        priority: 'urgent',
        publishDate: '2026-05-21',
      },
      {
        ...mockNotice,
        id: '3',
        title: 'Pinned notice',
        isPinned: true,
        priority: 'normal',
        publishDate: '2026-05-15',
      },
    ]

    const sorted = sortNoticesByImportance(list)
    expect(sorted[0].id).toBe('3') // Pinned first
    expect(sorted[1].id).toBe('2') // Urgent second
    expect(sorted[2].id).toBe('1') // Normal third
  })

  it('formats notice SMS broadcasting messages with category prefixes and sender signature', () => {
    const emergencySms = formatNoticeSmsText(
      { title: 'Heatwave closure for 3 days', category: 'emergency' },
      'Dhaka Model School',
      false,
    )
    expect(emergencySms).toContain('URGENT NOTICE:')
    expect(emergencySms).toContain('Heatwave closure for 3 days')
    expect(emergencySms).toContain('Dhaka Model School')

    const banglaSms = formatNoticeSmsText(
      { title: 'গ্রীষ্মকালীন ছুটির বিজ্ঞপ্তি', category: 'holiday' },
      'ঢাকা মডেল স্কুল',
      true,
    )
    expect(banglaSms).toContain('বিজ্ঞপ্তি:')
    expect(banglaSms).toContain('ঢাকা মডেল স্কুল')
  })

  it('validates notice creation payloads and enforces title and content requirements', () => {
    // Short title
    const res1 = validateNoticePayload({
      title: 'Hi',
      content: 'Valid content of notice here',
      publishDate: '2026-05-25',
    })
    expect(res1.valid).toBe(false)
    expect(res1.error).toContain('title must be at least 5 characters')

    // Short content
    const res2 = validateNoticePayload({
      title: 'Valid Notice Title',
      content: 'Short',
      publishDate: '2026-05-25',
    })
    expect(res2.valid).toBe(false)
    expect(res2.error).toContain('content must be at least 10 characters')

    // Invalid date range
    const res3 = validateNoticePayload({
      title: 'Valid Notice Title',
      content: 'Valid content describing institutional rules and circulars.',
      publishDate: '2026-05-25',
      expiryDate: '2026-05-20',
    })
    expect(res3.valid).toBe(false)
    expect(res3.error).toContain('Expiry date cannot be earlier')

    // Valid
    const res4 = validateNoticePayload({
      title: 'Valid Notice Title',
      content: 'Valid content describing institutional rules and circulars.',
      publishDate: '2026-05-25',
      expiryDate: '2026-05-30',
    })
    expect(res4.valid).toBe(true)
  })
})

describe('Vector PDF Generation for Notice Circulars', () => {
  it('generates an official vector A4 Portrait Notice Circular PDF', () => {
    const pdfBytes = createNoticeCircularPdf(mockNotice, mockSchool)
    expect(pdfBytes.length).toBeGreaterThan(600)

    const pdfText = new TextDecoder().decode(pdfBytes)
    expect(pdfText).toContain('%PDF-1.4')
    expect(pdfText).toContain('[0 0 595 842]')
    expect(pdfText).toContain('DHAKA MODEL SCHOOL & COLLEGE')
    expect(pdfText).toContain('MEMO-DMSC-2026-042')
    expect(pdfText).toContain('URGENT NOTICE & CIRCULAR')
    expect(pdfText).toContain('Principal M. A. Karim')
    expect(pdfText).toContain('%%EOF')
  })
})
