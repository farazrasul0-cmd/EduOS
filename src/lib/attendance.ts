import type { AttendanceStatus } from '@/types/models'

export type AttendanceStatusMap = Record<string, AttendanceStatus>

export function hasAttendanceChanges(
  studentIds: string[],
  saved: ReadonlyMap<string, AttendanceStatus>,
  current: AttendanceStatusMap,
): boolean {
  if (studentIds.some((id) => !saved.has(id))) return studentIds.length > 0
  return studentIds.some((id) => saved.get(id) !== current[id])
}

export function attendanceCounts(statuses: AttendanceStatus[]): Record<AttendanceStatus, number> {
  return statuses.reduce(
    (counts, status) => {
      counts[status] += 1
      return counts
    },
    { present: 0, absent: 0, late: 0, leave: 0 },
  )
}

export function attendanceErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return 'Attendance could not be saved.'
}

/**
 * Bangladesh Education Board Collegiate classification:
 * - Collegiate (নিয়মিত): >= 75% attendance. Eligible for internal and board exams.
 * - Non-Collegiate (নন-কলেজিয়েট): 60% - 74.9%. Allowed to sit for exams only with penalty fine.
 * - Dis-Collegiate (ডিস-কলেজিয়েট): < 60%. Strictly barred from exams.
 */
export type CollegiateStatus = 'collegiate' | 'non_collegiate' | 'dis_collegiate'

export function getAttendanceCollegiateStatus(rate: number): CollegiateStatus {
  if (rate >= 75) return 'collegiate'
  if (rate >= 60) return 'non_collegiate'
  return 'dis_collegiate'
}

export function generateAbsentSmsText(
  student: { name: string; roll?: string | null; className?: string | null },
  schoolName: string,
  date: string,
  lang: 'en' | 'bn' = 'en',
  hotline?: string,
): string {
  const rollStr = student.roll ? (lang === 'bn' ? `রোল: ${student.roll}` : `Roll: ${student.roll}`) : ''
  const classStr = student.className ? (lang === 'bn' ? `শ্রেণী: ${student.className}` : `Class: ${student.className}`) : ''
  const meta = [rollStr, classStr].filter(Boolean).join(', ')
  const metaStr = meta ? ` (${meta})` : ''
  const contact = hotline ? (lang === 'bn' ? ` যোগাযোগ: ${hotline}` : ` Contact: ${hotline}`) : ''

  if (lang === 'bn') {
    return `সম্মানিত অভিভাবক, আপনার সন্তান ${student.name}${metaStr} আজ ${date} তারিখে বিদ্যালয়ে অনুপস্থিত।${contact} — ${schoolName}`
  }
  return `Dear Guardian, your child ${student.name}${metaStr} is marked ABSENT today ${date} at ${schoolName}.${contact}`
}

export interface MonthlyAttendanceStudentRow {
  studentName: string
  rollNo: string
  dailyStatus: Record<number, 'P' | 'A' | 'L' | 'W' | 'H'>
  presentCount: number
  absentCount: number
  attendanceRate: number
  collegiateStatus: CollegiateStatus
}

export interface MonthlyAttendancePdfInput {
  schoolName: string
  schoolAddress?: string
  eiin?: string
  className: string
  sectionName?: string
  monthName: string
  year: string | number
  totalWorkingDays: number
  daysInMonth: number
  rows: MonthlyAttendanceStudentRow[]
}

const escapePdf = (value: string) =>
  value.replace(/[^\x20-\x7E]/g, '?').replace(/([\\()])/g, '\\$1')

/**
 * Generates an official Government-Standard A4 Landscape (842 x 595 pt)
 * Monthly Attendance Register (উপস্থিতি খাতা) document.
 */
