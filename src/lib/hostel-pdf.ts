import type { HostelGatePass, HostelRoom, HostelBoarder } from './hostel'
import { calculateOccupancyRate } from './hostel'

const esc = (value: string) =>
  value.replace(/[^\x20-\x7E]/g, '?').replace(/([\\()])/g, '\\$1')

export interface SchoolDetails {
  schoolName: string
  eiin?: string
  address?: string
  phone?: string
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
 * Generates an official vector A4 Portrait (595 x 842 pt) Hostel Gate Pass / Out-Pass Slip.
 */
export function createHostelGatePassPdf(
  gatePass: HostelGatePass,
  school: SchoolDetails,
): Uint8Array {
  const lines: string[] = [
    // Double Security Border
    'q 0.2 0.35 0.5 RG 1.5 w 30 30 535 782 re s Q',
    'q 0.6 0.7 0.8 RG 0.75 w 36 36 523 770 re s Q',

    // School Header
    'BT /F1 16 Tf 0.1 0.15 0.3 rg 60 760 Td (' + esc(school.schoolName.toUpperCase()) + ') Tj',
    '0 -16 Td /F1 9 Tf 0.3 0.35 0.45 rg (EIIN: ' +
      esc(school.eiin || '108234') +
      '   |   ' +
      esc(school.address || 'Dhaka, Bangladesh') +
      (school.phone ? '   |   Phone: ' + esc(school.phone) : '') +
      ') Tj',
    '0 -14 Td /F1 8.5 Tf 0.4 0.45 0.5 rg (RESIDENTIAL DORMITORY & HOSTEL ADMINISTRATION OFFICE) Tj',
    '0 -12 Td (---------------------------------------------------------------------------------------------------------------------------------) Tj',
    'ET',

    // Title Banner
    'q 0.94 0.96 0.99 rg 150 675 295 28 re f 0.25 0.45 0.7 RG 1 w 150 675 295 28 re s Q',
    'BT /F1 12.5 Tf 0.1 0.2 0.5 rg 170 684 Td (HOSTEL STUDENT OUT-PASS / GATE PASS) Tj ET',

    // Pass Reference & Issue Date
    'BT /F1 9 Tf 0.2 0.25 0.35 rg',
    '60 645 Td (Pass Number: ' + esc(gatePass.passNo) + ') Tj',
    '330 0 Td (Issued Date: ' + esc(gatePass.issueDate) + ') Tj',
    'ET',

    // Student & Room Details Box
    'q 0.96 0.97 0.99 rg 55 575 485 55 re f 0.75 0.8 0.9 RG 0.5 w 55 575 485 55 re s Q',
    'BT /F1 9.5 Tf 0.15 0.2 0.3 rg',
    '65 612 Td (Student Name: ' + esc(gatePass.studentName) + '  (' + esc(gatePass.studentId) + ')) Tj',
    '0 -16 Td (Hostel Building: ' + esc(gatePass.buildingName) + '   |   Room: ' + esc(gatePass.roomNo) + ') Tj',
    '0 -16 Td (Guardian Verified Contact Phone: ' + esc(gatePass.guardianPhone) + ') Tj',
    'ET',

    // Travel & Transit Schedule
    'BT /F1 10 Tf 0.15 0.25 0.4 rg 60 545 Td (OUT-PASS SCHEDULE & DESTINATION DETAILS:) Tj ET',
    'BT /F1 9.5 Tf 0.2 0.25 0.3 rg',
    '65 525 Td (Destination Address: ' + esc(gatePass.destination) + ') Tj',
    '0 -18 Td (Reason for Out-Pass: ' + esc(gatePass.reason) + ') Tj',
    '0 -18 Td (Scheduled Departure: ' + esc(gatePass.departureDate) + ' at ' + esc(gatePass.departureTime) + ') Tj',
    '0 -18 Td (Expected Return Curfew: ' + esc(gatePass.expectedReturnDate) + ' before ' + esc(gatePass.expectedReturnTime) + ') Tj',
    '0 -18 Td (Authorization Status: ' + esc(gatePass.status.toUpperCase()) + '  (Approved by: ' + esc(gatePass.approvedBy) + ')) Tj',
    'ET',

    // Disciplinary & Curfew Rules Box
    'q 0.98 0.95 0.95 rg 55 350 485 65 re f 0.85 0.65 0.65 RG 0.5 w 55 350 485 65 re s Q',
    'BT /F1 8.5 Tf 0.5 0.15 0.15 rg',
    '65 398 Td (HOSTEL CURFEW & DISCIPLINARY DIRECTIVES:) Tj',
    '0 -14 Td /F1 8 Tf 0.35 0.2 0.2 rg (1. Boarder must return strictly before the designated curfew time and report to the security desk.) Tj',
    '0 -12 Td (2. Any unauthorized delay will be treated as an institutional breach and reported to guardians.) Tj',
    '0 -12 Td (3. This physical Gate Pass must be presented to Main Security Gate upon exit and re-entry.) Tj',
    'ET',

    // Security Gate Clearance Block
    'q 0.95 0.96 0.98 rg 55 240 485 90 re f 0.7 0.75 0.85 RG 0.5 w 55 240 485 90 re s Q',
    'BT /F1 9 Tf 0.15 0.25 0.4 rg 65 312 Td (CAMPUS SECURITY CHECKPOINT CLEARANCE (MAIN GATE):) Tj ET',
    'BT /F1 8.5 Tf 0.25 0.3 0.35 rg',
    '65 292 Td (Time Out: ___________________     Guard Name: ___________________     Guard Sig: ___________________) Tj',
    '0 -25 Td (Time In:  ___________________     Guard Name: ___________________     Guard Sig: ___________________) Tj',
    '0 -18 Td (Actual Return Status: [  ] On Time   [  ] Delayed / Reported to Warden) Tj',
    'ET',

    // Signatures
    'BT /F1 8.5 Tf 0.25 0.3 0.4 rg',
    '65 110 Td (____________________________) Tj',
    '0 -13 Td (Student Signature) Tj',
    '200 13 Td (____________________________) Tj',
    '0 -13 Td (Hall Provost / Warden) Tj',
    '170 13 Td (____________________________) Tj',
    '0 -13 Td (Headmaster / Principal) Tj',
    'ET',

    // Stamp box
    'q 0.75 0.8 0.9 RG 0.5 w 420 50 90 40 re s Q',
    'BT /F1 7.5 Tf 0.4 0.5 0.6 rg 435 67 Td ([ WARDEN SEAL ]) Tj ET',

    'BT /F1 7 Tf 0.55 0.6 0.65 rg 60 40 Td (Official Hostel Gate Pass generated by EduOS. Verification Serial: ' + esc(gatePass.passNo) + ') Tj ET',
  ]

  return assemblePdf(lines.join('\n'), '[0 0 595 842]')
}

/**
 * Generates an official vector A4 Landscape (842 x 595 pt) Hostel Occupancy & Boarder Register.
 */
export function createHostelOccupancyReportPdf(
  rooms: HostelRoom[],
  boarders: HostelBoarder[],
  school: SchoolDetails,
): Uint8Array {
  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0)
  const totalOccupied = rooms.reduce((sum, r) => sum + r.occupiedBeds, 0)
  const totalVacant = Math.max(0, totalCapacity - totalOccupied)
  const rate = calculateOccupancyRate(totalCapacity, totalOccupied)

