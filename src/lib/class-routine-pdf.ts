export interface ClassRoutineSlotPdf {
  dayOfWeek: number // 1 to 6 (Sat to Thu)
  period: number // 1 to 8
  subjectName: string
  teacherName?: string
  room?: string
}

export interface ClassRoutinePdfInput {
  schoolName: string
  eiin?: string
  className: string
  sectionName?: string
  academicYear: string
  shift?: string
  effectiveDate?: string
  slots: ClassRoutineSlotPdf[]
}

const esc = (value: string) =>
  value.replace(/[^\x20-\x7E]/g, '?').replace(/([\\()])/g, '\\$1')

const DAY_NAMES = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']

/**
 * Generates an official vector A4 Landscape (842 x 595 pt) Class Routine & Timetable PDF.
 */
export function createClassRoutinePdf(input: ClassRoutinePdfInput): Uint8Array {
  // Build lookup map for slots: `${dayIndex}-${period}`
  const slotMap = new Map<string, ClassRoutineSlotPdf>()
  for (const s of input.slots) {
    slotMap.set(`${s.dayOfWeek}-${s.period}`, s)
  }

  const lines: string[] = [
    // Header Block
    'BT /F1 15 Tf 40 560 Td (' + esc(input.schoolName.toUpperCase()) + ') Tj',
    '0 -18 Td /F1 11 Tf (ACADEMIC CLASS ROUTINE & TIMETABLE MATRIX) Tj',
    '0 -14 Td /F1 8.5 Tf (EIIN: ' +
      esc(input.eiin || '108234') +
      '   |   Class: ' +
      esc(input.className) +
      (input.sectionName ? ' (' + esc(input.sectionName) + ')' : '') +
      '   |   Shift: ' +
      esc(input.shift || 'Day Shift') +
      '   |   Session: ' +
      esc(input.academicYear) +
      '   |   Effective: ' +
      esc(input.effectiveDate || '2026') +
      ') Tj',
    '0 -10 Td (------------------------------------------------------------------------------------------------------------------------------------------------------) Tj',

    // Period Header
    '0 -14 Td /F1 8 Tf (DAY         P1 (8:00)       P2 (8:45)       P3 (9:30)       BREAK      P4 (10:25)      P5 (11:10)      P6 (11:55)      P7 (1:30)       P8 (2:15)) Tj',
    '0 -8 Td (------------------------------------------------------------------------------------------------------------------------------------------------------) Tj',
  ]

  // Day Rows: 1 = Sat, 2 = Sun, 3 = Mon, 4 = Tue, 5 = Wed, 6 = Thu
  for (let day = 1; day <= 6; day++) {
    const dayName = DAY_NAMES[day - 1].padEnd(12).slice(0, 12)
    const getCell = (period: number) => {
      const s = slotMap.get(`${day}-${period}`)
      if (!s) return '-'.padEnd(16).slice(0, 16)
      const subj = (s.subjectName || '-').slice(0, 8)
      const teacher = s.teacherName ? `(${s.teacherName.slice(0, 5)})` : ''
      return `${subj} ${teacher}`.padEnd(16).slice(0, 16)
    }

    const p1 = getCell(1)
    const p2 = getCell(2)
    const p3 = getCell(3)
    const brk = 'TIFFIN'.padEnd(11).slice(0, 11)
    const p4 = getCell(4)
    const p5 = getCell(5)
    const p6 = getCell(6)
    const p7 = getCell(7)
    const p8 = getCell(8).trimEnd()

    const lineText = `${dayName}${p1}${p2}${p3}${brk}${p4}${p5}${p6}${p7}${p8}`
    lines.push('0 -22 Td /F1 8 Tf (' + esc(lineText) + ') Tj')
    lines.push('0 -4 Td (......................................................................................................................................................) Tj')
  }

  // Footer & Signatures
  lines.push(
    '0 -45 Td /F1 8.5 Tf (NOTE: Regular attendance is mandatory. Students must enter classroom 5 minutes prior to first period.) Tj',
    '0 -35 Td /F1 9 Tf (_____________________________                                                         _____________________________) Tj',
    '0 -12 Td /F1 9 Tf (      Class Teacher Signature                                                                        Headmaster / Principal Signature) Tj',
    'ET',
  )

  const content = lines.join('\n')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
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
