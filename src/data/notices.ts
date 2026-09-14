import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  NoticeRecord,
  CreateNoticePayload,
  NoticeCategory,
  NoticeAudience,
  NoticePriority,
} from '@/lib/notices'
import {
  generateNoticeMemoNo,
  sortNoticesByImportance,
} from '@/lib/notices'

const INITIAL_NOTICES: NoticeRecord[] = [
  {
    id: 'NTC-2026-001',
    noticeNo: 'MEMO-DMSC-2026-041',
    title: 'Holy Eid-ul-Adha & Summer Vacation 2026 Schedule',
    titleBn: 'পবিত্র ঈদুল আজহা ও গ্রীষ্মকালীন অবকাশ ২০২৬ এর ছুটির নোটিশ',
    category: 'holiday',
    targetAudience: 'all',
    priority: 'important',
    publishDate: '2026-05-25',
    expiryDate: '2026-06-25',
    content:
      'This is to inform all respected teachers, students, and guardians that our institution shall remain closed from June 10, 2026 to June 25, 2026 on account of the Holy Eid-ul-Adha and Summer Vacation. Normal academic classes and administrative offices will resume promptly on Sunday, June 28, 2026 at 8:00 AM.',
    contentBn:
      'সম্মানিত শিক্ষক, শিক্ষার্থী ও অভিভাবকদের জানানো যাচ্ছে যে, আগামী ১০ জুন থেকে ২৫ জুন ২০২৬ পর্যন্ত প্রতিষ্ঠান বন্ধ থাকবে।',
    signedBy: 'Principal M. A. Karim',
    designation: 'Headmaster / Principal',
    isPinned: true,
    isPublished: true,
    sendSmsBroadcast: true,
    smsStatus: 'sent',
    smsRecipientsCount: 450,
  },
  {
    id: 'NTC-2026-002',
    noticeNo: 'MEMO-DMSC-2026-042',
    title: 'Emergency Heatwave Alert: Provisional School Closure by Ministry of Education',
    titleBn: 'তীব্র তাপদাহ সতর্কতা: শিক্ষা মন্ত্রণালয়ের নির্দেশনায় সাময়িক শ্রেণি কার্যক্রম স্থগিত',
    category: 'emergency',
    targetAudience: 'all',
    priority: 'urgent',
    publishDate: '2026-05-24',
    expiryDate: '2026-05-28',
    content:
      'In compliance with the emergency advisory from the Directorate of Secondary and Higher Education (DSHE) regarding the severe heatwave across Bangladesh, all on-campus classes are provisionally suspended for the next 3 days. Online supplementary assignments will be uploaded through EduOS.',
    contentBn:
      'শিক্ষা মন্ত্রণালয়ের নির্দেশে তীব্র তাপদাহের কারণে আগামী ৩ দিন শ্রেণি কার্যক্রম স্থগিত থাকবে।',
    signedBy: 'Principal M. A. Karim',
    designation: 'Headmaster / Principal',
    isPinned: true,
    isPublished: true,
    sendSmsBroadcast: true,
    smsStatus: 'sent',
    smsRecipientsCount: 520,
  },
  {
    id: 'NTC-2026-003',
    noticeNo: 'MEMO-DMSC-2026-043',
    title: 'Half-Yearly Examination 2026 Routine & Admit Card Collection Guidelines',
    titleBn: 'অর্ধ-বার্ষিক পরীক্ষা ২০২৬ এর সময়সূচি ও প্রবেশপত্র বিতরণ সংক্রান্ত বিজ্ঞপ্তি',
    category: 'exam',
    targetAudience: 'students',
    priority: 'important',
    publishDate: '2026-05-22',
    expiryDate: '2026-06-10',
    content:
      'The Half-Yearly Examination 2026 for Classes 6 through 10 is scheduled to commence from June 1, 2026. All examinees must collect their official stamped Admit Cards from their respective Class Teachers after clearing outstanding semester dues.',
    contentBn:
      'আগামী ১ জুন থেকে অর্ধ-বার্ষিক পরীক্ষা শুরু হবে। প্রবেশপত্র সংগ্রহের জন্য শ্রেণি শিক্ষকের সাথে যোগাযোগ করুন।',
    signedBy: 'Aminul Islam',
    designation: 'Convener, Examination Committee',
    isPinned: false,
    isPublished: true,
    sendSmsBroadcast: true,
    smsStatus: 'sent',
    smsRecipientsCount: 380,
  },
  {
    id: 'NTC-2026-004',
    noticeNo: 'MEMO-DMSC-2026-044',
    title: 'Monthly Tuition Fee Clearance Deadline for May 2026',
    titleBn: 'মে ২০২৬ মাসের মাসিক বেতন ও ফি পরিশোধের শেষ সময়',
    category: 'administrative',
    targetAudience: 'parents',
    priority: 'normal',
    publishDate: '2026-05-20',
    expiryDate: '2026-05-31',
    content:
      'Respected Guardians are kindly requested to settle the monthly tuition fees for May 2026 by May 31, 2026 through bKash, Nagad, Rocket, or the school accounts counter to avoid late fee penalties.',
    contentBn:
      'মে মাসের বেতন আগামী ৩১ মের মধ্যে বিকাশ বা নগদ মাধ্যমে পরিশোধের অনুরোধ করা হলো।',
    signedBy: 'Md. Shahidul Alam',
    designation: 'Accounts Officer',
    isPinned: false,
    isPublished: true,
    sendSmsBroadcast: false,
    smsStatus: 'not_sent',
  },
  {
    id: 'NTC-2026-005',
    noticeNo: 'MEMO-DMSC-2026-045',
    title: 'Class 9 & 10 Science Practical Lab Timetable and Journal Submission',
    titleBn: '৯ম ও ১০ম শ্রেণির বিজ্ঞান ব্যবহারিক ক্লাস ও খাতা জমা দেওয়ার নোটিশ',
    category: 'academic',
    targetAudience: 'students',
    priority: 'normal',
    publishDate: '2026-05-18',
    expiryDate: '2026-05-30',
    content:
      'Students of Class 9 and 10 Science group are advised to attend mandatory physics and chemistry laboratory sessions according to the revised practical schedule. Completed lab notebooks must be submitted by Thursday.',
    contentBn:
      'ব্যবহারিক খাতা আগামী বৃহস্পতিবারের মধ্যে জমা দিতে হবে।',
    signedBy: 'Dr. Shahabuddin',
    designation: 'Head of Science Department',
    isPinned: false,
    isPublished: true,
    sendSmsBroadcast: false,
    smsStatus: 'not_sent',
  },
]

