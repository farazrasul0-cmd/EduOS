import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  PortalChildSummary,
  PortalSubjectScore,
  PortalFeeInvoice,
  PortalHomeworkItem,
  PortalTodayPeriod,
  MfsPaymentResult,
} from '@/lib/portal'
import { simulateMfsPayment, computeTotalDues } from '@/lib/portal'

export interface PortalChildDetailData {
  child: PortalChildSummary
  subjects: PortalSubjectScore[]
  invoices: PortalFeeInvoice[]
  homework: PortalHomeworkItem[]
  todayPeriods: PortalTodayPeriod[]
}

const INITIAL_CHILDREN: PortalChildSummary[] = [
  {
    id: 'STD-2026-001',
    name: 'Tanvir Ahmed',
    nameBn: 'তানভীর আহমেদ',
    rollNo: '01',
    className: 'Class 7',
    section: 'A',
    gender: 'male',
    guardianName: 'Md. Farhad Ahmed',
    guardianPhone: '01711223344',
    attendanceRate: 88.8,
    presentDays: 142,
    totalWorkingDays: 160,
    collegiateStatus: 'collegiate',
    totalDues: 2500,
    gpa: 4.85,
    overallGrade: 'A+',
    meritPosition: 2,
  },
  {
    id: 'STD-2026-042',
    name: 'Nusrat Jahan',
    nameBn: 'নুসরাত জাহান',
    rollNo: '04',
    className: 'Class 4',
    section: 'B',
    gender: 'female',
    guardianName: 'Md. Farhad Ahmed',
    guardianPhone: '01711223344',
    attendanceRate: 68.8,
    presentDays: 110,
    totalWorkingDays: 160,
    collegiateStatus: 'non_collegiate',
    totalDues: 0,
    gpa: 4.25,
    overallGrade: 'A',
    meritPosition: 7,
  },
  {
    id: 'STD-2026-089',
    name: 'Kamal Hossain',
    nameBn: 'কামাল হোসেন',
    rollNo: '18',
    className: 'Class 9',
    section: 'Science',
    gender: 'male',
    guardianName: 'Md. Farhad Ahmed',
    guardianPhone: '01711223344',
    attendanceRate: 53.1,
    presentDays: 85,
    totalWorkingDays: 160,
    collegiateStatus: 'dis_collegiate',
    totalDues: 6000,
    gpa: 3.8,
    overallGrade: 'A-',
    meritPosition: 19,
  },
]

