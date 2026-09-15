import type { NctbStudentDistribution, BookLoan } from './library'
import { getNctbCurriculumBooks } from './library'

const esc = (value: string) =>
  value.replace(/[^\x20-\x7E]/g, '?').replace(/([\\()])/g, '\\$1')

export interface SchoolDetails {
  schoolName: string
  eiin?: string
  address?: string
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

/**
 * Generates an official vector A4 Landscape (842 x 595 pt) NCTB Free Textbook Distribution Register.
 * Standard format submitted to the Upazila Education Office (UEO / BANBEIS).
 */
export function createBookDistributionReportPdf(
  distributions: NctbStudentDistribution[],
  className: string,
  school: SchoolDetails,
): Uint8Array {
  const subjects = getNctbCurriculumBooks(className)
  const rows = distributions.slice(0, 14) // Fit cleanly on single Landscape sheet

  const lines: string[] = [
    // Header
    'BT /F1 15 Tf 0.1 0.15 0.25 rg 50 555 Td (' + esc(school.schoolName.toUpperCase()) + ') Tj',
    '0 -16 Td /F1 9 Tf 0.35 0.4 0.5 rg (EIIN: ' +
      esc(school.eiin || '108234') +
      '   |   ' +
      esc(school.address || 'Dhaka, Bangladesh') +
      '   |   UPAZILA EDUCATION OFFICE REGISTER) Tj',
    '0 -16 Td /F1 12 Tf 0.12 0.35 0.72 rg (NCTB FREE TEXTBOOK DISTRIBUTION REGISTER - SESSION 2026) Tj',
    '0 -14 Td /F1 10 Tf 0.2 0.25 0.35 rg (Class / Grade: ' +
      esc(className) +
      '       Total Students: ' +
      esc(String(distributions.length)) +
      '       Reporting Date: ' +
      new Date().toISOString().slice(0, 10) +
      ') Tj',
    '0 -10 Td (---------------------------------------------------------------------------------------------------------------------------------------------------------------------) Tj',
    'ET',

    // Table Header Bar (Landscape width 742 pt, left 50, right 792)
    'q 0.93 0.95 0.98 rg 50 460 742 22 re f 0.75 0.8 0.88 RG 0.5 w 50 460 742 22 re s Q',
    'BT /F1 8.5 Tf 0.1 0.15 0.25 rg 55 467 Td (Roll) Tj 35 0 Td (Student Full Name) Tj 150 0 Td (Textbook Subjects Status) Tj 250 0 Td (Receipt Date) Tj 80 0 Td (Parent / Guardian Signature) Tj 130 0 Td (Remarks) Tj ET',
  ]

  let y = 440
  rows.forEach((student) => {
    const deliveredCount = student.distributedSubjectKeys.length
    const totalCount = subjects.length
    const statusText = deliveredCount >= totalCount ? 'All Issued' : `${deliveredCount}/${totalCount} Books`

    lines.push(
      `BT /F1 8 Tf 0.15 0.2 0.3 rg 55 ${y} Td (${esc(student.rollNo)}) Tj ` +
        `35 0 Td (${esc(student.studentName.slice(0, 24))}) Tj ` +
        `150 0 Td (${esc(statusText)}) Tj ` +
        `250 0 Td (${esc(student.distributionDate || '2026-01-01')}) Tj ` +
        `80 0 Td (${student.guardianSigned ? '[ Signed / Verified ]' : 'Pending Signature'}) Tj ` +
        `130 0 Td (${deliveredCount >= totalCount ? 'Complete' : 'Partially Delivered'}) Tj ET`,
    )
    lines.push(`q 0.88 0.9 0.93 RG 0.4 w 50 ${y - 4} m 792 ${y - 4} l S Q`)
    y -= 20
  })

  // Certification Seal & Signatures
  lines.push(
    'BT /F1 9 Tf 0.2 0.25 0.35 rg 50 70 Td (______________________________________________________                                                                                ______________________________________________________)',
    '0 -12 Td /F1 8 Tf (      Class Teacher / Distribution In-Charge                                                                                                 Headmaster / Principal Seal & Signature) Tj',
    '0 -14 Td /F1 7.5 Tf 0.45 0.5 0.55 rg (Verified as per National Curriculum and Textbook Board (NCTB) Bangladesh guidelines for annual free textbook distribution.) Tj',
    'ET',
  )

  return assemblePdf(lines.join('\n'), '[0 0 842 595]')
}

/**
 * Generates an official vector A4 Portrait (595 x 842 pt) Library Overdue & Defaulters Notice.
 */
export function createLibraryOverdueNoticePdf(
  overdueLoans: BookLoan[],
  school: SchoolDetails,
): Uint8Array {
  const items = overdueLoans.slice(0, 18)
  const totalFine = overdueLoans.reduce((sum, loan) => sum + loan.fineAccrued, 0)

  const lines: string[] = [
    // Header
    'BT /F1 16 Tf 0.1 0.15 0.25 rg 50 790 Td (' + esc(school.schoolName.toUpperCase()) + ') Tj',
    '0 -16 Td /F1 9 Tf 0.35 0.4 0.5 rg (EIIN: ' +
      esc(school.eiin || '108234') +
      '   |   ' +
      esc(school.address || 'Dhaka, Bangladesh') +
      '   |   CENTRAL LIBRARY) Tj',
    '0 -16 Td /F1 12 Tf 0.75 0.15 0.15 rg (LIBRARY OVERDUE NOTICE & ACCRUED FINE LEDGER) Tj',
    '0 -14 Td /F1 9 Tf 0.2 0.25 0.35 rg (Issue Date: ' +
      new Date().toISOString().slice(0, 10) +
      '       Total Overdue Items: ' +
      esc(String(overdueLoans.length)) +
      '       Total Accrued Fines: BDT ' +
      esc(String(totalFine)) +
      ') Tj',
    '0 -10 Td (-----------------------------------------------------------------------------------------------------------------) Tj',
    'ET',

    // Table Header
    'q 0.95 0.92 0.92 rg 50 700 495 20 re f 0.85 0.7 0.7 RG 0.5 w 50 700 495 20 re s Q',
    'BT /F1 8.5 Tf 0.1 0.15 0.25 rg 55 706 Td (Book Title) Tj 150 0 Td (Borrower Name) Tj 110 0 Td (Class/Role) Tj 70 0 Td (Due Date) Tj 60 0 Td (Fine (BDT)) Tj ET',
  ]

  let y = 680
  items.forEach((loan) => {
    lines.push(
      `BT /F1 8 Tf 0.15 0.2 0.3 rg 55 ${y} Td (${esc(loan.bookTitle.slice(0, 24))}) Tj ` +
        `150 0 Td (${esc(loan.borrowerName.slice(0, 18))}) Tj ` +
        `110 0 Td (${esc(loan.borrowerClass || loan.borrowerRollOrDesignation)}) Tj ` +
        `70 0 Td (${esc(loan.dueDate)}) Tj ` +
        `60 0 Td (BDT ${esc(String(loan.fineAccrued))}) Tj ET`,
    )
    lines.push(`q 0.9 0.9 0.9 RG 0.4 w 50 ${y - 4} m 545 ${y - 4} l S Q`)
    y -= 22
  })

  // Instructions & Rules
  lines.push(
    `BT /F1 8.5 Tf 0.25 0.3 0.4 rg 50 ${Math.max(y - 20, 120)} Td (Important Library Circulation Notice:) Tj`,
    '0 -12 Td /F1 8 Tf 0.4 0.45 0.5 rg (1. All borrowed books must be returned within 14 days of issue to avoid daily fine of BDT 2.00.) Tj',
    '0 -11 Td (2. Unreturned books exceeding 30 days past due date will freeze exam admit card generation.) Tj',
    '0 -11 Td (3. In case of lost or damaged books, replacement cost plus processing fee will apply.) Tj',
    '0 -35 Td /F1 9 Tf 0.2 0.25 0.35 rg (_____________________________________________                                 _____________________________________________)',
    '0 -12 Td /F1 8 Tf (           Library In-Charge Signature                                                                             Principal Signature) Tj',
    'ET',
  )

  return assemblePdf(lines.join('\n'), '[0 0 595 842]')
}
