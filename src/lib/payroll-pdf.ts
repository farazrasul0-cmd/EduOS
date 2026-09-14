import type { StaffPayslip } from './payroll'
import { numberToWordsTaka } from './payroll'

const esc = (value: string) =>
  value.replace(/[^\x20-\x7E]/g, '?').replace(/([\\()])/g, '\\$1')

export interface SchoolDetails {
  schoolName: string
  eiin?: string
  address?: string
  phone?: string
}

function assemblePdf(content: string, mediaBox = '[0 0 595 842]'): Uint8Array {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox ${mediaBox} /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>`,
    `<< /Length ${new TextEncoder().encode(content).length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach(() => {
    offsets.push(new TextEncoder().encode(pdf).length)
  })
  objects.forEach((object, index) => {
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xref = new TextEncoder().encode(pdf).length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => String(offset).padStart(10, '0') + ' 00000 n ').join('\n')}\ntrailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`

  return new TextEncoder().encode(pdf)
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/**
 * Generates an official vector A4 Portrait (595 x 842 pt) Monthly Staff Pay Slip.
 */
export function createPayslipPdf(
  payslip: StaffPayslip,
  school: SchoolDetails,
): Uint8Array {
  const monthName = MONTH_NAMES[payslip.month - 1] || 'Month'
  const inWords = numberToWordsTaka(payslip.netPayable)
  const isPaid = payslip.status === 'disbursed'

  const accountInfo =
    payslip.paymentChannel === 'bank_transfer' && payslip.bankDetails
      ? `${payslip.bankDetails.bankName} (A/C: ${payslip.bankDetails.accountNo})`
      : payslip.mfsNumber
        ? `${payslip.paymentChannel.toUpperCase()} (${payslip.mfsNumber})`
        : 'Cash Disbursement'

  const lines: string[] = [
    // Header
    'BT /F1 15 Tf 0.1 0.15 0.25 rg 50 790 Td (' + esc(school.schoolName.toUpperCase()) + ') Tj',
    '0 -16 Td /F1 9 Tf 0.35 0.4 0.5 rg (EIIN: ' +
      esc(school.eiin || '108234') +
      '   |   ' +
      esc(school.address || 'Dhaka, Bangladesh') +
      (school.phone ? '   |   Phone: ' + esc(school.phone) : '') +
      ') Tj',
    '0 -16 Td /F1 12 Tf 0.12 0.35 0.72 rg (MONTHLY SALARY PAY SLIP - ' +
      esc(monthName.toUpperCase()) +
      ' ' +
      payslip.year +
      ') Tj',
    '0 -10 Td (---------------------------------------------------------------------------------------------------------------------------------) Tj',
    'ET',

    // Employee Information Block
    'q 0.95 0.96 0.98 rg 50 670 495 56 re f 0.78 0.82 0.9 RG 0.5 w 50 670 495 56 re s Q',
    'BT /F1 9 Tf 0.15 0.2 0.3 rg',
    '58 712 Td (Staff ID: ' + esc(payslip.staffId) + ') Tj',
    '150 0 Td (Employee Name: ' + esc(payslip.employeeName) + ') Tj',
    '-150 -16 Td (Designation: ' + esc(payslip.designation) + ') Tj',
    '150 0 Td (Department: ' + esc(payslip.department) + ') Tj',
    '170 0 Td (Scale: ' + esc(payslip.employmentType.toUpperCase()) + (payslip.mpoIndexNo ? ' | ' + esc(payslip.mpoIndexNo) : '') + ') Tj',
    '-320 -16 Td (Pay Channel: ' + esc(accountInfo) + ') Tj',
    '320 0 Td (Days Worked: ' + esc(String(payslip.workingDays)) + '  |  Unpaid Leave: ' + esc(String(payslip.unpaidLeaveDays)) + ' d) Tj',
    'ET',

    // Column Headers: Earnings (Left) & Deductions (Right)
    // Left Box (Earnings): x=50, width=240
    'q 0.9 0.95 0.92 rg 50 635 240 20 re f 0.6 0.75 0.65 RG 0.5 w 50 635 240 20 re s Q',
    'BT /F1 9.5 Tf 0.1 0.3 0.15 rg 60 642 Td (EARNINGS & ALLOWANCES) Tj 145 0 Td (AMOUNT (BDT)) Tj ET',

    // Right Box (Deductions): x=305, width=240
    'q 0.98 0.92 0.92 rg 305 635 240 20 re f 0.85 0.65 0.65 RG 0.5 w 305 635 240 20 re s Q',
    'BT /F1 9.5 Tf 0.45 0.1 0.1 rg 315 642 Td (DEDUCTIONS & RECOVERIES) Tj 135 0 Td (AMOUNT (BDT)) Tj ET',
  ]

  // Earnings Rows
  const earnItems = [
    { label: 'Basic Pay (Govt / Scale)', val: payslip.earnings.basicPay },
    { label: 'House Rent Allowance', val: payslip.earnings.houseRent },
    { label: 'Medical Allowance', val: payslip.earnings.medicalAllowance },
    { label: 'Conveyance Allowance', val: payslip.earnings.conveyanceAllowance },
    { label: 'Festival Bonus', val: payslip.earnings.festivalBonus },
    { label: 'Special / Other Allowance', val: payslip.earnings.specialAllowance },
  ]

  // Deductions Rows
  const dedItems = [
    { label: 'Provident Fund (GPF / 10%)', val: payslip.deductions.providentFund },
    { label: 'Welfare Trust (4%)', val: payslip.deductions.welfareTrust },
    { label: 'Retirement Benefit (6%)', val: payslip.deductions.retirementFund },
    { label: 'Income Tax (TDS)', val: payslip.deductions.incomeTax },
    { label: 'Unpaid Leave / Absence', val: payslip.deductions.unpaidLeaveDeduction },
    { label: 'Advance / Loan Repayment', val: payslip.deductions.advanceSalaryDeduction },
  ]

  let curY = 615
  for (let i = 0; i < 6; i++) {
    const e = earnItems[i]
    const d = dedItems[i]

    // Zebra striping
    if (i % 2 === 1) {
      lines.push(`q 0.97 0.97 0.97 rg 50 ${curY - 4} 240 18 re f Q`)
      lines.push(`q 0.97 0.97 0.97 rg 305 ${curY - 4} 240 18 re f Q`)
    }

    lines.push(
      'BT /F1 8.5 Tf 0.2 0.25 0.3 rg',
      `58 ${curY} Td (${esc(e.label)}) Tj`,
      `235 ${curY} Td (${esc(e.val.toLocaleString())}) Tj`,
      `313 ${curY} Td (${esc(d.label)}) Tj`,
      `490 ${curY} Td (${esc(d.val.toLocaleString())}) Tj`,
      'ET',
    )
    curY -= 18
  }

  // Subtotal Bars
  lines.push(
    `q 0.88 0.93 0.9 rg 50 ${curY - 2} 240 20 re f 0.6 0.7 0.65 RG 0.5 w 50 ${curY - 2} 240 20 re s Q`,
    `q 0.95 0.88 0.88 rg 305 ${curY - 2} 240 20 re f 0.8 0.6 0.6 RG 0.5 w 305 ${curY - 2} 240 20 re s Q`,
    'BT /F1 9 Tf 0.1 0.25 0.1 rg',
    `58 ${curY + 5} Td (TOTAL GROSS EARNINGS) Tj`,
    `230 ${curY + 5} Td (BDT ${esc(payslip.grossEarnings.toLocaleString())}) Tj`,
    'ET',
    'BT /F1 9 Tf 0.4 0.1 0.1 rg',
    `313 ${curY + 5} Td (TOTAL DEDUCTIONS) Tj`,
    `485 ${curY + 5} Td (BDT ${esc(payslip.totalDeductions.toLocaleString())}) Tj`,
    'ET',
  )

  curY -= 35

  // Grand Net Payable Box
  lines.push(
    `q 0.92 0.95 0.98 rg 50 ${curY - 10} 495 50 re f 0.2 0.4 0.7 RG 1 w 50 ${curY - 10} 495 50 re s Q`,
    'BT /F1 11 Tf 0.1 0.2 0.5 rg',
    `65 ${curY + 22} Td (NET TAKE-HOME PAYABLE SALARY: BDT ${esc(payslip.netPayable.toLocaleString())}) Tj`,
    '0 -15 Td /F1 8.5 Tf 0.25 0.3 0.4 rg (In Words: ' + esc(inWords) + ') Tj',
    'ET',
  )

  curY -= 45

  // Payment Status & Reference Banner
  const statusColor = isPaid ? '0.1 0.5 0.2 rg' : '0.65 0.45 0.1 rg'
  lines.push(
    'BT /F1 9 Tf ' + statusColor,
    `55 ${curY} Td (PAYMENT STATUS: ${esc(payslip.status.toUpperCase())}) Tj`,
    '150 0 Td /F1 8.5 Tf 0.3 0.35 0.4 rg (Disbursement Date: ' +
      esc(payslip.disbursementDate || 'Pending') +
      (payslip.paymentReference ? '   |   Ref / Txn ID: ' + esc(payslip.paymentReference) : '') +
      ') Tj',
    'ET',
  )

  // Signatures at bottom
  lines.push(
    'BT /F1 8.5 Tf 0.3 0.35 0.4 rg',
    '55 90 Td (____________________________) Tj',
    '0 -12 Td (Prepared By: Accountant) Tj',
    '160 12 Td (____________________________) Tj',
    '0 -12 Td (Verified By: Principal / Head) Tj',
    '160 12 Td (____________________________) Tj',
    '0 -12 Td (Received By: Employee Signature) Tj',
    'ET',
    'BT /F1 7.5 Tf 0.5 0.55 0.6 rg 50 45 Td (This is a computer-generated salary slip from EduOS School Management System. Generated on ' +
      new Date().toISOString().slice(0, 10) +
      '.) Tj ET',
  )

  return assemblePdf(lines.join('\n'), '[0 0 595 842]')
}

/**
 * Generates an official vector A4 Landscape (842 x 595 pt) Monthly Staff Salary Statement.
 * Formatted for Bank Disbursement (BEFTN / Corporate Batch) and SMC (School Managing Committee) Approval.
 */
export function createPayrollSummaryPdf(
  payslips: StaffPayslip[],
  month: number,
  year: number,
  school: SchoolDetails,
): Uint8Array {
  const monthName = MONTH_NAMES[month - 1] || 'Month'
  const rows = payslips.slice(0, 15) // Clean fit on single Landscape page

  const totalGross = payslips.reduce((sum, p) => sum + p.grossEarnings, 0)
  const totalDeductions = payslips.reduce((sum, p) => sum + p.totalDeductions, 0)
  const totalNet = payslips.reduce((sum, p) => sum + p.netPayable, 0)

  const lines: string[] = [
    // Header
    'BT /F1 15 Tf 0.1 0.15 0.25 rg 50 555 Td (' + esc(school.schoolName.toUpperCase()) + ') Tj',
    '0 -16 Td /F1 9 Tf 0.35 0.4 0.5 rg (EIIN: ' +
      esc(school.eiin || '108234') +
      '   |   ' +
      esc(school.address || 'Dhaka, Bangladesh') +
      '   |   MONTHLY BANK DISBURSEMENT & SMC APPROVAL REGISTER) Tj',
    '0 -16 Td /F1 12 Tf 0.12 0.35 0.72 rg (STAFF SALARY STATEMENT - ' +
      esc(monthName.toUpperCase()) +
      ' ' +
      year +
      ') Tj',
    '0 -14 Td /F1 9.5 Tf 0.2 0.25 0.35 rg (Total Employees: ' +
      esc(String(payslips.length)) +
      '       Total Net Disbursement: BDT ' +
      esc(totalNet.toLocaleString()) +
      '       Date: ' +
      new Date().toISOString().slice(0, 10) +
      ') Tj',
    '0 -10 Td (---------------------------------------------------------------------------------------------------------------------------------------------------------------------) Tj',
    'ET',

    // Table Header Bar (Landscape width 742 pt, left 50, right 792)
    'q 0.93 0.95 0.98 rg 50 460 742 22 re f 0.75 0.8 0.88 RG 0.5 w 50 460 742 22 re s Q',
    'BT /F1 8.5 Tf 0.1 0.15 0.25 rg 55 467 Td (SL) Tj 25 0 Td (Staff ID) Tj 55 0 Td (Employee Name) Tj 130 0 Td (Designation & Type) Tj 130 0 Td (Bank / Channel & Account) Tj 135 0 Td (Gross (BDT)) Tj 75 0 Td (Ded. (BDT)) Tj 75 0 Td (Net Pay (BDT)) Tj 75 0 Td (Status) Tj ET',
  ]

  let y = 440
  rows.forEach((p, index) => {
    if (index % 2 === 1) {
      lines.push(`q 0.97 0.98 0.99 rg 50 ${y - 3} 742 16 re f Q`)
    }

    const shortAccount =
      p.paymentChannel === 'bank_transfer' && p.bankDetails
        ? `${p.bankDetails.bankName.slice(0, 12)} (${p.bankDetails.accountNo.slice(-6)})`
        : p.mfsNumber
          ? `${p.paymentChannel.toUpperCase()} ${p.mfsNumber}`
          : 'Cash'

    lines.push(
      'BT /F1 8 Tf 0.2 0.25 0.3 rg',
      `55 ${y} Td (${String(index + 1).padStart(2, '0')}) Tj`,
      `80 ${y} Td (${esc(p.staffId)}) Tj`,
      `135 ${y} Td (${esc(p.employeeName.slice(0, 20))}) Tj`,
      `265 ${y} Td (${esc(p.designation.slice(0, 16))} [${p.employmentType.toUpperCase()}]) Tj`,
      `395 ${y} Td (${esc(shortAccount)}) Tj`,
      `530 ${y} Td (${esc(p.grossEarnings.toLocaleString())}) Tj`,
      `605 ${y} Td (${esc(p.totalDeductions.toLocaleString())}) Tj`,
      `680 ${y} Td (${esc(p.netPayable.toLocaleString())}) Tj`,
      `755 ${y} Td (${esc(p.status.toUpperCase())}) Tj`,
      'ET',
    )
    y -= 18
  })

  // Grand Total Summary Bar
  lines.push(
    `q 0.9 0.93 0.98 rg 50 ${y - 4} 742 22 re f 0.6 0.7 0.85 RG 0.5 w 50 ${y - 4} 742 22 re s Q`,
    'BT /F1 9 Tf 0.1 0.2 0.4 rg',
    `55 ${y + 3} Td (TOTAL BATCH DISBURSEMENT (${esc(String(payslips.length))} Staff)) Tj`,
    `530 ${y + 3} Td (${esc(totalGross.toLocaleString())}) Tj`,
    `605 ${y + 3} Td (${esc(totalDeductions.toLocaleString())}) Tj`,
    `680 ${y + 3} Td (${esc(totalNet.toLocaleString())}) Tj`,
    'ET',
  )

  // Committee & Banking Signatures
  lines.push(
    'BT /F1 8.5 Tf 0.3 0.35 0.4 rg',
    '55 70 Td (____________________________________) Tj',
    '0 -12 Td (Prepared By: Head Accountant) Tj',
    '260 12 Td (____________________________________) Tj',
    '0 -12 Td (Verified By: Principal / Headmaster) Tj',
    '260 12 Td (____________________________________) Tj',
    '0 -12 Td (Approved By: SMC President / Chairman) Tj',
    'ET',
    'BT /F1 7.5 Tf 0.5 0.55 0.6 rg 50 35 Td (Official disbursement register generated by EduOS. For Sonali Bank, Dutch-Bangla Bank, and BEFTN institutional clearing.) Tj ET',
  )

  return assemblePdf(lines.join('\n'), '[0 0 842 595]')
}
