import { describe, it, expect } from 'vitest'
import { createPaymentReceiptPdf } from '../src/lib/payment-receipt-pdf'

describe('payment-receipt-pdf', () => {
  it('generates a valid A4 PDF payment receipt with Bangladesh school details', () => {
    const bytes = createPaymentReceiptPdf({
      schoolName: 'Ideal School and College, Motijheel',
      studentName: 'Abrar Fahim',
      rollNo: '10',
      className: 'Class 8-A',
      invoiceNo: 'INV-202609-001',
      receiptNo: 'REC-9B82KA1',
      amount: 4500,
      method: 'bkash',
      reference: '9B82K39L2A',
      paidAt: '11 Sep 2026',
      remainingBalance: 0,
    })

    expect(bytes.length).toBeGreaterThan(100)

    const text = new TextDecoder().decode(bytes)
    expect(text.startsWith('%PDF-1.4')).toBe(true)
    expect(text.includes('Ideal School and College, Motijheel')).toBe(true)
    expect(text.includes('Abrar Fahim')).toBe(true)
    expect(text.includes('INV-202609-001')).toBe(true)
    expect(text.includes('BKASH')).toBe(true)
    expect(text.includes('9B82K39L2A')).toBe(true)
    expect(text.includes('PAID IN FULL')).toBe(true)
    expect(text.endsWith('%%EOF')).toBe(true)
  })

  it('marks partial payment status when outstanding balance remains', () => {
    const bytes = createPaymentReceiptPdf({
      schoolName: 'Dhaka Residential Model College',
      studentName: 'Nusrat Jahan',
      rollNo: '24',
      className: 'Class 9-B',
      invoiceNo: 'INV-202609-002',
      receiptNo: 'REC-NGD1102',
      amount: 2000,
      method: 'nagad',
      reference: 'NG10293847',
      paidAt: '11 Sep 2026',
      remainingBalance: 1500,
    })

    const text = new TextDecoder().decode(bytes)
    expect(text.includes('PARTIAL PAYMENT')).toBe(true)
    expect(text.includes('BDT 2000.00')).toBe(true)
    expect(text.includes('BDT 1500.00')).toBe(true)
  })
})
