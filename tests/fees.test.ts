import assert from 'node:assert/strict'
import test from 'node:test'
import { invoiceOutstanding, matchesInvoiceSearch, validPaymentAmount } from '../src/lib/fees.ts'

test('outstanding balance never becomes negative', () => {
  assert.equal(invoiceOutstanding({ amount: 1000, paid_amount: 400 }), 600)
  assert.equal(invoiceOutstanding({ amount: 1000, paid_amount: 1200 }), 0)
})

test('partial payments cannot exceed the outstanding balance', () => {
  assert.equal(validPaymentAmount(400, 600), true)
  assert.equal(validPaymentAmount(600, 600), true)
  assert.equal(validPaymentAmount(601, 600), false)
  assert.equal(validPaymentAmount(0, 600), false)
})

test('invoice search matches student or invoice number case-insensitively', () => {
  const invoice = { invoice_no: 'EDU-2026-ABC', student_name: 'Nusrat Jahan' }
  assert.equal(matchesInvoiceSearch(invoice, 'nusrat'), true)
  assert.equal(matchesInvoiceSearch(invoice, 'abc'), true)
  assert.equal(matchesInvoiceSearch(invoice, 'missing'), false)
})
