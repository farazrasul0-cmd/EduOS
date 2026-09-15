import type { Invoice } from '@/types/models'

export function invoiceOutstanding(invoice: Pick<Invoice, 'amount' | 'paid_amount'>): number {
  return Math.max(0, Number(invoice.amount) - Number(invoice.paid_amount))
}

export function validPaymentAmount(amount: number, outstanding: number): boolean {
  return Number.isFinite(amount) && amount > 0 && amount <= outstanding
}

export function matchesInvoiceSearch(
  invoice: { invoice_no: string; student_name: string | null },
  search: string,
): boolean {
  const needle = search.trim().toLowerCase()
  return (
    !needle ||
    invoice.invoice_no.toLowerCase().includes(needle) ||
    Boolean(invoice.student_name?.toLowerCase().includes(needle))
  )
}

export interface LateFineOptions {
  gracePeriodDays?: number // default: 7 days
  finePerDay?: number // default: 5 BDT/day
  fineModel?: 'daily' | 'fixed_tiered'
  maxFineCapPercent?: number // default: 50%
  evaluationDate?: string // ISO date (YYYY-MM-DD)
}

export interface LateFineResult {
  daysOverdue: number
  inGracePeriod: boolean
  fineAmount: number
  totalPayable: number
  isOverdue: boolean
}

/**
 * Calculates late fee fines for overdue student tuition invoices
 * strictly following Bangladesh educational institute guidelines.
 */
export function calculateLateFine(
  dueDate: string | null | undefined,
  principalRemaining: number,
  options?: LateFineOptions,
): LateFineResult {
  if (!dueDate || principalRemaining <= 0) {
    return {
      daysOverdue: 0,
      inGracePeriod: false,
      fineAmount: 0,
      totalPayable: principalRemaining,
      isOverdue: false,
    }
  }

  const evalDateStr = options?.evaluationDate || new Date().toISOString().slice(0, 10)
  const dueTime = new Date(`${dueDate}T00:00:00`).getTime()
  const evalTime = new Date(`${evalDateStr}T00:00:00`).getTime()

  if (isNaN(dueTime) || isNaN(evalTime)) {
    return {
      daysOverdue: 0,
      inGracePeriod: false,
      fineAmount: 0,
      totalPayable: principalRemaining,
      isOverdue: false,
    }
  }

  const diffMs = evalTime - dueTime
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) {
    return {
      daysOverdue: 0,
      inGracePeriod: false,
      fineAmount: 0,
      totalPayable: principalRemaining,
      isOverdue: false,
    }
  }

  const daysOverdue = diffDays
  const gracePeriod = options?.gracePeriodDays ?? 7

  if (daysOverdue <= gracePeriod) {
    return {
      daysOverdue,
      inGracePeriod: true,
      fineAmount: 0,
      totalPayable: principalRemaining,
      isOverdue: true,
    }
  }

  const pastGrace = daysOverdue - gracePeriod
  let fine: number

  if (options?.fineModel === 'fixed_tiered') {
    if (pastGrace <= 15) fine = 50
    else if (pastGrace <= 30) fine = 100
    else fine = 200
  } else {
    const rate = options?.finePerDay ?? 5
    fine = pastGrace * rate
  }

  // Cap fine at max percentage of principal (default 50%)
  const capPercent = options?.maxFineCapPercent ?? 50
  const maxCap = Math.round((principalRemaining * capPercent) / 100)
  fine = Math.min(fine, maxCap)

  return {
    daysOverdue,
    inGracePeriod: false,
    fineAmount: fine,
    totalPayable: principalRemaining + fine,
    isOverdue: true,
  }
}

export interface FeeReminderSmsInput {
  studentName: string
  roll: string
  className: string
  principal: number
  fine: number
  total: number
  daysOverdue: number
  schoolName: string
  contactPhone?: string
}

/**
 * Generates BTRC-compliant SMS payment reminders for guardians of fee defaulters.
 */
export function generateFeeReminderSmsText(
  input: FeeReminderSmsInput,
  lang: 'en' | 'bn' = 'en',
): string {
  const phone = input.contactPhone || '01711000000'
  if (lang === 'bn') {
    const fineText = input.fine > 0 ? `, জরিমানা: ৳${input.fine}` : ''
    return `সম্মানিত অভিভাবক, ${input.schoolName}-এ ${input.studentName} (রোল: ${input.roll || '—'}, শ্রেণি: ${input.className})-এর ফি ৳${input.total} বকেয়া রয়েছে (${input.daysOverdue} দিন বিলম্ব${fineText})। অনুগ্রহ করে দ্রুত পরিশোধ করুন। যোগাযোগ: ${phone}`
  }

  const fineText = input.fine > 0 ? ` (Late fine: BDT ${input.fine})` : ''
  return `Dear Guardian, tuition fee of BDT ${input.total} for ${input.studentName} (Roll: ${input.roll || '—'}, Class: ${input.className}) is overdue by ${input.daysOverdue} days${fineText} at ${input.schoolName}. Please pay via bKash/Nagad or counter. Contact: ${phone}`
}
