import type {
  AdmitCardCandidate,
  ExamHall,
  BenchAllocation,
} from './admit-card'

export interface SchoolDetails {
  schoolName: string
  eiin?: string
  address?: string
  phone?: string
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
 * Generates an official vector A4 Portrait (595 x 842 pt) Student Examination Admit Card.
 */
export function createStudentAdmitCardPdf(
  candidate: AdmitCardCandidate,
  school: SchoolDetails,
): Uint8Array {
  const lines: string[] = [
    // Outer security border
    'q 0.15 0.25 0.45 RG 2 w 30 30 535 782 re s Q',
    'q 0.6 0.7 0.8 RG 0.75 w 36 36 523 770 re s Q',

    // School Header
    'BT /F1 16 Tf 0.1 0.15 0.35 rg 55 770 Td (' + esc(school.schoolName.toUpperCase()) + ') Tj',
    '0 -16 Td /F1 9 Tf 0.3 0.35 0.45 rg (EIIN: ' +
      esc(school.eiin || '108234') +
      '   |   ' +
      esc(school.address || 'Dhaka, Bangladesh') +
      (school.phone ? '   |   Phone: ' + esc(school.phone) : '') +
      ') Tj',
    '0 -14 Td /F1 8.5 Tf 0.35 0.4 0.5 rg (OFFICE OF THE CONTROLLER OF EXAMINATIONS) Tj',
    '0 -10 Td (---------------------------------------------------------------------------------------------------------------------------------) Tj',
    'ET',

    // Title Banner
    'q 0.93 0.95 0.98 rg 140 685 315 28 re f 0.2 0.35 0.6 RG 1 w 140 685 315 28 re s Q',
    'BT /F1 13 Tf 0.1 0.2 0.45 rg 160 694 Td (EXAMINATION ADMIT CARD / প্রবেশপত্র) Tj ET',

    // Exam Title & Session
    'BT /F1 10.5 Tf 0.15 0.2 0.3 rg 55 660 Td (' + esc(candidate.examTitle.toUpperCase()) + ' - ' + esc(candidate.academicYear) + ') Tj ET',

    // Student Information Card Box
    'q 0.97 0.98 0.99 rg 50 540 495 105 re f 0.7 0.75 0.85 RG 0.5 w 50 540 495 105 re s Q',

    // Photo Box Placeholder (Right side)
    'q 0.9 0.92 0.95 rg 460 550 75 85 re f 0.6 0.65 0.75 RG 1 w 460 550 75 85 re s Q',
    'BT /F1 8 Tf 0.4 0.45 0.5 rg 475 590 Td ([ PHOTO ]) Tj ET',

    // Student Details
    'BT /F1 10 Tf 0.1 0.15 0.25 rg',
    '65 625 Td (Admit Card No: ' + esc(candidate.admitCardNo) + ') Tj',
    '230 0 Td (Student ID: ' + esc(candidate.studentId) + ') Tj',
    '0 -18 Td -230 0 Td (Candidate Name: ' + esc(candidate.studentName) + ') Tj',
    '0 -18 Td (Class: ' + esc(candidate.className) + '   |   Section: ' + esc(candidate.section) + '   |   Roll: ' + esc(candidate.rollNo) + ') Tj',
    '0 -18 Td (Guardian Name: ' + esc(candidate.guardianName) + ') Tj',
    '0 -18 Td (Group / Stream: ' + esc(candidate.group || 'General') + ') Tj',
    'ET',

    // Fee Clearance Status Seal Box
    'q 0.94 0.98 0.95 rg 50 500 495 28 re f 0.3 0.6 0.3 RG 0.75 w 50 500 495 28 re s Q',
    'BT /F1 9 Tf ' +
      (candidate.clearanceStatus === 'cleared'
        ? '0.1 0.5 0.2 rg 65 509 Td (FEE STATUS: [ VERIFIED & CLEARED ]  -  Eligible to Sit for Examination)'
        : candidate.clearanceStatus === 'overridden'
          ? '0.6 0.4 0.1 rg 65 509 Td (FEE STATUS: [ PROVISIONAL CLEARANCE GRANTED ]  -  ' + esc(candidate.overrideRemarks || 'Approved by Principal') + ')'
          : '0.7 0.1 0.1 rg 65 509 Td (FEE STATUS: [ DUES PENDING ]  -  Outstanding: BDT ' + esc(candidate.feeDueAmount.toLocaleString()) + ')') +
      ' Tj ET',

    // Subject Timetable Grid Header
    'BT /F1 10 Tf 0.15 0.2 0.35 rg 55 470 Td (SUBJECT EXAMINATION SCHEDULE & ATTENDANCE VERIFICATION:) Tj ET',
    'q 0.92 0.94 0.97 rg 50 440 495 20 re f 0.7 0.75 0.85 RG 0.5 w 50 440 495 20 re s Q',
    'BT /F1 8 Tf 0.1 0.15 0.25 rg 55 446 Td (Date) Tj 55 0 Td (Day) Tj 65 0 Td (Time Slot) Tj 105 0 Td (Subject & Paper Code) Tj 130 0 Td (Hall / Room) Tj 80 0 Td (Invig. Signature) Tj ET',
  ]

  let y = 422
  candidate.subjects.forEach((sub, idx) => {
    if (idx % 2 === 1) {
      lines.push(`q 0.97 0.98 0.99 rg 50 ${y - 3} 495 16 re f Q`)
    }
    lines.push(
      'BT /F1 7.5 Tf 0.2 0.25 0.3 rg',
      `55 ${y} Td (${esc(sub.examDate)}) Tj`,
      `110 ${y} Td (${esc(sub.dayOfWeek.slice(0, 3))}) Tj`,
      `175 ${y} Td (${esc(sub.timeSlot)}) Tj`,
      `280 ${y} Td (${esc(sub.subjectName)} [${esc(sub.subjectCode)}]) Tj`,
      `410 ${y} Td (${esc(sub.room)}) Tj`,
      `490 ${y} Td ([  ________  ]) Tj`,
      'ET',
    )
    y -= 17
  })

  // Disciplinary Rules
  lines.push(
    `q 0.98 0.96 0.96 rg 50 ${y - 8} 495 85 re f 0.8 0.6 0.6 RG 0.5 w 50 ${y - 8} 495 85 re s Q`,
    'BT /F1 8.5 Tf 0.5 0.15 0.15 rg',
    `60 ${y + 60} Td (CRITICAL RULES & REGULATIONS FOR EXAMINEES:) Tj`,
    '0 -13 Td /F1 7.5 Tf 0.3 0.2 0.2 rg (1. Examinee must display this original Admit Card on the desk throughout all examination papers.) Tj',
    '0 -11 Td (2. Entry into the examination hall is prohibited without official school uniform and ID badge.) Tj',
    '0 -11 Td (3. Mobile phones, smart watches, digital media, and unauthorized documents are strictly barred inside the hall.) Tj',
    '0 -11 Td (4. Examinees must occupy their designated seats 15 minutes prior to the commencement of the exam.) Tj',
    '0 -11 Td (5. Any unfair means or copying will lead to immediate expulsion under institutional examination bylaws.) Tj',
    'ET',
  )

  // Signatures
  lines.push(
    'BT /F1 8 Tf 0.25 0.3 0.4 rg',
    '65 75 Td (____________________________) Tj',
    '0 -12 Td (Candidate Signature) Tj',
    '180 12 Td (____________________________) Tj',
    '0 -12 Td (Convenor / Controller of Exams) Tj',
    '180 12 Td (____________________________) Tj',
    '0 -12 Td (Headmaster / Principal) Tj',
    'ET',
    'q 0.7 0.75 0.85 RG 0.5 w 440 45 90 35 re s Q',
    'BT /F1 7 Tf 0.45 0.5 0.6 rg 455 60 Td ([ INSTITUTION SEAL ]) Tj ET',
    'BT /F1 6.5 Tf 0.5 0.55 0.6 rg 50 35 Td (Official examination document generated by EduOS. Verification Serial: ' + esc(candidate.admitCardNo) + ') Tj ET',
  )

  return assemblePdf(lines.join('\n'), '[0 0 595 842]')
}

/**
 * Generates an official vector A4 Landscape (842 x 595 pt) Exam Hall Door Seating Notice.
 */
export function createExamHallDoorNoticePdf(
  hall: ExamHall,
  allocations: BenchAllocation[],
  examTitle: string,
  school: SchoolDetails,
): Uint8Array {
  const hallAllocations = allocations.filter((a) => a.hallId === hall.id || a.hallName === hall.roomName)
  const totalStudents = hallAllocations.length

  const classesSeated = Array.from(
    new Set(hallAllocations.map((a) => a.candidate.className)),
  ).join(', ')

  const lines: string[] = [
    // Header
    'BT /F1 15 Tf 0.1 0.15 0.3 rg 50 555 Td (' + esc(school.schoolName.toUpperCase()) + ') Tj',
    '0 -16 Td /F1 9 Tf 0.35 0.4 0.5 rg (EIIN: ' +
      esc(school.eiin || '108234') +
      '   |   ' +
      esc(school.address || 'Dhaka, Bangladesh') +
      '   |   EXAMINATION COMMITTEE) Tj',
    '0 -16 Td /F1 12.5 Tf 0.15 0.35 0.7 rg (EXAMINATION HALL DOOR NOTICE & SEATING PLAN / আসন বিন্যাস তালিকা) Tj',
    '0 -14 Td /F1 9.5 Tf 0.2 0.25 0.35 rg (Exam: ' +
      esc(examTitle) +
      '   |   Room: ' +
      esc(hall.roomName) +
      ' (' +
      esc(hall.building) +
      ', Floor ' +
      esc(String(hall.floor)) +
      ')   |   Total Seated: ' +
      esc(String(totalStudents)) +
      ' Students) Tj',
    '0 -13 Td /F1 9 Tf 0.3 0.35 0.4 rg (Classes in Hall: ' +
      esc(classesSeated || 'All') +
      '   |   Invigilator: ' +
      esc(hall.invigilatorName) +
      ' (' +
      esc(hall.invigilatorPhone) +
      ')) Tj',
    '0 -10 Td (---------------------------------------------------------------------------------------------------------------------------------------------------------------------) Tj',
    'ET',

    // Table Header Bar (Landscape width 742 pt, left 50, right 792)
    'q 0.93 0.95 0.98 rg 50 455 742 22 re f 0.75 0.8 0.88 RG 0.5 w 50 455 742 22 re s Q',
    'BT /F1 8.5 Tf 0.1 0.15 0.25 rg 55 462 Td (Bench) Tj 45 0 Td (Seat A (Left Seat Examinee)) Tj 220 0 Td (Class & Roll) Tj 100 0 Td (Seat B (Right Seat Examinee)) Tj 220 0 Td (Class & Roll) Tj ET',
  ]

  // Group allocations by benchNo
  const benchMap = new Map<number, { left?: BenchAllocation; right?: BenchAllocation }>()
  for (let b = 1; b <= hall.totalBenches; b++) {
    benchMap.set(b, {})
  }
  for (const alloc of hallAllocations) {
    const entry = benchMap.get(alloc.benchNo) ?? {}
    if (alloc.seatPosition === 'Left') entry.left = alloc
    else entry.right = alloc
    benchMap.set(alloc.benchNo, entry)
  }

  let y = 435
  const benchKeys = Array.from(benchMap.keys()).sort((a, b) => a - b).slice(0, 18) // up to 18 benches per page
  benchKeys.forEach((bNo, index) => {
    if (index % 2 === 1) {
      lines.push(`q 0.97 0.98 0.99 rg 50 ${y - 3} 742 16 re f Q`)
    }

    const { left, right } = benchMap.get(bNo) ?? {}
    const leftName = left ? `${left.candidate.studentName} (${left.candidate.admitCardNo})` : '— VACANT —'
    const leftMeta = left ? `${left.candidate.className} · Roll ${left.candidate.rollNo}` : '—'
    const rightName = right ? `${right.candidate.studentName} (${right.candidate.admitCardNo})` : '— VACANT —'
    const rightMeta = right ? `${right.candidate.className} · Roll ${right.candidate.rollNo}` : '—'

    lines.push(
      'BT /F1 8 Tf 0.2 0.25 0.3 rg',
      `55 ${y} Td (Bench ${bNo}) Tj`,
      `100 ${y} Td (${esc(leftName.slice(0, 32))}) Tj`,
      `320 ${y} Td (${esc(leftMeta)}) Tj`,
      `420 ${y} Td (${esc(rightName.slice(0, 32))}) Tj`,
      `640 ${y} Td (${esc(rightMeta)}) Tj`,
      'ET',
    )
    y -= 18
  })

  // Signatures
  lines.push(
    'BT /F1 8.5 Tf 0.3 0.35 0.4 rg',
    '55 70 Td (____________________________________) Tj',
    '0 -12 Td (Hall Invigilator / Duty Teacher) Tj',
    '260 12 Td (____________________________________) Tj',
    '0 -12 Td (Convenor, Examination Committee) Tj',
    '260 12 Td (____________________________________) Tj',
    '0 -12 Td (Headmaster / Principal) Tj',
    'ET',
    'BT /F1 7.5 Tf 0.5 0.55 0.6 rg 50 35 Td (Official Examination Hall Notice generated by EduOS. Affix strictly on the external hall entrance 30 minutes before exam.) Tj ET',
  )

  return assemblePdf(lines.join('\n'), '[0 0 842 595]')
}

/**
 * Generates an official vector A4 Portrait (595 x 842 pt) sheet of 8 printable Bench Stickers.
 */
export function createBenchStickersPdf(
  allocations: BenchAllocation[],
  school: SchoolDetails,
): Uint8Array {
  const lines: string[] = [
    // Header title
    'BT /F1 11 Tf 0.15 0.2 0.35 rg 50 810 Td (' + esc(school.schoolName.toUpperCase()) + '  -  EXAM BENCH STICKERS / ডেস্ক স্লিপ) Tj ET',
  ]

  const items = allocations.slice(0, 8) // 8 stickers per page (2 columns x 4 rows)
  const colWidth = 240
  const rowHeight = 160
  const startX = 45
  const startY = 620

  items.forEach((item, index) => {
    const col = index % 2
    const row = Math.floor(index / 2)
    const x = startX + col * (colWidth + 25)
    const y = startY - row * (rowHeight + 15)

    // Sticker box with dashed security border
    lines.push(
      `q 0.95 0.97 0.99 rg ${x} ${y} ${colWidth} ${rowHeight} re f 0.6 0.7 0.8 RG 1 w [3 2] 0 d ${x} ${y} ${colWidth} ${rowHeight} re s Q`,
      'BT /F1 9 Tf 0.1 0.2 0.4 rg',
      `${x + 12} ${y + 138} Td (EXAM SEAT: ${esc(item.hallName)}  -  BENCH ${item.benchNo}) Tj`,
      `0 -14 Td /F1 8 Tf 0.4 0.45 0.5 rg (Position: ${esc(item.seatPosition.toUpperCase())} SEAT) Tj`,
      `0 -18 Td /F1 11 Tf 0.15 0.2 0.3 rg (${esc(item.candidate.studentName.slice(0, 24))}) Tj`,
      `0 -16 Td /F1 9.5 Tf 0.25 0.3 0.4 rg (Roll: ${esc(item.candidate.rollNo)}   |   Class: ${esc(item.candidate.className)}) Tj`,
      `0 -14 Td /F1 8.5 Tf 0.3 0.35 0.45 rg (Section: ${esc(item.candidate.section)}   |   ${esc(item.candidate.admitCardNo)}) Tj`,
      `0 -14 Td /F1 7.5 Tf 0.45 0.5 0.55 rg (Student ID: ${esc(item.candidate.studentId)}) Tj`,
      `0 -15 Td /F1 7 Tf 0.5 0.55 0.6 rg ([ CUT & PASTE ON DESK CORNER ]) Tj`,
      'ET',
    )
  })

  return assemblePdf(lines.join('\n'), '[0 0 595 842]')
}
