import {
  type StudentIdCardData,
  formatBloodGroup,
  generateQrPattern,
  generateStudentId,
} from './student-id-card'

const esc = (value: string) =>
  value.replace(/[^\x20-\x7E]/g, '?').replace(/([\\()])/g, '\\$1')

/**
 * Renders a 21x21 QR pattern into PDF vector rectangle fill operators (`re f`).
 */
function renderQrCodePdf(
  matrix: boolean[][],
  startX: number,
  startY: number,
  moduleSize: number = 1.6,
): string {
  const ops: string[] = ['0 0 0 rg'] // Black color
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c]) {
        // PDF coordinates start at bottom-left
        const x = (startX + c * moduleSize).toFixed(2)
        const y = (startY + (matrix.length - 1 - r) * moduleSize).toFixed(2)
        const s = moduleSize.toFixed(2)
        ops.push(`${x} ${y} ${s} ${s} re f`)
      }
    }
  }
  return ops.join('\n')
}

/**
 * Draws a single ID card (Front layout) at the specified origin (x, y).
 * Card dimensions: width = 243 pt, height = 153 pt (CR80 standard).
 */
function drawFrontCard(student: StudentIdCardData, x: number, y: number): string {
  const w = 243
  const h = 153
  const ops: string[] = []

  // Outer border & background (white with crisp border)
  ops.push('q')
  ops.push('1 1 1 rg') // white bg
  ops.push(`${x} ${y} ${w} ${h} re f`)
  ops.push('0.8 0.82 0.88 RG 0.75 w') // border stroke
  ops.push(`${x} ${y} ${w} ${h} re s`)

  // Top header banner (deep navy blue: #1e3a8a = 0.12 0.23 0.54)
  ops.push('0.12 0.23 0.54 rg')
  ops.push(`${x} ${y + h - 38} ${w} 38 re f`)

  // Header text (School Name & EIIN)
  ops.push('BT /F1 8.5 Tf 1 1 1 rg')
  ops.push(`${x + 10} ${y + h - 14} Td (${esc(student.schoolName.toUpperCase().slice(0, 32))}) Tj`)
  ops.push(`0 -10 Td /F1 6.5 Tf (EIIN: ${esc(student.eiin || '108234')}   |   SESSION: ${esc(student.academicYear || '2026')}) Tj`)
  ops.push(`0 -9 Td /F1 6 Tf (STUDENT IDENTITY CARD) Tj ET`)

  // Photo Frame (left side)
  const photoX = x + 12
  const photoY = y + 26
  const photoW = 54
  const photoH = 68
  ops.push('0.93 0.95 0.98 rg') // light blue-gray bg
  ops.push(`${photoX} ${photoY} ${photoW} ${photoH} re f`)
  ops.push('0.7 0.75 0.85 RG 0.5 w')
  ops.push(`${photoX} ${photoY} ${photoW} ${photoH} re s`)

  // Photo placeholder icon / text
  ops.push('BT /F1 7.5 Tf 0.4 0.45 0.55 rg')
  ops.push(`${photoX + 13} ${photoY + 31} Td (PHOTO) Tj ET`)

  // Student Info Details (right of photo)
  const infoX = x + 74
  const sid = student.studentId || generateStudentId(student.rollNo, student.academicYear, student.id)
  const bg = formatBloodGroup(student.bloodGroup)

  ops.push('BT /F1 9 Tf 0.08 0.12 0.2 rg') // Dark navy font for name
  ops.push(`${infoX} ${y + 82} Td (${esc(student.studentName.slice(0, 24))}) Tj`)

  ops.push('0 -13 Td /F1 7 Tf 0.25 0.3 0.4 rg')
  ops.push(`(ID: ${esc(sid)}) Tj`)

  ops.push('0 -11 Td')
  ops.push(`(Class: ${esc(student.className || 'General')}   Roll: ${esc(student.rollNo || '-')}) Tj`)

  if (student.dob) {
    ops.push('0 -11 Td')
    ops.push(`(DOB: ${esc(student.dob)}) Tj`)
  }

  // Blood group pill / badge
  ops.push('ET')
  ops.push('0.85 0.15 0.15 rg') // Red blood group badge
  ops.push(`${infoX} ${y + 26} 72 13 re f`)
  ops.push('BT /F1 6.5 Tf 1 1 1 rg')
  ops.push(`${infoX + 6} ${y + 30} Td (Blood Group: ${esc(bg)}) Tj ET`)

  // Bottom card footer bar
  ops.push('0.95 0.96 0.98 rg')
  ops.push(`${x} ${y} ${w} 18 re f`)
  ops.push('0.85 0.88 0.92 RG 0.5 w')
  ops.push(`${x} ${y + 18} m ${x + w} ${y + 18} l s`)

  ops.push('BT /F1 6 Tf 0.35 0.4 0.5 rg')
  ops.push(`${x + 10} ${y + 6} Td (Valid Until: ${esc(student.validUntil || '31-12-2026')}) Tj`)
  ops.push(`${x + 165} ${y + 6} Td (EduOS Verified) Tj ET`)

  ops.push('Q')
  return ops.join('\n')
}