let noticesCache: NoticeRecord[] = [...INITIAL_NOTICES]

export function resetNoticesStore() {
  noticesCache = [...INITIAL_NOTICES]
}

export function useNotices(filters?: {
  category?: NoticeCategory | 'all'
  audience?: NoticeAudience | 'all'
  priority?: NoticePriority | 'all'
}) {
  return useQuery({
    queryKey: ['notices', filters?.category, filters?.audience, filters?.priority],
    queryFn: async (): Promise<NoticeRecord[]> => {
      let list = [...noticesCache]
      if (filters?.category && filters.category !== 'all') {
        list = list.filter((n) => n.category === filters.category)
      }
      if (filters?.audience && filters.audience !== 'all') {
        list = list.filter((n) => n.targetAudience === filters.audience || n.targetAudience === 'all')
      }
      if (filters?.priority && filters.priority !== 'all') {
        list = list.filter((n) => n.priority === filters.priority)
      }
      return sortNoticesByImportance(list)
    },
    initialData: () => {
      let list = [...noticesCache]
      if (filters?.category && filters.category !== 'all') {
        list = list.filter((n) => n.category === filters.category)
      }
      if (filters?.audience && filters.audience !== 'all') {
        list = list.filter((n) => n.targetAudience === filters.audience || n.targetAudience === 'all')
      }
      if (filters?.priority && filters.priority !== 'all') {
        list = list.filter((n) => n.priority === filters.priority)
      }
      return sortNoticesByImportance(list)
    },
  })
}

export function useCreateNotice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateNoticePayload): Promise<NoticeRecord> => {
      const nextSeq = noticesCache.length + 41
      const memoNo = payload.noticeNo || generateNoticeMemoNo(nextSeq)
      const newNotice: NoticeRecord = {
        id: `NTC-2026-${String(noticesCache.length + 1).padStart(3, '0')}`,
        noticeNo: memoNo,
        title: payload.title,
        titleBn: payload.titleBn,
        category: payload.category,
        targetAudience: payload.targetAudience,
        priority: payload.priority,
        publishDate: payload.publishDate,
        expiryDate: payload.expiryDate,
        content: payload.content,
        contentBn: payload.contentBn,
        signedBy: payload.signedBy || 'Principal M. A. Karim',
        designation: payload.designation || 'Headmaster / Principal',
        isPinned: Boolean(payload.isPinned),
        isPublished: true,
        sendSmsBroadcast: Boolean(payload.sendSmsBroadcast),
        smsStatus: payload.sendSmsBroadcast ? 'sent' : 'not_sent',
        smsRecipientsCount: payload.sendSmsBroadcast ? 400 : 0,
      }

      noticesCache = [newNotice, ...noticesCache]
      return newNotice
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notices'] })
    },
  })
}

export function useTogglePinNotice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (noticeId: string): Promise<NoticeRecord> => {
      const idx = noticesCache.findIndex((n) => n.id === noticeId)
      if (idx === -1) throw new Error('Notice not found.')
      const updated = { ...noticesCache[idx], isPinned: !noticesCache[idx].isPinned }
      noticesCache[idx] = updated
      return updated
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notices'] })
    },
  })
}

export function useDeleteNotice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (noticeId: string): Promise<void> => {
      noticesCache = noticesCache.filter((n) => n.id !== noticeId)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notices'] })
    },
  })
}
