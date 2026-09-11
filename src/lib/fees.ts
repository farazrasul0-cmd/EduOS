import type { Invoice } from '@/types/models'

export function invoiceOutstanding(invoice: Pick<Invoice, 'amount' | 'paid_amount'>): number {
  return Math.max(0, Number(invoice.amount) - Number(invoice.paid_amount))
}

export function validPaymentAmount(amount: number, outstanding: number): boolean {
  return Number.isFinite(amount) && amount > 0 && amount <= outstanding
}

export function matchesInvoiceSearch(invoice: { invoice_no: string; student_name: string | null }, search: string): boolean {
  const needle = search.trim().toLowerCase()
  return !needle || invoice.invoice_no.toLowerCase().includes(needle) || Boolean(invoice.student_name?.toLowerCase().includes(needle))
}