/**
 * Draws a single ID card (Back layout) at the specified origin (x, y).
 * Card dimensions: width = 243 pt, height = 153 pt (CR80 standard).
 */
function drawBackCard(student: StudentIdCardData, x: number, y: number): string {
  const w = 243
  const h = 153
  const ops: string[] = []

  ops.push('q')
  // Background & border
  ops.push('1 1 1 rg')
  ops.push(`${x} ${y} ${w} ${h} re f`)
  ops.push('0.8 0.82 0.88 RG 0.75 w')
  ops.push(`${x} ${y} ${w} ${h} re s`)

  // Top header bar
  ops.push('0.2 0.25 0.35 rg')
  ops.push(`${x} ${y + h - 22} ${w} 22 re f`)
  ops.push('BT /F1 7.5 Tf 1 1 1 rg')
  ops.push(`${x + 10} ${y + h - 15} Td (EMERGENCY INFORMATION & TERMS) Tj ET`)

  // Guardian & Emergency Contact Info
  ops.push('BT /F1 7 Tf 0.15 0.18 0.25 rg')
  ops.push(`${x + 10} ${y + h - 37} Td (Guardian: ${esc(student.guardianName || 'Parent / Legal Guardian')}) Tj`)
  ops.push(`0 -11 Td (Emergency Tel: ${esc(student.guardianPhone || '+880 1700-000000')}) Tj`)
  ops.push(`0 -11 Td (Address: ${esc(student.schoolAddress || 'Dhaka, Bangladesh')}) Tj`)
  ops.push('ET')

  // Code of conduct / Notice
  ops.push('BT /F1 5.5 Tf 0.4 0.45 0.5 rg')
  ops.push(`${x + 10} ${y + 68} Td (This card is property of the institution and is non-transferable.) Tj`)
  ops.push(`0 -8 Td (Must be displayed during school hours. If found, return to school office.) Tj`)
  ops.push('ET')

  // QR Code vector matrix (left bottom)
  const qrUrl = student.verificationUrl || `https://eduos.app/verify/${student.id}`
  const qrMatrix = generateQrPattern(qrUrl)
  const qrX = x + 12
  const qrY = y + 14
  ops.push(renderQrCodePdf(qrMatrix, qrX, qrY, 1.6))

  // Authorized Signature Line (right bottom)
  const sigX = x + 130
  ops.push('0.3 0.35 0.45 RG 0.75 w')
  ops.push(`${sigX} ${y + 26} m ${sigX + 95} ${y + 26} l s`)
  ops.push('BT /F1 6.5 Tf 0.2 0.25 0.35 rg')
  ops.push(`${sigX + 10} ${y + 16} Td (Headmaster / Principal) Tj ET`)

  ops.push('Q')
  return ops.join('\n')
}

/**
 * Generates an official printable Single Student ID Card PDF (Front & Back) on an A4 sheet.
 * Shows both Front and Back side-by-side with cutting guidelines and instructions.
 */
