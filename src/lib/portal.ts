export type CollegiateStanding = 'collegiate' | 'non_collegiate' | 'dis_collegiate'

export interface PortalChildSummary {
  id: string
  name: string
  nameBn?: string
  rollNo: string
  className: string
  section: string
  gender: 'male' | 'female'
  guardianName: string
  guardianPhone: string
  attendanceRate: number
  presentDays: number
  totalWorkingDays: number
  collegiateStatus: CollegiateStanding
  totalDues: number
  gpa: number
  overallGrade: string
  meritPosition: number
}

export interface PortalSubjectScore {
  subject: string
  caMarks: number
  finalMarks: number
  totalMarks: number
  letter: string
  gradePoint: number
  isPassed: boolean
}

export interface PortalFeeInvoice {
  id: string
  title: string
  period: string
  amount: number
  paidAmount: number
  dueDate: string
  status: 'paid' | 'due' | 'overdue'
  lastPaymentTrx?: string
  paidAt?: string
}

export interface PortalHomeworkItem {
  id: string
  title: string
  subject: string
  dueAt: string
  instructions: string
  status: 'pending' | 'submitted' | 'graded'
  submittedAt?: string
  submissionNote?: string
  grade?: string
}

export interface PortalTodayPeriod {
  period: number
  subject: string
  teacher: string
  timeSlot: string
  room: string
}

export interface MfsPaymentResult {
  success: boolean
  invoiceId: string
  transactionId: string
  paidAt: string
  method: 'bkash' | 'nagad' | 'rocket'
  amount: number
}

/**
 * Computes collegiate standing under Bangladesh Education Board examination rules:
 * - >= 75%: Collegiate (Eligible for board and final exams)
 * - 60% - 74.9%: Non-Collegiate (Permitted only with penalty fine)
 * - < 60%: Dis-Collegiate (Strictly barred from examination)
 */
export function computeCollegiateStatus(
  presentDays: number,
  totalWorkingDays: number,
): { rate: number; status: CollegiateStanding } {
  if (totalWorkingDays <= 0) {
    return { rate: 100, status: 'collegiate' }
  }

  const rate = Math.min(100, Math.round((presentDays / totalWorkingDays) * 1000) / 10)
  if (rate >= 75) {
    return { rate, status: 'collegiate' }
  }
  if (rate >= 60) {
    return { rate, status: 'non_collegiate' }
  }
  return { rate, status: 'dis_collegiate' }
}

/**
 * Calculates sum of outstanding fees for a student.
 */
export function computeTotalDues(invoices: PortalFeeInvoice[]): number {
  return invoices.reduce((acc, inv) => {
    if (inv.status !== 'paid') {
      const remaining = Math.max(0, inv.amount - inv.paidAmount)
      return acc + remaining
    }
    return acc
  }, 0)
}

/**
 * Generates an MFS transaction reference token for bKash or Nagad.
 */
export function generateMfsTransactionId(method: 'bkash' | 'nagad' | 'rocket' = 'bkash'): string {
  const prefix = method === 'bkash' ? 'BK' : method === 'nagad' ? 'NG' : 'RK'
  const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase()
  const timestamp = Date.now().toString().slice(-4)
  return `TRX-${prefix}-${randomHex}${timestamp}`
}

/**
 * Simulates online fee payment via Bangladeshi MFS gateway.
 */
export function simulateMfsPayment(
  invoiceId: string,
  amount: number,
  method: 'bkash' | 'nagad' | 'rocket',
  mobileNo: string,
): MfsPaymentResult {
  const cleaned = mobileNo.replace(/\D/g, '')
  const validLength = cleaned.length >= 11
  if (!validLength) {
    throw new Error('Please provide a valid 11-digit Bangladeshi mobile number.')
  }

  const transactionId = generateMfsTransactionId(method)
  return {
    success: true,
    invoiceId,
    transactionId,
    paidAt: new Date().toISOString().slice(0, 10),
    method,
    amount,
  }
}
