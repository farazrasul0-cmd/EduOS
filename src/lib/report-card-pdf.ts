export interface ReportCardSubjectRow {
  subject: string
  exam?: string
  marks: number
  total: number
  grade: string
  gpa: number
  highestMarks?: number
}

export interface ReportCardPdfInput {
  school: string
  schoolAddress?: string
  affiliation?: string
  eiin?: string
  examTerm?: string
  academicYear?: string
  student: string
  roll: string
  className?: string
  sectionName?: string
  studentId?: string
  rows: ReportCardSubjectRow[]
  average: number
  gpa: number
  overallGrade?: string
  isPassed?: boolean
  meritPosition?: number
  totalStudents?: number
  attendanceRate?: number
  remarks?: string
}

const escapePdf = (value: string) =>
  value.replace(/[^\x20-\x7E]/g, '?').replace(/([\\()])/g, '\\$1')

function generatePageStream(input: ReportCardPdfInput): string {
  const schoolName = input.school || 'EduOS Model High School'
  const addressLine = [
    input.schoolAddress || 'Dhaka, Bangladesh',
    input.eiin ? `EIIN: ${input.eiin}` : 'EIIN: 134201',
    input.affiliation || 'BISE Dhaka',
  ].join('  ·  ')

  const examTerm = input.examTerm || 'Annual Examination'
  const academicYear = input.academicYear || '2026'
  const studentName = input.student || 'Student'
  const rollNo = input.roll || '-'
  const className = input.className || 'Class 7'
  const sectionName = input.sectionName || 'A'

  const totalMarks = input.rows.reduce((sum, r) => sum + r.marks, 0)
  const totalPossible = input.rows.reduce((sum, r) => sum + r.total, 0)
  const isPassed = input.isPassed ?? (input.gpa > 0)
  const overallGrade = input.overallGrade || (isPassed ? (input.gpa >= 5.0 ? 'A+' : input.gpa >= 4.0 ? 'A' : 'B') : 'F')
  const meritStr = input.meritPosition
    ? `${input.meritPosition}${input.totalStudents ? ` of ${input.totalStudents}` : ''}`
    : '-'

  const remarks = input.remarks || (isPassed ? 'Satisfactory academic performance. Promoted.' : 'Needs improvement in failed subjects.')

  // Coordinate setup: Page dimensions 595 x 842 (A4 Portrait)
  const ops: string[] = []

  // Decorative border around the report card
  ops.push('0.5 w')
  ops.push('0.2 0.4 0.8 RG') // Primary accent border
  ops.push('30 30 535 782 re S')
  ops.push('0.85 0.85 0.85 RG')
  ops.push('33 33 529 776 re S')

  // Top header background tint
  ops.push('0.95 0.97 1.0 rg')
  ops.push('34 735 527 73 re f')

  // School Header
  ops.push('0 0 0 rg')
  ops.push('BT')
  ops.push('/F2 16 Tf')
  ops.push(`50 782 Td (${escapePdf(schoolName)}) Tj`)
  ops.push('/F1 8.5 Tf')
  ops.push(`0 -16 Td (${escapePdf(addressLine)}) Tj`)
  ops.push('/F2 11 Tf')
  ops.push(`0 -18 Td (ACADEMIC PROGRESS REPORT & MARKSHEET) Tj`)
  ops.push('/F1 9 Tf')
  ops.push(`0 -14 Td (${escapePdf(`${examTerm}  ·  Session ${academicYear}`)}) Tj`)
  ops.push('ET')

  // Divider line
  ops.push('0.8 0.8 0.8 RG')
  ops.push('45 724 m 550 724 l S')

  // Student Info Box
  ops.push('0.98 0.98 0.98 rg')
  ops.push('45 650 310 66 re f')
  ops.push('0.85 0.85 0.85 RG')
  ops.push('45 650 310 66 re S')

  ops.push('0 0 0 rg')
  ops.push('BT')
  ops.push('/F2 9.5 Tf')
  ops.push('55 700 Td (Student Name: ) Tj')
  ops.push('/F1 9.5 Tf')
  ops.push(`(${escapePdf(studentName)}) Tj`)

  ops.push('/F2 9 Tf')
  ops.push('0 -15 Td (Class & Section: ) Tj')
  ops.push('/F1 9 Tf')
  ops.push(`(${escapePdf(`${className} (${sectionName})`)}) Tj`)
  ops.push('/F2 9 Tf')
  ops.push(' 40 0 Td (Roll No: ) Tj')
  ops.push('/F1 9 Tf')
  ops.push(`(${escapePdf(rollNo)}) Tj`)

  ops.push('/F2 9 Tf')
  ops.push('-40 -15 Td (Merit Position: ) Tj')
  ops.push('/F1 9 Tf')
  ops.push(`(${escapePdf(meritStr)}) Tj`)
  if (input.attendanceRate != null) {
    ops.push('/F2 9 Tf')
    ops.push(' 50 0 Td (Attendance: ) Tj')
    ops.push('/F1 9 Tf')
    ops.push(`(${input.attendanceRate.toFixed(1)}%) Tj`)
  }
  ops.push('ET')

  // Grading Scale Reference Box (NCTB)
  ops.push('0.98 0.98 0.98 rg')
  ops.push('365 650 185 66 re f')
  ops.push('0.85 0.85 0.85 RG')
  ops.push('365 650 185 66 re S')

  ops.push('BT')
  ops.push('/F2 7.5 Tf')
  ops.push('372 704 Td (NCTB GRADING SCALE) Tj')
  ops.push('/F1 7 Tf')
  ops.push('0 -11 Td (80-100: A+ (5.0)   70-79: A (4.0)) Tj')
  ops.push('0 -9 Td (60-69:   A- (3.5)   50-59: B (3.0)) Tj')
  ops.push('0 -9 Td (40-49:   C  (2.0)   33-39: D (1.0)) Tj')
  ops.push('0 -9 Td (0-32:    F  (0.0)   [Pass: Min 33%]) Tj')
  ops.push('ET')

  // Marksheet Table Header
  const tableTop = 630
  ops.push('0.2 0.4 0.8 rg') // Header bar background
  ops.push(`45 ${tableTop - 18} 505 20 re f`)

  ops.push('1 1 1 rg') // White text for header
  ops.push('BT')
  ops.push('/F2 8.5 Tf')
  ops.push(`52 ${tableTop - 13} Td (SL) Tj`)
  ops.push(`25 0 Td (SUBJECT NAME) Tj`)
  ops.push(`175 0 Td (TOTAL) Tj`)
  ops.push(`45 0 Td (OBTAINED) Tj`)
  ops.push(`55 0 Td (HIGHEST) Tj`)
  ops.push(`55 0 Td (GRADE) Tj`)
  ops.push(`45 0 Td (GP) Tj`)
  ops.push('ET')

  // Rows
  let currentY = tableTop - 20
  const rowHeight = 18

  input.rows.forEach((row, idx) => {
    currentY -= rowHeight
    // Alternate row background
    if (idx % 2 === 0) {
      ops.push('0.97 0.98 0.99 rg')
      ops.push(`45 ${currentY} 505 ${rowHeight} re f`)
    }

    ops.push('0.9 0.9 0.9 RG')
    ops.push(`45 ${currentY} m 550 ${currentY} l S`)

    const subjectLabel = row.subject.length > 28 ? row.subject.slice(0, 27) + '..' : row.subject
    const highestStr = row.highestMarks != null ? String(row.highestMarks) : '-'

    ops.push('0 0 0 rg')
    ops.push('BT')
    ops.push('/F1 8.5 Tf')
    ops.push(`52 ${currentY + 5} Td (${idx + 1}) Tj`)
    ops.push(`25 0 Td (${escapePdf(subjectLabel)}) Tj`)
    ops.push(`180 0 Td (${row.total}) Tj`)
    ops.push(`50 0 Td (${row.marks}) Tj`)
    ops.push(`55 0 Td (${highestStr}) Tj`)
    ops.push('/F2 8.5 Tf')
    ops.push(`55 0 Td (${escapePdf(row.grade)}) Tj`)
    ops.push('/F1 8.5 Tf')
    ops.push(`45 0 Td (${row.gpa.toFixed(2)}) Tj`)
    ops.push('ET')
  })

  // Table bottom border
  ops.push('0.8 0.8 0.8 RG')
  ops.push(`45 ${currentY} m 550 ${currentY} l S`)

  // Summary Card
  const summaryY = currentY - 55
  ops.push('0.96 0.97 0.99 rg')
  ops.push(`45 ${summaryY} 505 45 re f`)
  ops.push('0.8 0.85 0.9 RG')
  ops.push(`45 ${summaryY} 505 45 re S`)

  ops.push('0 0 0 rg')
  ops.push('BT')
  ops.push('/F2 9.5 Tf')
  ops.push(`55 ${summaryY + 28} Td (TOTAL MARKS: ) Tj`)
  ops.push('/F1 9.5 Tf')
  ops.push(`(${totalMarks} / ${totalPossible}   ·   ${input.average.toFixed(1)}%) Tj`)

  ops.push('/F2 9.5 Tf')
  ops.push(` 140 0 Td (GPA: ) Tj`)
  ops.push('/F2 11 Tf')
  ops.push(`(${input.gpa.toFixed(2)} / 5.00) Tj`)
  ops.push('/F2 9.5 Tf')
  ops.push(` 45 0 Td (GRADE: ) Tj`)
  ops.push('/F2 11 Tf')
  ops.push(`(${escapePdf(overallGrade)}) Tj`)

  ops.push('/F2 9 Tf')
  ops.push(`-185 -18 Td (RESULT STATUS: ) Tj`)
  if (isPassed) {
    ops.push('0 0.5 0 rg')
    ops.push('/F2 10 Tf')
    ops.push('(PASSED / PROMOTED) Tj')
  } else {
    ops.push('0.8 0 0 rg')
    ops.push('/F2 10 Tf')
    ops.push('(FAILED / UNSUCCESSFUL) Tj')
  }
  ops.push('0 0 0 rg')
  ops.push('/F1 8.5 Tf')
  ops.push(` 50 0 Td (Remarks: ${escapePdf(remarks)}) Tj`)
  ops.push('ET')

  // Signature Block
  const sigY = summaryY - 60
  ops.push('0.7 0.7 0.7 RG')
  ops.push(`60 ${sigY} m 180 ${sigY} l S`)
  ops.push(`240 ${sigY} m 340 ${sigY} l S`)
  ops.push(`410 ${sigY} m 530 ${sigY} l S`)

  ops.push('0.2 0.2 0.2 rg')
  ops.push('BT')
  ops.push('/F1 8 Tf')
  ops.push(`80 ${sigY - 12} Td (Class Teacher) Tj`)
  ops.push(`170 0 Td (Exam Controller) Tj`)
  ops.push(`170 0 Td (Headmaster / Principal) Tj`)
  ops.push('ET')

  // Footer Watermark
  ops.push('0.5 0.5 0.5 rg')
  ops.push('BT')
  ops.push('/F1 7.5 Tf')
  ops.push(`135 45 Td (EduOS School Management Platform  ·  Computer-Generated Marksheet  ·  Secure Document) Tj`)
  ops.push('ET')

  return ops.join('\n')
}

