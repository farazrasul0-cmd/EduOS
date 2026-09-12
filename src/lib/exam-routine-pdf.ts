export interface ExamRoutineRowPdf {
  date: string
  dayOfWeek: string
  timeSlot: string
  subjectName: string
  paperCode?: string
  totalMarks: number
  room: string
  invigilator?: string
}

export interface ExamRoutinePdfInput {
  schoolName: string
  eiin?: string
  academicYear: string
  examTitle: string
  className: string
  shift?: string
  instructions?: string[]
  items: ExamRoutineRowPdf[]
}

const esc = (value: string) =>
  value.replace(/[^\x20-\x7E]/g, '?').replace(/([\\()])/g, '\\$1')

const DEFAULT_INSTRUCTIONS = [
  '1. Admit Card and School Uniform are strictly mandatory to enter the examination hall.',
  '2. Examinees must take their designated seats 15 minutes before the exam commences.',
  '3. Mobile phones, smart watches, programmable calculators, and unauthorized materials are strictly prohibited.',
  '4. Examinees must verify question papers and write their full Name and Roll Number legibly on the script.',
  '5. No examinee will be allowed to leave the hall before half the examination time has elapsed.',
]

/**
 * Generates an official vector A4 Portrait (595 x 842 pt) Examination Routine & Schedule PDF.
 */
export function createExamRoutinePdf(input: ExamRoutinePdfInput): Uint8Array {
  const instructions = input.instructions?.length ? input.instructions : DEFAULT_INSTRUCTIONS

  const lines: string[] = [
    // Header
    'BT /F1 16 Tf 45 805 Td (' + esc(input.schoolName.toUpperCase()) + ') Tj',
    '0 -20 Td /F1 12 Tf (OFFICIAL EXAMINATION SCHEDULE & ROUTINE) Tj',
    '0 -16 Td /F1 9.5 Tf (Examination: ' +
      esc(input.examTitle) +
      '   |   Class: ' +
      esc(input.className) +
      (input.shift ? '   |   Shift: ' + esc(input.shift) : '') +
      ') Tj',
    '0 -14 Td /F1 8.5 Tf (EIIN: ' +
      esc(input.eiin || '108234') +
      '   |   Academic Session: ' +
      esc(input.academicYear) +
      '   |   Notice Ref: EXAM/' +
      esc(input.academicYear) +
      '/RTN) Tj',
    '0 -10 Td (----------------------------------------------------------------------------------------------------------------) Tj',

    // Examinee Instructions
    '0 -14 Td /F1 9 Tf (SPECIAL INSTRUCTIONS FOR EXAMINEES / RULES OF CONDUCT:) Tj',
    ...instructions.map((inst) => '0 -12 Td /F1 7.5 Tf (' + esc(inst) + ') Tj'),
    '0 -10 Td (----------------------------------------------------------------------------------------------------------------) Tj',

    // Table Header
    '0 -14 Td /F1 8.5 Tf (DATE & DAY                TIME SLOT            SUBJECT & PAPER CODE      MARKS   ROOM     INVIGILATOR) Tj',
    '0 -8 Td (----------------------------------------------------------------------------------------------------------------) Tj',
  ]

  // Rows
  const sortedItems = [...input.items].sort((a, b) => a.date.localeCompare(b.date))
  sortedItems.forEach((row) => {
    const dateDay = `${row.date} (${row.dayOfWeek.slice(0, 3)})`.padEnd(25).slice(0, 25)
    const time = (row.timeSlot || '10:00 - 1:00').padEnd(20).slice(0, 20)
    const codeStr = row.paperCode ? ` [${row.paperCode}]` : ''
    const subj = `${row.subjectName}${codeStr}`.padEnd(25).slice(0, 25)
    const marks = String(row.totalMarks).padEnd(7).slice(0, 7)
    const room = (row.room || '-').padEnd(9).slice(0, 9)
    const invig = (row.invigilator || '-').slice(0, 18)

    const lineText = `${dateDay}${time}${subj}${marks}${room}${invig}`
    lines.push('0 -16 Td /F1 8 Tf (' + esc(lineText) + ') Tj')
  })

  // Signatures
  lines.push(
    '0 -40 Td (----------------------------------------------------------------------------------------------------------------) Tj',
    '0 -40 Td /F1 8.5 Tf (_____________________________                                                         _____________________________) Tj',
    '0 -12 Td /F1 8.5 Tf (Controller of Examinations                                                                 Principal / Headmaster) Tj',
    'ET',
  )

  const content = lines.join('\n')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${new TextEncoder().encode(content).length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(new TextEncoder().encode(pdf).length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })

  const xref = new TextEncoder().encode(pdf).length
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((offset) => String(offset).padStart(10, '0') + ' 00000 n ')
    .join('\n')}\ntrailer << /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`

  return new TextEncoder().encode(pdf)
}
