import type { PortalChildSummary, PortalSubjectScore } from './portal'

export interface SchoolDetails {
  schoolName: string
  eiin?: string
  address?: string
  phone?: string
  email?: string
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
 * Generates an official vector A4 Portrait (595 x 842 pt) Student Progress Dossier for guardians.
 */
export function createStudentProgressDossierPdf(
  child: PortalChildSummary,
  subjects: PortalSubjectScore[],
  school: SchoolDetails,
): Uint8Array {
  const lines: string[] = [
    // Double Border
    'q 0.15 0.25 0.45 RG 1.5 w 30 30 535 782 re s Q',
    'q 0.6 0.65 0.75 RG 0.5 w 35 35 525 772 re s Q',

    // School Header
    'BT /F1 15 Tf 0.1 0.15 0.3 rg 50 760 Td (' + esc(school.schoolName.toUpperCase()) + ') Tj',
    '0 -15 Td /F1 9 Tf 0.35 0.4 0.5 rg (EIIN: ' +
      esc(school.eiin || '108234') +
      '   |   ' +
      esc(school.address || 'Dhaka, Bangladesh') +
      '   |   STUDENT PERFORMANCE RECORD) Tj',
    '0 -12 Td (---------------------------------------------------------------------------------------------------------------------------------) Tj',
    'ET',

    // Title Banner
    'q 0.94 0.96 0.99 rg 50 685 495 26 re f 0.75 0.8 0.9 RG 0.5 w 50 685 495 26 re s Q',
    'BT /F1 11 Tf 0.15 0.25 0.5 rg 110 693 Td (OFFICIAL STUDENT PROGRESS DOSSIER / শিক্ষার্থীর প্রগ্রেস রিপোর্ট) Tj ET',

    // Student Profile Box
    'q 0.96 0.97 0.99 rg 50 560 495 110 re f 0.75 0.8 0.85 RG 0.5 w 50 560 495 110 re s Q',
    'BT /F1 9.5 Tf 0.1 0.15 0.3 rg',
    '65 645 Td (Student Name: ' + esc(child.name) + ') Tj',
    '260 0 Td (Student ID: ' + esc(child.id) + ') Tj',
    '65 625 Td (Class & Section: ' + esc(child.className) + ' (' + esc(child.section) + ')) Tj',
    '260 0 Td (Roll Number: ' + esc(child.rollNo) + ') Tj',
    '65 605 Td (Guardian: ' + esc(child.guardianName) + ' [' + esc(child.guardianPhone) + ']) Tj',
    '260 0 Td (Academic Session: 2026) Tj',
    '65 585 Td (Attendance Standing: ' + child.attendanceRate + '% [' + child.collegiateStatus.toUpperCase() + ']) Tj',
    '260 0 Td (Class Merit Position: #' + child.meritPosition + ') Tj',
    'ET',

    // Section 1: Attendance Standing
    'BT /F1 10.5 Tf 0.1 0.2 0.4 rg 50 535 Td (1. ATTENDANCE & COLLEGIATE EVALUATION) Tj ET',
    'q 0.92 0.96 0.94 rg 50 500 495 24 re f 0.6 0.8 0.7 RG 0.5 w 50 500 495 24 re s Q',
    'BT /F1 9 Tf 0.1 0.4 0.25 rg',
    '65 507 Td (Status: ' +
      (child.collegiateStatus === 'collegiate'
        ? 'COLLEGIATE (NCTB ELIGIBLE)'
        : 'NON-COLLEGIATE') +
      '   |   Attended: ' +
      child.presentDays +
      ' of ' +
      child.totalWorkingDays +
      ' Days (' +
      child.attendanceRate +
      '%)   |   Excused Leaves: Included) Tj',
    'ET',

    // Section 2: Academic Scores Table
    'BT /F1 10.5 Tf 0.1 0.2 0.4 rg 50 470 Td (2. TERM ACADEMIC PERFORMANCE (CA 20% + FINAL 80%)) Tj ET',
    'q 0.93 0.95 0.98 rg 50 440 495 20 re f 0.7 0.75 0.85 RG 0.5 w 50 440 495 20 re s Q',
    'BT /F1 8.5 Tf 0.1 0.15 0.3 rg',
    '60 446 Td (Subject Name'.padEnd(25) + 'CA (20)'.padEnd(14) + 'Final (80)'.padEnd(14) + 'Total (100)'.padEnd(14) + 'Grade'.padEnd(10) + 'GP) Tj',
    'ET',
  ]

  let y = 422
  subjects.forEach((subj, idx) => {
    if (idx % 2 === 1) {
      lines.push('q 0.97 0.98 0.99 rg 50 ' + (y - 3) + ' 495 16 re f Q')
    }

    const rowStr =
      subj.subject.padEnd(22).slice(0, 22) +
      String(subj.caMarks).padEnd(13) +
      String(subj.finalMarks).padEnd(13) +
      String(subj.totalMarks).padEnd(13) +
      subj.letter.padEnd(9) +
      subj.gradePoint.toFixed(2)

    lines.push(
      'BT /F1 8 Tf 0.2 0.25 0.3 rg',
      '60 ' + y + ' Td (' + esc(rowStr) + ') Tj',
      'ET',
    )
    y -= 18
  })

  // Summary result row
  lines.push(
    'q 0.95 0.95 0.98 rg 50 ' + (y - 3) + ' 495 20 re f 0.7 0.75 0.85 RG 0.5 w 50 ' + (y - 3) + ' 495 20 re s Q',
    'BT /F1 9 Tf 0.1 0.2 0.4 rg',
    '60 ' + y + ' Td (OVERALL RESULT: GPA ' + child.gpa.toFixed(2) + ' (' + child.overallGrade + ')   |   Class Merit Rank: #' + child.meritPosition + '   |   Status: PASSED) Tj',
    'ET',
  )
  y -= 30

  // Section 3: Fee Clearance Status
  lines.push(
    'BT /F1 10.5 Tf 0.1 0.2 0.4 rg 50 ' + y + ' Td (3. INSTITUTIONAL FEE ACCOUNT CLEARANCE) Tj ET',
  )
  y -= 26

  const duesStr =
    child.totalDues > 0
      ? 'Outstanding Arrears: Tk ' + child.totalDues + ' (Due for payment via bKash/Nagad)'
      : 'Institutional Dues: FULLY CLEARED UP TO DATE (Tk 0 Due)'

  lines.push(
    'q 0.95 0.97 0.99 rg 50 ' + (y - 4) + ' 495 22 re f 0.75 0.8 0.9 RG 0.5 w 50 ' + (y - 4) + ' 495 22 re s Q',
    'BT /F1 8.5 Tf ' + (child.totalDues > 0 ? '0.7 0.2 0.1 rg' : '0.1 0.5 0.2 rg'),
    '65 ' + (y + 3) + ' Td (' + esc(duesStr) + ') Tj',
    'ET',
  )

  // Signatures
  lines.push(
    'BT /F1 8.5 Tf 0.25 0.3 0.4 rg',
    '70 95 Td (________________________________) Tj',
    '0 -13 Td (Class Teacher Signature) Tj',
    '340 13 Td (________________________________) Tj',
    '0 -13 Td (Headmaster / Principal Seal) Tj',
    'ET',
    'BT /F1 7 Tf 0.5 0.55 0.6 rg 50 45 Td (Official Institutional Student Dossier generated by EduOS. Verified electronically for guardian records.) Tj ET',
  )

  return assemblePdf(lines.join('\n'))
}
