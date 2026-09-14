import type { TabulationStudentRow, CohortStatistics } from './tabulation'

export interface SchoolDetails {
  schoolName: string
  eiin?: string
  address?: string
}

export interface TabulationSheetPdfInput {
  school: SchoolDetails
  examTitle: string
  academicYear: string
  className: string
  sectionName?: string
  subjectNames: string[]
  rows: TabulationStudentRow[]
  stats: CohortStatistics
}

const esc = (value: string) =>
  value.replace(/[^\x20-\x7E]/g, '?').replace(/([\\()])/g, '\\$1')

function assemblePdf(content: string, mediaBox = '[0 0 842 595]'): Uint8Array {
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
 * Generates an official vector A4 Landscape (842 x 595 pt) Class Examination Tabulation Broadsheet.
 */
export function createTabulationSheetPdf(input: TabulationSheetPdfInput): Uint8Array {
  const { school, examTitle, academicYear, className, sectionName, subjectNames, rows, stats } = input

  // Fit subjects cleanly (up to 6 core subjects across landscape page)
  const displaySubjects = subjectNames.slice(0, 6)

  const lines: string[] = [
    // Outer security border
    'q 0.15 0.25 0.45 RG 1.5 w 30 30 782 535 re s Q',
    'q 0.7 0.75 0.85 RG 0.5 w 34 34 774 527 re s Q',

    // School & Exam Header
    'BT /F1 15 Tf 0.1 0.15 0.3 rg 45 540 Td (' + esc(school.schoolName.toUpperCase()) + ') Tj',
    '0 -15 Td /F1 9 Tf 0.35 0.4 0.5 rg (EIIN: ' +
      esc(school.eiin || '108234') +
      '   |   ' +
      esc(school.address || 'Dhaka, Bangladesh') +
      '   |   EXAMINATION COMMITTEE) Tj',
    '0 -15 Td /F1 12.5 Tf 0.15 0.35 0.7 rg (MASTER CLASS TABULATION SHEET / সার্বিক মূল্যায়ন সারণী) Tj',
    '0 -14 Td /F1 9.5 Tf 0.2 0.25 0.35 rg (Exam: ' +
      esc(examTitle) +
      '   |   Session: ' +
      esc(academicYear) +
      '   |   Class: ' +
      esc(className) +
      (sectionName ? ' (' + esc(sectionName) + ')' : '') +
      '   |   Date: ' +
      new Date().toISOString().slice(0, 10) +
      ') Tj',
    '0 -10 Td (----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------) Tj',
    'ET',

    // Summary Analytics Ribbon
    'q 0.94 0.96 0.99 rg 45 448 752 20 re f 0.75 0.8 0.9 RG 0.5 w 45 448 752 20 re s Q',
    'BT /F1 8.5 Tf 0.15 0.25 0.4 rg',
    '52 454 Td (Enrolled: ' + esc(String(stats.totalAppeared)) + ' Students   |   Passed: ' + esc(String(stats.totalPassed)) + '   |   Failed: ' + esc(String(stats.totalFailed)) + '   |   Pass Rate: ' + esc(String(stats.passPercentage)) + '%   |   GPA 5.0 (A+): ' + esc(String(stats.gpa5Count)) + '   |   Class Avg: ' + esc(String(stats.classAverage)) + '%) Tj',
    'ET',

    // Table Header Bar (Landscape width 752 pt, left 45)
    'q 0.92 0.94 0.97 rg 45 422 752 22 re f 0.7 0.75 0.85 RG 0.5 w 45 422 752 22 re s Q',
  ]

  // Construct table header text
  let headerText = 'Roll  Examinee Name'.padEnd(25)
  displaySubjects.forEach((sub) => {
    headerText += `${sub.slice(0, 10)}[Tot/G]`.padEnd(16)
  })
  headerText += 'GrandTot  GPA   Grade  Status   Rank'

  lines.push(
    'BT /F1 8 Tf 0.1 0.15 0.25 rg',
    `50 429 Td (${esc(headerText)}) Tj`,
    'ET',
  )

  let y = 405
  const displayRows = rows.slice(0, 14) // Clean fit for single landscape page
  displayRows.forEach((r, idx) => {
    if (idx % 2 === 1) {
      lines.push(`q 0.97 0.98 0.99 rg 45 ${y - 3} 752 16 re f Q`)
    }

    const rollPad = r.rollNo.padEnd(5).slice(0, 5)
    const namePad = r.studentName.padEnd(19).slice(0, 19)

    let rowStr = `${rollPad} ${namePad}`
    displaySubjects.forEach((sub) => {
      const score = r.subjects[sub]
      const subStr = score ? `${score.totalMarks}(${score.letter})` : '—'
      rowStr += subStr.padEnd(16)
    })

    const totPad = String(r.grandTotal).padEnd(9).slice(0, 9)
    const gpaPad = r.gpa.toFixed(2).padEnd(6).slice(0, 6)
    const gradePad = r.overallGrade.padEnd(6).slice(0, 6)
    const statusPad = (r.isPassed ? 'PASSED' : 'FAILED').padEnd(9).slice(0, 9)
    const rankPad = `#${r.meritPosition}`

    rowStr += `${totPad} ${gpaPad} ${gradePad} ${statusPad} ${rankPad}`

    lines.push(
      'BT /F1 8 Tf ' + (r.isPassed ? '0.2 0.25 0.3 rg' : '0.6 0.15 0.15 rg'),
      `50 ${y} Td (${esc(rowStr)}) Tj`,
      'ET',
    )
    y -= 18
  })

  // Statistical Footer: Highest in Subject
  let highestRow = 'HIGHEST MARKS'.padEnd(25)
  displaySubjects.forEach((sub) => {
    const high = stats.subjectStats[sub]?.highestMarks ?? 0
    highestRow += `${high}`.padEnd(16)
  })
  lines.push(
    `q 0.95 0.95 0.98 rg 45 ${y - 3} 752 16 re f 0.7 0.75 0.85 RG 0.5 w 45 ${y - 3} 752 16 re s Q`,
    'BT /F1 7.5 Tf 0.1 0.2 0.4 rg',
    `50 ${y} Td (${esc(highestRow)}) Tj`,
    'ET',
  )

  // Signatures
  lines.push(
    'BT /F1 8 Tf 0.25 0.3 0.4 rg',
    '50 65 Td (____________________________________) Tj',
    '0 -12 Td (Tabulator Teacher / সারণীকারক) Tj',
    '260 12 Td (____________________________________) Tj',
    '0 -12 Td (Scrutinizer / নিরীক্ষক) Tj',
    '260 12 Td (____________________________________) Tj',
    '0 -12 Td (Headmaster / Principal / অধ্যক্ষ) Tj',
    'ET',
    'BT /F1 7 Tf 0.5 0.55 0.6 rg 45 35 Td (Official Institutional Tabulation Record generated by EduOS. For academic records, promotion, and board submissions.) Tj ET',
  )

  return assemblePdf(lines.join('\n'), '[0 0 842 595]')
}