export function createSingleStudentIdCardPdf(student: StudentIdCardData): Uint8Array {
  const streamOps: string[] = [
    // A4 Header info
    'BT /F1 15 Tf 40 790 Td (' + esc(student.schoolName.toUpperCase()) + ') Tj',
    '0 -18 Td /F1 11 Tf (OFFICIAL STUDENT IDENTITY CARD - CR80 FORMAT) Tj',
    '0 -14 Td /F1 8.5 Tf (Student: ' +
      esc(student.studentName) +
      '   |   Class: ' +
      esc(student.className || '-') +
      '   |   Roll: ' +
      esc(student.rollNo || '-') +
      '   |   Academic Year: ' +
      esc(student.academicYear) +
      ') Tj',
    '0 -10 Td (------------------------------------------------------------------------------------------------------------------------------------------------------) Tj',
    '0 -14 Td /F1 8 Tf (PRINTING INSTRUCTIONS: Print on 250+ GSM card paper or PVC sheet at 100% scale. Cut along dotted borders.) Tj',
    'ET',
  ]

  // Front and Back cards centered side-by-side
  // A4 width = 595. Card w = 243. Two cards = 486. Gap = 25. Margin = (595 - (486 + 25)) / 2 = 42.
  const cardY = 560
  const frontX = 42
  const backX = 42 + 243 + 25

  // Dashed cutting line around both cards
  streamOps.push('q [3 3] 0 d 0.6 0.65 0.7 RG 0.5 w')
  streamOps.push(`${frontX - 4} ${cardY - 4} 251 161 re s`)
  streamOps.push(`${backX - 4} ${cardY - 4} 251 161 re s`)
  streamOps.push('Q')

  // Label banners above cards
  streamOps.push('BT /F1 9 Tf 0.2 0.3 0.5 rg')
  streamOps.push(`${frontX} ${cardY + 165} Td (CARD FRONT) Tj`)
  streamOps.push(`${backX} ${cardY + 165} Td (CARD BACK) Tj ET`)

  // Render cards
  streamOps.push(drawFrontCard(student, frontX, cardY))
  streamOps.push(drawBackCard(student, backX, cardY))

  // Footer notes
  streamOps.push(
    'BT /F1 8 Tf 0.4 0.45 0.5 rg 40 480 Td (Verification Link: ' +
      esc(student.verificationUrl || `https://eduos.app/verify/${student.id}`) +
      ') Tj',
    '0 -14 Td (Generated electronically via EduOS Bangladesh Education Management System.) Tj ET',
  )

  const content = streamOps.join('\n')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
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
 * Generates an official Batch Printable A4 Sheet PDF (8 cards per page: 2 columns x 4 rows).
 * Includes dashed precision cutting guide lines for rotary trimmers or guillotines.
 */
export function createBatchStudentIdCardsPdf(
  students: StudentIdCardData[],
  options?: {
    schoolName?: string
    eiin?: string
    academicYear?: string
    side?: 'front' | 'back'
  },
): Uint8Array {
  const cardsPerPage = 8
  const totalPages = Math.max(1, Math.ceil(students.length / cardsPerPage))
  const schoolName = options?.schoolName || (students[0]?.schoolName ?? 'EduOS School')
  const academicYear = options?.academicYear || (students[0]?.academicYear ?? '2026')
  const side = options?.side || 'front'

  // Grid coordinates for 8 cards (2 columns x 4 rows)
  // Page: 595 x 842. Card: 243 x 153.
  // Col 0: X = 36, Col 1: X = 316. (Width = 243, Gap = 37, Margins = 36)
  // Rows top to bottom: Y = 620, 445, 270, 95. (Height = 153, Gap = 22)
  const colX = [36, 316]
  const rowY = [620, 445, 270, 95]

  const pageContents: string[] = []

  for (let p = 0; p < totalPages; p++) {
    const pageStudents = students.slice(p * cardsPerPage, (p + 1) * cardsPerPage)
    const streamOps: string[] = [
      // Top batch sheet header
      'BT /F1 12 Tf 36 810 Td (' + esc(schoolName.toUpperCase()) + ' - BATCH STUDENT ID CARDS) Tj',
      '0 -12 Td /F1 8 Tf (Session: ' +
        esc(academicYear) +
        '   |   Layout: 8 Cards per Sheet   |   Side: ' +
        esc(side.toUpperCase()) +
        '   |   Page ' +
        (p + 1) +
        ' of ' +
        totalPages +
        ') Tj',
      'ET',
    ]

    // Draw cutting guidelines across sheet
    streamOps.push('q [2 2] 0 d 0.7 0.75 0.8 RG 0.5 w')
    // Vertical center cut line
    streamOps.push('297 80 m 297 780 l s')
    // Horizontal cut lines
    streamOps.push('30 609 m 565 609 l s')
    streamOps.push('30 434 m 565 434 l s')
    streamOps.push('30 259 m 565 259 l s')
    streamOps.push('Q')

    // Place cards into 2x4 slots
    pageStudents.forEach((student, idx) => {
      const col = idx % 2
      const row = Math.floor(idx / 2)
      const x = colX[col]
      const y = rowY[row]

      if (side === 'back') {
        streamOps.push(drawBackCard(student, x, y))
      } else {
        streamOps.push(drawFrontCard(student, x, y))
      }
    })

    pageContents.push(streamOps.join('\n'))
  }

  // Construct Multi-Page PDF-1.4
  // Page object numbers:
  // 1: Catalog
  // 2: Pages root
  // 3 ... 2 + totalPages: Page objects
  // (3 + totalPages) ... (2 + 2 * totalPages): Content streams
  // Font object: (3 + 2 * totalPages)
  const pageObjStart = 3
  const contentObjStart = pageObjStart + totalPages
  const fontObjNum = contentObjStart + totalPages

  const pageKids = Array.from({ length: totalPages }, (_, i) => `${pageObjStart + i} 0 R`).join(' ')

  const objects: string[] = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pageKids}] /Count ${totalPages} >>`,
  ]

  // Add each page object
  for (let p = 0; p < totalPages; p++) {
    const contentRef = `${contentObjStart + p} 0 R`
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontObjNum} 0 R >> >> /Contents ${contentRef} >>`,
    )
  }

  // Add each content stream
  for (let p = 0; p < totalPages; p++) {
    const stream = pageContents[p]
    objects.push(`<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`)
  }

  // Font object
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')

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