  const rows = rooms.slice(0, 14) // Fit cleanly on single Landscape page

  const lines: string[] = [
    // Header
    'BT /F1 15 Tf 0.1 0.15 0.25 rg 50 555 Td (' + esc(school.schoolName.toUpperCase()) + ') Tj',
    '0 -16 Td /F1 9 Tf 0.35 0.4 0.5 rg (EIIN: ' +
      esc(school.eiin || '108234') +
      '   |   ' +
      esc(school.address || 'Dhaka, Bangladesh') +
      '   |   RESIDENTIAL HALL MANAGEMENT) Tj',
    '0 -16 Td /F1 12 Tf 0.12 0.35 0.72 rg (MONTHLY HOSTEL OCCUPANCY & BOARDER ALLOCATION REGISTER) Tj',
    '0 -14 Td /F1 9.5 Tf 0.2 0.25 0.35 rg (Total Capacity: ' +
      esc(String(totalCapacity)) +
      ' Beds   |   Occupied: ' +
      esc(String(totalOccupied)) +
      '   |   Vacant: ' +
      esc(String(totalVacant)) +
      '   |   Occupancy Rate: ' +
      esc(String(rate)) +
      '%   |   Date: ' +
      new Date().toISOString().slice(0, 10) +
      ') Tj',
    '0 -10 Td (---------------------------------------------------------------------------------------------------------------------------------------------------------------------) Tj',
    'ET',

    // Table Header Bar (Landscape width 742 pt, left 50, right 792)
    'q 0.93 0.95 0.98 rg 50 460 742 22 re f 0.75 0.8 0.88 RG 0.5 w 50 460 742 22 re s Q',
    'BT /F1 8.5 Tf 0.1 0.15 0.25 rg 55 467 Td (Room) Tj 55 0 Td (Hostel Building Name) Tj 160 0 Td (Type & Gender) Tj 95 0 Td (Capacity) Tj 65 0 Td (Occupied) Tj 60 0 Td (Vacant) Tj 65 0 Td (Seat Rent) Tj 85 0 Td (Active Boarders) Tj 110 0 Td (Status) Tj ET',
  ]

