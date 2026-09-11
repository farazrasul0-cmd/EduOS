import { describe, it, expect } from 'vitest'
import { invoiceOutstanding, matchesInvoiceSearch, validPaymentAmount } from '../src/lib/fees'

describe('fees logic', () => {
  it('outstanding balance never becomes negative', () => {
    expect(invoiceOutstanding({ amount: 1000, paid_amount: 400 })).toBe(600)
    expect(invoiceOutstanding({ amount: 1000, paid_amount: 1200 })).toBe(0)
  })

  it('partial payments cannot exceed the outstanding balance', () => {
    expect(validPaymentAmount(400, 600)).toBe(true)
    expect(validPaymentAmount(600, 600)).toBe(true)
    expect(validPaymentAmount(601, 600)).toBe(false)
    expect(validPaymentAmount(0, 600)).toBe(false)
  })

  it('invoice search matches student or invoice number case-insensitively', () => {
    const invoice = { invoice_no: 'EDU-2026-ABC', student_name: 'Nusrat Jahan' }
    expect(matchesInvoiceSearch(invoice, 'nusrat')).toBe(true)
    expect(matchesInvoiceSearch(invoice, 'abc')).toBe(true)
    expect(matchesInvoiceSearch(invoice, 'missing')).toBe(false)
  })
})