export function createMonthlyAttendancePdf(input: MonthlyAttendancePdfInput): Uint8Array {
  const schoolName = input.schoolName || 'EduOS Model High School'
  const addressLine = [
    input.schoolAddress || 'Dhaka, Bangladesh',
    input.eiin ? `EIIN: ${input.eiin}` : 'EIIN: 134201',
    `Class: ${input.className}${input.sectionName ? ` (${input.sectionName})` : ''}`,
  ].join('   ·   ')

  const monthYearStr = `${input.monthName} ${input.year}`
  const daysToShow = Math.min(31, Math.max(28, input.daysInMonth || 31))

  const ops: string[] = []

  // Page dimensions: 842 x 595 (A4 Landscape)
  // Outer border
  ops.push('0.5 w')
  ops.push('0.2 0.4 0.8 RG')
  ops.push('25 25 792 545 re S')

  // Top header background
  ops.push('0.95 0.97 1.0 rg')
  ops.push('26 515 790 54 re f')

  // School Header
  ops.push('0 0 0 rg')
  ops.push('BT')
  ops.push('/F2 15 Tf')
  ops.push(`40 550 Td (${escapePdf(schoolName)}) Tj`)
  ops.push('/F1 8.5 Tf')
  ops.push(`0 -15 Td (${escapePdf(addressLine)}) Tj`)
  ops.push('/F2 11 Tf')
  ops.push(`440 15 Td (MONTHLY ATTENDANCE REGISTER) Tj`)
  ops.push('/F1 9 Tf')
  ops.push(`0 -15 Td (${escapePdf(`Period: ${monthYearStr}   ·   Working Days: ${input.totalWorkingDays}`)}) Tj`)
  ops.push('ET')

  // Table header setup
  const tableTop = 495
  const rowHeight = 16
  const dayColWidth = 14
  const startDayX = 230

  // Table Header Box
  ops.push('0.2 0.4 0.8 rg')
  ops.push(`35 ${tableTop - 20} 772 20 re f`)

  ops.push('1 1 1 rg')
  ops.push('BT')
  ops.push('/F2 8 Tf')
  ops.push(`42 ${tableTop - 13} Td (ROLL) Tj`)
  ops.push(`45 0 Td (STUDENT NAME) Tj`)

  // Days 1..N
  for (let d = 1; d <= daysToShow; d++) {
    const x = startDayX + (d - 1) * dayColWidth
    ops.push(`ET\nBT\n/F2 7 Tf\n${x} ${tableTop - 13} Td (${d}) Tj\nET\nBT\n/F2 8 Tf`)
  }

  const afterDaysX = startDayX + daysToShow * dayColWidth + 5
  ops.push(`ET\nBT\n/F2 7.5 Tf\n${afterDaysX} ${tableTop - 13} Td (PRS) Tj`)
  ops.push(`24 0 Td (ABS) Tj`)
  ops.push(`24 0 Td (RATE) Tj`)
  ops.push(`32 0 Td (STATUS) Tj`)
  ops.push('ET')

  // Table rows
  let currentY = tableTop - 20

  input.rows.forEach((row, idx) => {
    currentY -= rowHeight
    if (idx % 2 === 0) {
      ops.push('0.97 0.98 0.99 rg')
      ops.push(`35 ${currentY} 772 ${rowHeight} re f`)
    }

    // Grid divider line
    ops.push('0.9 0.9 0.9 RG')
    ops.push(`35 ${currentY} m 807 ${currentY} l S`)

    const studentNameTruncated = row.studentName.length > 20 ? row.studentName.slice(0, 19) + '.' : row.studentName

    ops.push('0 0 0 rg')
    ops.push('BT')
    ops.push('/F1 7.5 Tf')
    ops.push(`42 ${currentY + 4} Td (${escapePdf(row.rollNo || '-')}) Tj`)
    ops.push(`45 0 Td (${escapePdf(studentNameTruncated)}) Tj`)

    // Day marks
    for (let d = 1; d <= daysToShow; d++) {
      const mark = row.dailyStatus[d] || '-'
      const x = startDayX + (d - 1) * dayColWidth + 2
      ops.push(`ET\nBT\n/F1 7 Tf\n${x} ${currentY + 4} Td (${mark}) Tj\nET\nBT\n/F1 7.5 Tf`)
    }

    const prsX = startDayX + daysToShow * dayColWidth + 5
    ops.push(`ET\nBT\n/F1 7.5 Tf\n${prsX} ${currentY + 4} Td (${row.presentCount}) Tj`)
    ops.push(`24 0 Td (${row.absentCount}) Tj`)
    ops.push(`24 0 Td (${row.attendanceRate.toFixed(1)}%) Tj`)

    // Status label
    const statusLabel =
      row.collegiateStatus === 'collegiate'
        ? 'Collegiate'
        : row.collegiateStatus === 'non_collegiate'
        ? 'Non-Coll'
        : 'Dis-Coll'

    if (row.collegiateStatus === 'collegiate') {
      ops.push('/F2 7.5 Tf\n0 0.5 0 rg')
    } else {
      ops.push('/F2 7.5 Tf\n0.8 0 0 rg')
    }
    ops.push(`32 0 Td (${statusLabel}) Tj`)
    ops.push('ET')
  })

  // Table bottom line
  ops.push('0.7 0.7 0.7 RG')
  ops.push(`35 ${currentY} m 807 ${currentY} l S`)

  // Summary & Signatures at bottom
  const sigY = 55
  ops.push('0.7 0.7 0.7 RG')
  ops.push(`80 ${sigY} m 220 ${sigY} l S`)
  ops.push(`340 ${sigY} m 480 ${sigY} l S`)
  ops.push(`600 ${sigY} m 750 ${sigY} l S`)

  ops.push('0.2 0.2 0.2 rg')
  ops.push('BT')
  ops.push('/F1 8 Tf')
  ops.push(`110 ${sigY - 12} Td (Class Teacher Signature) Tj`)
  ops.push(`260 0 Td (Verified By / Admin Officer) Tj`)
  ops.push(`260 0 Td (Headmaster / Principal Seal) Tj`)
  ops.push('ET')

  // Footer note
  ops.push('0.5 0.5 0.5 rg')
  ops.push('BT')
  ops.push('/F1 7 Tf')
  ops.push(`40 32 Td (EduOS School Attendance Register  ·  Government Format Bangladesh Secondary Education  ·  Generated Electronically) Tj`)
  ops.push('ET')

  const stream = ops.join('\n')
  const streamLength = new TextEncoder().encode(stream).length

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>',
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