const INITIAL_DETAILS: Record<string, PortalChildDetailData> = {
  'STD-2026-001': {
    child: { ...INITIAL_CHILDREN[0] },
    subjects: [
      { subject: 'Bangla', caMarks: 18, finalMarks: 72, totalMarks: 90, letter: 'A+', gradePoint: 5.0, isPassed: true },
      { subject: 'English', caMarks: 16, finalMarks: 68, totalMarks: 84, letter: 'A+', gradePoint: 5.0, isPassed: true },
      { subject: 'Mathematics', caMarks: 19, finalMarks: 74, totalMarks: 93, letter: 'A+', gradePoint: 5.0, isPassed: true },
      { subject: 'General Science', caMarks: 17, finalMarks: 69, totalMarks: 86, letter: 'A+', gradePoint: 5.0, isPassed: true },
      { subject: 'Bangladesh & Global Studies', caMarks: 15, finalMarks: 65, totalMarks: 80, letter: 'A+', gradePoint: 5.0, isPassed: true },
      { subject: 'ICT', caMarks: 18, finalMarks: 71, totalMarks: 89, letter: 'A+', gradePoint: 5.0, isPassed: true },
    ],
    invoices: [
      {
        id: 'INV-2026-09',
        title: 'September 2026 Tuition Fee',
        period: 'September 2026',
        amount: 2500,
        paidAmount: 0,
        dueDate: '2026-09-25',
        status: 'due',
      },
      {
        id: 'INV-2026-08',
        title: 'August 2026 Tuition Fee',
        period: 'August 2026',
        amount: 2500,
        paidAmount: 2500,
        dueDate: '2026-08-20',
        status: 'paid',
        paidAt: '2026-08-18',
        lastPaymentTrx: 'TRX-BK-9182AB',
      },
      {
        id: 'INV-2026-07',
        title: 'July 2026 Tuition Fee',
        period: 'July 2026',
        amount: 2500,
        paidAmount: 2500,
        dueDate: '2026-07-20',
        status: 'paid',
        paidAt: '2026-07-15',
        lastPaymentTrx: 'TRX-NG-4412CD',
      },
    ],
    homework: [
      {
        id: 'HW-101',
        title: 'Bangla Grammar Essay: Smart Bangladesh',
        subject: 'Bangla',
        dueAt: '2026-09-20',
        instructions: 'Write a 300-word composition exploring how ICT is reshaping school education.',
        status: 'pending',
      },
      {
        id: 'HW-102',
        title: 'Algebra Exercise 4.2 Problems 1-10',
        subject: 'Mathematics',
        dueAt: '2026-09-18',
        instructions: 'Solve all quadratic simplification questions in your exercise notebook.',
        status: 'pending',
      },
      {
        id: 'HW-103',
        title: 'Plant Cell Structure & Organelles',
        subject: 'General Science',
        dueAt: '2026-09-10',
        instructions: 'Draw and label chloroplast, vacuole, and mitochondria on an A4 art paper.',
        status: 'graded',
        submittedAt: '2026-09-09',
        submissionNote: 'Hand-drawn diagram scanned and verified by teacher.',
        grade: 'A+',
      },
    ],
    todayPeriods: [
      { period: 1, subject: 'Bangla', teacher: 'Md. Rafiqul Islam', timeSlot: '09:00 - 09:45 AM', room: 'Room 201' },
      { period: 2, subject: 'English', teacher: 'Nasrin Sultana', timeSlot: '09:45 - 10:30 AM', room: 'Room 201' },
      { period: 3, subject: 'Mathematics', teacher: 'Anisur Rahman', timeSlot: '10:30 - 11:15 AM', room: 'Room 201' },
      { period: 4, subject: 'General Science', teacher: 'Dr. Shah Alam', timeSlot: '11:30 - 12:15 PM', room: 'Lab 2' },
    ],
  },
  'STD-2026-042': {
    child: { ...INITIAL_CHILDREN[1] },
    subjects: [
      { subject: 'Bangla', caMarks: 16, finalMarks: 64, totalMarks: 80, letter: 'A+', gradePoint: 5.0, isPassed: true },
      { subject: 'English', caMarks: 15, finalMarks: 60, totalMarks: 75, letter: 'A', gradePoint: 4.0, isPassed: true },
      { subject: 'Mathematics', caMarks: 14, finalMarks: 58, totalMarks: 72, letter: 'A', gradePoint: 4.0, isPassed: true },
      { subject: 'Elementary Science', caMarks: 17, finalMarks: 68, totalMarks: 85, letter: 'A+', gradePoint: 5.0, isPassed: true },
    ],
    invoices: [
      {
        id: 'INV-2026-09-N',
        title: 'September 2026 Tuition Fee',
        period: 'September 2026',
        amount: 2000,
        paidAmount: 2000,
        dueDate: '2026-09-25',
        status: 'paid',
        paidAt: '2026-09-12',
        lastPaymentTrx: 'TRX-BK-7744MN',
      },
    ],
    homework: [
      {
        id: 'HW-201',
        title: 'English Story Reading: Chapter 3',
        subject: 'English',
        dueAt: '2026-09-19',
        instructions: 'Read aloud 3 times and write 5 new vocabulary words with meanings.',
        status: 'pending',
      },
    ],
    todayPeriods: [
      { period: 1, subject: 'Bangla', teacher: 'Fatema Khatun', timeSlot: '09:00 - 09:45 AM', room: 'Room 104' },
      { period: 2, subject: 'Mathematics', teacher: 'Mizanur Rahman', timeSlot: '09:45 - 10:30 AM', room: 'Room 104' },
    ],
  },
  'STD-2026-089': {
    child: { ...INITIAL_CHILDREN[2] },
    subjects: [
      { subject: 'Bangla', caMarks: 14, finalMarks: 55, totalMarks: 69, letter: 'A-', gradePoint: 3.5, isPassed: true },
      { subject: 'English', caMarks: 12, finalMarks: 50, totalMarks: 62, letter: 'A-', gradePoint: 3.5, isPassed: true },
      { subject: 'Higher Mathematics', caMarks: 15, finalMarks: 58, totalMarks: 73, letter: 'A', gradePoint: 4.0, isPassed: true },
      { subject: 'Physics', caMarks: 16, finalMarks: 60, totalMarks: 76, letter: 'A', gradePoint: 4.0, isPassed: true },
      { subject: 'Chemistry', caMarks: 13, finalMarks: 52, totalMarks: 65, letter: 'A-', gradePoint: 3.5, isPassed: true },
    ],
    invoices: [
      {
        id: 'INV-2026-08-K',
        title: 'August 2026 Tuition Fee',
        period: 'August 2026',
        amount: 3000,
        paidAmount: 0,
        dueDate: '2026-08-20',
        status: 'overdue',
      },
      {
        id: 'INV-2026-09-K',
        title: 'September 2026 Tuition Fee',
        period: 'September 2026',
        amount: 3000,
        paidAmount: 0,
        dueDate: '2026-09-25',
        status: 'due',
      },
    ],
    homework: [
      {
        id: 'HW-301',
        title: 'Physics Mechanics Numerical Problems',
        subject: 'Physics',
        dueAt: '2026-09-17',
        instructions: 'Solve problems on velocity, acceleration, and kinetic energy from chapter 3.',
        status: 'pending',
      },
    ],
    todayPeriods: [
      { period: 1, subject: 'Physics', teacher: 'Dr. Shah Alam', timeSlot: '09:00 - 09:45 AM', room: 'Room 302' },
      { period: 2, subject: 'Chemistry', teacher: 'Farhana Akter', timeSlot: '09:45 - 10:30 AM', room: 'Lab 1' },
    ],
  },
}

