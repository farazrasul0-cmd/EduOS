import type { NoticeRecord } from './notices'

export interface SchoolDetails {
  schoolName: string
  eiin?: string
  address?: string
  phone?: string
  email?: string
  establishedYear?: string
}

const esc = (value: string) =>
  value.replace(/[^\x20-\x7E]/g, '?').replace(/([\\()])/g, '\\$1')

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
 * Generates an official vector A4 Portrait (595 x 842 pt) Institutional Circular Notice.
 * Standard format for bulletin boards and ministry/board documentation in Bangladesh.
 */
export function createNoticeCircularPdf(
  notice: NoticeRecord,
  school: SchoolDetails,
): Uint8Array {
  const isUrgent = notice.priority === 'urgent'
  const bannerColor = isUrgent
    ? 'q 0.98 0.92 0.92 rg 50 685 495 26 re f 0.85 0.3 0.3 RG 0.75 w 50 685 495 26 re s Q'
    : 'q 0.93 0.96 0.99 rg 50 685 495 26 re f 0.3 0.5 0.8 RG 0.5 w 50 685 495 26 re s Q'

  const bannerTitle = isUrgent
    ? 'URGENT NOTICE & CIRCULAR / অতীব জরুরি বিজ্ঞপ্তি'
    : 'OFFICIAL NOTICE & CIRCULAR / প্রাতিষ্ঠানিক বিজ্ঞপ্তি'

  const lines: string[] = [
    // Double Border
    'q 0.15 0.25 0.45 RG 1.5 w 30 30 535 782 re s Q',
    'q 0.6 0.65 0.75 RG 0.5 w 35 35 525 772 re s Q',

    // School Header
    'BT /F1 16 Tf 0.1 0.15 0.3 rg 50 760 Td (' + esc(school.schoolName.toUpperCase()) + ') Tj',
    '0 -15 Td /F1 9 Tf 0.35 0.4 0.5 rg (EIIN: ' +
      esc(school.eiin || '108234') +
      '   |   ' +
      esc(school.address || 'Dhanmondi, Dhaka, Bangladesh') +
      '   |   OFFICE OF THE PRINCIPAL) Tj',
    '0 -12 Td (---------------------------------------------------------------------------------------------------------------------------------) Tj',
    'ET',

    // Title Banner
    bannerColor,
    'BT /F1 12 Tf ' +
      (isUrgent ? '0.7 0.1 0.1 rg' : '0.1 0.25 0.5 rg') +
      ' 130 693 Td (' +
      esc(bannerTitle) +
      ') Tj ET',

    // Memo Number & Date
    'BT /F1 9.5 Tf 0.2 0.25 0.35 rg',
    '50 655 Td (Memo No: ' + esc(notice.noticeNo) + ') Tj',
    '340 0 Td (Date of Issue: ' + esc(notice.publishDate) + ') Tj',
    'ET',

    // Category and Target Audience Ribbon
    'q 0.96 0.97 0.98 rg 50 620 495 22 re f 0.8 0.85 0.9 RG 0.5 w 50 620 495 22 re s Q',
    'BT /F1 8.5 Tf 0.2 0.3 0.4 rg',
    '60 627 Td (Category: ' +
      esc(notice.category.toUpperCase()) +
      '   |   Audience: ' +
      esc(notice.targetAudience.toUpperCase()) +
      '   |   Priority: ' +
      esc(notice.priority.toUpperCase()) +
      ') Tj',
    'ET',

    // Subject Header
    'BT /F1 12 Tf 0.1 0.15 0.3 rg',
    '50 585 Td (SUBJECT: ' + esc(notice.title.toUpperCase()) + ') Tj',
    'ET',

    // Notice Content Body
    'BT /F1 10 Tf 0.15 0.2 0.25 rg',
    '50 550 Td (This is for the information of all concerned that:) Tj',
  ]

  // Wrap content lines cleanly
  const words = notice.content.split(' ')
  let curLine = ''
  let curY = 525

  for (const word of words) {
    if ((curLine + ' ' + word).length > 78) {
      lines.push('50 ' + curY + ' Td (' + esc(curLine.trim()) + ') Tj')
      curLine = word
      curY -= 16
    } else {
      curLine += ' ' + word
    }
  }
  if (curLine.trim()) {
    lines.push('50 ' + curY + ' Td (' + esc(curLine.trim()) + ') Tj')
    curY -= 22
  }

  // Action / Expiry Directive
  if (notice.expiryDate) {
    curY -= 10
    lines.push(
      '50 ' + curY + ' Td (Effective Period: Until ' + esc(notice.expiryDate) + ' unless revoked or modified.) Tj',
    )
    curY -= 20
  }

  lines.push(
    '50 ' + curY + ' Td (All teachers, students, and guardians are cordially requested to take necessary note and comply.) Tj',
    'ET',
  )

  // Principal Signature Block
  lines.push(
    'BT /F1 9.5 Tf 0.2 0.25 0.35 rg',
    '340 220 Td (By Order of the Academic Council,) Tj',
    '0 -32 Td (____________________________________) Tj',
    '0 -14 Td (' + esc(notice.signedBy || 'Principal M. A. Karim') + ') Tj',
    '0 -12 Td (' + esc(notice.designation || 'Headmaster / Principal') + ') Tj',
    '0 -12 Td (' + esc(school.schoolName) + ') Tj',
    'ET',
  )

  // Official Seal Box
  lines.push(
    'q 0.9 0.93 0.98 rg 50 145 150 55 re f 0.7 0.75 0.85 RG 0.5 w 50 145 150 55 re s Q',
    'BT /F1 8 Tf 0.2 0.3 0.5 rg',
    '60 180 Td (INSTITUTIONAL SEAL) Tj',
    '60 162 Td (Verified electronically) Tj',
    'ET',
  )

  // Circulation Distribution List (অনুলিপি)
  lines.push(
    'q 0.95 0.96 0.98 rg 50 55 495 75 re f 0.8 0.85 0.9 RG 0.5 w 50 55 495 75 re s Q',
    'BT /F1 8 Tf 0.25 0.3 0.35 rg',
    '60 115 Td (Copy forwarded for kind information and necessary action to:) Tj',
    '60 100 Td (1. President, Managing Committee / Governing Body) Tj',
    '60 88 Td (2. Assistant Headmaster & Shift In-Charge) Tj',
    '60 76 Td (3. All Teachers, Staff, Notice Board & Web Portal) Tj',
    '60 64 Td (4. Office Master Guard File) Tj',
    'ET',
  )

  lines.push(
    'BT /F1 7 Tf 0.5 0.55 0.6 rg 50 38 Td (Official Institutional Circular generated by EduOS Digital Notice Engine. For board, legal, and public records.) Tj ET',
  )

  return assemblePdf(lines.join('\n'))
}
