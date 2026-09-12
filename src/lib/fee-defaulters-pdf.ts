export interface FeeDefaulterPdfRow {
  rollNo: string
  studentName: string
  className: string
  dueDate: string
  daysOverdue: number
  principal: number
  fine: number
  total: number
  parentPhone?: string
}

export interface FeeDefaultersPdfInput {
  schoolName: string
  eiin?: string
  academicYear: string
  date: string
  defaulters: FeeDefaulterPdfRow[]
}

const esc = (value: string) =>
  value.replace(/[^\x20-\x7E]/g, '?').replace(/([\\()])/g, '\\$1')

/**
 * Generates an official vector A4 Portrait (595 x 842 pt) Fee Defaulters Notice & Ledger PDF.
 */
export function createFeeDefaultersPdf(input: FeeDefaultersPdfInput): Uint8Array {
  const totalDefaulters = input.defaulters.length
  const totalPrincipal = input.defaulters.reduce((s, r) => s + r.principal, 0)
  const totalFine = input.defaulters.reduce((s, r) => s + r.fine, 0)
  const totalOutstanding = totalPrincipal + totalFine

  const lines: string[] = [
    // Header
    'BT /F1 16 Tf 45 805 Td (' + esc(input.schoolName.toUpperCase()) + ') Tj',
    '0 -20 Td /F1 12 Tf (OFFICIAL FEE DEFAULTERS NOTICE & ARREARS LEDGER) Tj',
    '0 -16 Td /F1 9 Tf (EIIN: ' +
      esc(input.eiin || '108234') +
      '   |   Academic Session: ' +
      esc(input.academicYear) +
      '   |   Date: ' +
      esc(input.date) +
      ') Tj',
    '0 -12 Td (----------------------------------------------------------------------------------------------------------------) Tj',

    // Summary KPIs
    '0 -16 Td /F1 10 Tf (Total Defaulters: ' +
      totalDefaulters +
      '     Principal Overdue: BDT ' +
      totalPrincipal.toLocaleString() +
      '     Late Fines: BDT ' +
      totalFine.toLocaleString() +
      ') Tj',
    '0 -14 Td /F1 10 Tf (TOTAL ARREARS OUTSTANDING: BDT ' +
      totalOutstanding.toLocaleString() +
      ') Tj',
    '0 -12 Td (----------------------------------------------------------------------------------------------------------------) Tj',

    // Table Header
    '0 -16 Td /F1 9 Tf (ROLL       STUDENT NAME                       CLASS     DUE DATE      DAYS LATE    PRINCIPAL (BDT)    FINE      TOTAL DUE (BDT)) Tj',
    '0 -8 Td (----------------------------------------------------------------------------------------------------------------) Tj',
  ]

  // Rows (limit to first 26 rows to fit A4 layout cleanly)
  const displayRows = input.defaulters.slice(0, 26)
  displayRows.forEach((row) => {
    const roll = (row.rollNo || '-').padEnd(10).slice(0, 10)
    const name = row.studentName.padEnd(34).slice(0, 34)
    const cls = row.className.padEnd(10).slice(0, 10)
    const due = row.dueDate.padEnd(14).slice(0, 14)
    const days = (row.daysOverdue + ' days').padEnd(13).slice(0, 13)
    const princ = row.principal.toLocaleString().padEnd(19).slice(0, 19)
    const fine = row.fine.toLocaleString().padEnd(10).slice(0, 10)
    const total = row.total.toLocaleString()

    const lineText = `${roll}${name}${cls}${due}${days}${princ}${fine}${total}`
    lines.push('0 -15 Td /F1 8.5 Tf (' + esc(lineText) + ') Tj')
  })

  if (input.defaulters.length > 26) {
    const extra = input.defaulters.length - 26
    lines.push(`0 -15 Td /F1 8 Tf (... and ${extra} more defaulter records) Tj`)
  }

  // Footer & Signatures
  lines.push(
    '0 -28 Td (----------------------------------------------------------------------------------------------------------------) Tj',
    '0 -32 Td /F1 9 Tf (Accounts Officer: _________________________        Headmaster / Principal: _________________________) Tj',
    '0 -20 Td /F1 7.5 Tf (Official Institution Ledger - Generated automatically by EduOS Bangladesh. All rights reserved.) Tj ET',
  )

  const stream = lines.join('\n')

  const pdf =
    '%PDF-1.4\n' +
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n' +
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n' +
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n' +
    '4 0 obj << /Length ' +
    stream.length +
    ' >>\nstream\n' +
    stream +
    '\nendstream\nendobj\n' +
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n' +
    'xref\n' +
    '0 6\n' +
    '0000000000 65535 f \n' +
    '0000000009 00000 n \n' +
    '0000000058 00000 n \n' +
    '0000000115 00000 n \n' +
    '0000000246 00000 n \n' +
    '0000000300 00000 n \n' +
    'trailer << /Root 1 0 R /Size 6 >>\n' +
    'startxref\n' +
    (380 + stream.length) +
    '\n%%EOF'

  return new TextEncoder().encode(pdf)
}