// In-memory cache
let childrenCache: PortalChildSummary[] = JSON.parse(JSON.stringify(INITIAL_CHILDREN))
let detailsCache: Record<string, PortalChildDetailData> = JSON.parse(JSON.stringify(INITIAL_DETAILS))

export function resetPortalStore(): void {
  childrenCache = JSON.parse(JSON.stringify(INITIAL_CHILDREN))
  detailsCache = JSON.parse(JSON.stringify(INITIAL_DETAILS))
}

export function usePortalChildren() {
  return useQuery<PortalChildSummary[]>({
    queryKey: ['portal-children'],
    queryFn: async () => {
      return [...childrenCache]
    },
    initialData: () => [...childrenCache],
  })
}

export function usePortalChildDetails(childId: string) {
  return useQuery<PortalChildDetailData>({
    queryKey: ['portal-child-details', childId],
    queryFn: async () => {
      const details = detailsCache[childId]
      if (!details) {
        throw new Error(`Child not found: ${childId}`)
      }
      return { ...details }
    },
    initialData: () => {
      return detailsCache[childId] || detailsCache['STD-2026-001']
    },
    enabled: Boolean(childId),
  })
}

export interface PayFeePayload {
  invoiceId: string
  childId: string
  amount: number
  method: 'bkash' | 'nagad' | 'rocket'
  mobileNo: string
}

export function usePayFeeViaMfs() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: PayFeePayload): Promise<MfsPaymentResult> => {
      const childData = detailsCache[payload.childId]
      if (!childData) {
        throw new Error(`Child not found: ${payload.childId}`)
      }

      const invIndex = childData.invoices.findIndex((inv) => inv.id === payload.invoiceId)
      if (invIndex === -1) {
        throw new Error(`Invoice not found: ${payload.invoiceId}`)
      }

      const payment = simulateMfsPayment(payload.invoiceId, payload.amount, payload.method, payload.mobileNo)

      const existingInv = childData.invoices[invIndex]
      const updatedPaidAmount = existingInv.paidAmount + payload.amount
      const isFull = updatedPaidAmount >= existingInv.amount

      childData.invoices[invIndex] = {
        ...existingInv,
        paidAmount: updatedPaidAmount,
        status: isFull ? 'paid' : 'due',
        lastPaymentTrx: payment.transactionId,
        paidAt: payment.paidAt,
      }

      // Update total dues
      const newDues = computeTotalDues(childData.invoices)
      childData.child.totalDues = newDues

      // Also update child in childrenCache
      const childIdx = childrenCache.findIndex((c) => c.id === payload.childId)
      if (childIdx !== -1) {
        childrenCache[childIdx] = {
          ...childrenCache[childIdx],
          totalDues: newDues,
        }
      }

      return payment
    },
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: ['portal-children'] })
      void qc.invalidateQueries({ queryKey: ['portal-child-details', variables.childId] })
    },
  })
}

export interface SubmitHomeworkPayload {
  homeworkId: string
  childId: string
  submissionNote: string
}

export function useSubmitPortalHomework() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: SubmitHomeworkPayload): Promise<PortalHomeworkItem> => {
      const childData = detailsCache[payload.childId]
      if (!childData) {
        throw new Error(`Child not found: ${payload.childId}`)
      }

      const hwIdx = childData.homework.findIndex((h) => h.id === payload.homeworkId)
      if (hwIdx === -1) {
        throw new Error(`Homework not found: ${payload.homeworkId}`)
      }

      const existingHw = childData.homework[hwIdx]
      const updatedHw: PortalHomeworkItem = {
        ...existingHw,
        status: 'submitted',
        submittedAt: new Date().toISOString().slice(0, 10),
        submissionNote: payload.submissionNote,
      }

      childData.homework[hwIdx] = updatedHw
      return updatedHw
    },
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: ['portal-child-details', variables.childId] })
    },
  })
}