/**
 * Creates an official single-page A4 NCTB Report Card PDF document.
 */
export function createReportCardPdf(input: ReportCardPdfInput): Uint8Array {
  const stream = generatePageStream(input)
  const streamLength = new TextEncoder().encode(stream).length

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${streamLength} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  ]

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(new TextEncoder().encode(pdf).length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xref = new TextEncoder().encode(pdf).length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((offset) => String(offset).padStart(10, '0') + ' 00000 n ')
    .join('\n')}\ntrailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`

  return new TextEncoder().encode(pdf)
}

/**
 * Generates a multi-page PDF combining all student report cards in a single batch document.
 */
export function createBatchReportCardsPdf(cards: ReportCardPdfInput[]): Uint8Array {
  if (!cards.length) {
    return createReportCardPdf({
      school: 'EduOS',
      student: 'N/A',
      roll: '0',
      rows: [],
      average: 0,
      gpa: 0,
    })
  }

  // PDF Structure:
  // 1: Catalog -> Pages (2)
  // 2: Pages -> Kids [Page objects...] Count N
  // For each card i (0..N-1):
  //   Page object: 3 + i*2
  //   Contents object: 4 + i*2
  // Font F1: 3 + N*2
  // Font F2: 4 + N*2

  const N = cards.length
  const font1ObjNum = 3 + N * 2
  const font2ObjNum = 4 + N * 2

  const pageObjNums: number[] = []
  const pageAndContentObjs: string[] = []

  cards.forEach((card, index) => {
    const pageObjNum = 3 + index * 2
    const contentObjNum = 4 + index * 2
    pageObjNums.push(pageObjNum)

    const stream = generatePageStream(card)
    const streamLength = new TextEncoder().encode(stream).length

    pageAndContentObjs.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${font1ObjNum} 0 R /F2 ${font2ObjNum} 0 R >> >> /Contents ${contentObjNum} 0 R >>`,
    )
    pageAndContentObjs.push(
      `<< /Length ${streamLength} >>\nstream\n${stream}\nendstream`,
    )
  })

  const catalogObj = '<< /Type /Catalog /Pages 2 0 R >>'
  const pagesObj = `<< /Type /Pages /Kids [${pageObjNums.map((num) => `${num} 0 R`).join(' ')}] /Count ${N} >>`
  const font1Obj = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  const font2Obj = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'

  const allObjects = [
    catalogObj,
    pagesObj,
    ...pageAndContentObjs,
    font1Obj,
    font2Obj,
  ]

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  allObjects.forEach((object, index) => {
    offsets.push(new TextEncoder().encode(pdf).length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })

  const xref = new TextEncoder().encode(pdf).length
  pdf += `xref\n0 ${allObjects.length + 1}\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((offset) => String(offset).padStart(10, '0') + ' 00000 n ')
    .join('\n')}\ntrailer << /Size ${allObjects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`

  return new TextEncoder().encode(pdf)
}