  let y = 440
  rows.forEach((rm, index) => {
    if (index % 2 === 1) {
      lines.push(`q 0.97 0.98 0.99 rg 50 ${y - 3} 742 16 re f Q`)
    }

    const roomBoarders = boarders
      .filter((b) => b.roomNo === rm.roomNo && b.buildingName === rm.buildingName)
      .map((b) => b.studentName.split(' ')[0])
      .join(', ')

    const vacant = Math.max(0, rm.capacity - rm.occupiedBeds)
    const status = vacant === 0 ? 'FULL' : `${vacant} VACANT`

    lines.push(
      'BT /F1 8 Tf 0.2 0.25 0.3 rg',
      `55 ${y} Td (${esc(rm.roomNo)}) Tj`,
      `110 ${y} Td (${esc(rm.buildingName.slice(0, 24))}) Tj`,
      `270 ${y} Td (${esc(rm.roomType.toUpperCase())} [${rm.gender.toUpperCase()}]) Tj`,
      `365 ${y} Td (${esc(String(rm.capacity))}) Tj`,
      `430 ${y} Td (${esc(String(rm.occupiedBeds))}) Tj`,
      `490 ${y} Td (${esc(String(vacant))}) Tj`,
      `550 ${y} Td (BDT ${esc(rm.monthlySeatRent.toLocaleString())}) Tj`,
      `635 ${y} Td (${esc(roomBoarders.slice(0, 20) || 'None')}) Tj`,
      `745 ${y} Td (${esc(status)}) Tj`,
      'ET',
    )
    y -= 18
  })

  // Grand Total Summary Bar
  lines.push(
    `q 0.9 0.93 0.98 rg 50 ${y - 4} 742 22 re f 0.6 0.7 0.85 RG 0.5 w 50 ${y - 4} 742 22 re s Q`,
    'BT /F1 9 Tf 0.1 0.2 0.4 rg',
    `55 ${y + 3} Td (HOSTEL CAPACITY TOTALS: ${esc(String(rooms.length))} Rooms) Tj`,
    `365 ${y + 3} Td (${esc(String(totalCapacity))}) Tj`,
    `430 ${y + 3} Td (${esc(String(totalOccupied))}) Tj`,
    `490 ${y + 3} Td (${esc(String(totalVacant))}) Tj`,
    `550 ${y + 3} Td (Rate: ${esc(String(rate))}%) Tj`,
    'ET',
  )

  // Signatures
  lines.push(
    'BT /F1 8.5 Tf 0.3 0.35 0.4 rg',
    '55 70 Td (____________________________________) Tj',
    '0 -12 Td (Prepared By: Hostel Superintendent) Tj',
    '260 12 Td (____________________________________) Tj',
    '0 -12 Td (Verified By: Hall Provost / Warden) Tj',
    '260 12 Td (____________________________________) Tj',
    '0 -12 Td (Approved By: Principal / Headmaster) Tj',
    'ET',
    'BT /F1 7.5 Tf 0.5 0.55 0.6 rg 50 35 Td (Official residential dormitory register generated by EduOS. For institutional inspection and boarding audits.) Tj ET',
  )

  return assemblePdf(lines.join('\n'), '[0 0 842 595]')
}
