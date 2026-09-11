import type { PaymentMethod } from '@/types/models'

export interface PaymentReceiptInput {
  schoolName: string
  studentName: string
  rollNo?: string | null
  className?: string | null
  invoiceNo: string
  receiptNo: string
  amount: number
  method: PaymentMethod
  reference: string
  paidAt: string
  remainingBalance: number
}

const esc = (value: string) =>
  value.replace(/[^\x20-\x7E]/g, '?').replace(/([\\()])/g, '\\$1')

export function createPaymentReceiptPdf(input: PaymentReceiptInput): Uint8Array {
  const methodLabel = input.method.toUpperCase()
  const statusLabel =
    input.remainingBalance <= 0 ? 'PAID IN FULL' : 'PARTIAL PAYMENT'

  const lines = [
    'BT /F1 18 Tf 50 790 Td (' + esc(input.schoolName) + ') Tj',
    '0 -24 Td /F1 13 Tf (OFFICIAL MONEY RECEIPT) Tj',
    '0 -22 Td /F1 10 Tf (Receipt No: ' +
      esc(input.receiptNo) +
      '     Date: ' +
      esc(input.paidAt) +
      ') Tj',
    '0 -16 Td (Invoice No: ' +
      esc(input.invoiceNo) +
      '     Payment Method: ' +
      esc(methodLabel) +
      ') Tj',
    '0 -24 Td (--------------------------------------------------------------------------) Tj',
    '0 -20 Td /F1 11 Tf (Student: ' +
      esc(input.studentName) +
      '     Roll: ' +
      esc(input.rollNo || '-') +
      '     Class: ' +
      esc(input.className || '-') +
      ') Tj',
    '0 -24 Td (--------------------------------------------------------------------------) Tj',
    '0 -22 Td /F1 12 Tf (Amount Paid: BDT ' + input.amount.toFixed(2) + ') Tj',
    '0 -18 Td /F1 10 Tf (Transaction Reference / TrxID: ' +
      esc(input.reference || 'N/A') +
      ') Tj',
    '0 -18 Td (Outstanding Balance: BDT ' +
      input.remainingBalance.toFixed(2) +
      ') Tj',
    '0 -18 Td (Payment Status: ' + esc(statusLabel) + ') Tj',
    '0 -32 Td (--------------------------------------------------------------------------) Tj',
    '0 -40 Td (Authorized Officer / Cashier: _______________________________) Tj',
    '0 -28 Td /F1 8 Tf (Thank you for your payment. Generated electronically by EduOS.) Tj ET',
  ]

  const stream = lines.join('\n')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(new TextEncoder().encode(pdf).length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xref = new TextEncoder().encode(pdf).length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => String(offset).padStart(10, '0') + ' 00000 n ').join('\n')}\ntrailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return new TextEncoder().encode(pdf)
}
