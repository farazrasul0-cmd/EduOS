import type { LeaveApplication } from './leave'

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
 * Generates an official vector A4 Portrait (595 x 842 pt) Leave Application Letter.
 * Standard institutional format for Bangladesh secondary and higher secondary institutions.
 */
export function createLeaveApplicationPdf(
  app: LeaveApplication,
  school: SchoolDetails,
): Uint8Array {
  const isTeacher = app.category === 'teacher'
  const recipient = isTeacher
    ? 'The Principal / Headmaster'
    : 'The Headmaster / Principal (Through Class Teacher)'

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
      '   |   ADMINISTRATION WING) Tj',
    '0 -12 Td (---------------------------------------------------------------------------------------------------------------------------------) Tj',
    'ET',

    // Document Title Banner
    'q 0.94 0.96 0.99 rg 50 685 495 24 re f 0.75 0.8 0.9 RG 0.5 w 50 685 495 24 re s Q',
    'BT /F1 11 Tf 0.15 0.25 0.5 rg 60 693 Td (OFFICIAL APPLICATION FOR LEAVE / ছুটির আবেদনপত্র) Tj',
    'ET',

    // Reference & Date
    'BT /F1 9 Tf 0.3 0.35 0.45 rg',
    '50 660 Td (Application Ref No: ' + esc(app.applicationNo) + ') Tj',
    '330 0 Td (Date: ' + esc(app.appliedDate || new Date().toISOString().slice(0, 10)) + ') Tj',
    'ET',

    // Addressee
    'BT /F1 9.5 Tf 0.15 0.2 0.3 rg',
    '50 625 Td (To,) Tj',
    '0 -14 Td (' + esc(recipient) + ') Tj',
    '0 -14 Td (' + esc(school.schoolName) + ') Tj',
    '0 -14 Td (' + esc(school.address || 'Dhaka, Bangladesh') + ') Tj',
    'ET',

    // Subject
    'BT /F1 10 Tf 0.1 0.15 0.35 rg',
    '50 555 Td (Subject: Prayer for leave of absence from ' +
      esc(app.startDate) +
      ' to ' +
      esc(app.endDate) +
      ' (' +
      app.daysCount +
      ' working days)) Tj',
    'ET',

    // Salutation & Body
    'BT /F1 9.5 Tf 0.2 0.25 0.3 rg',
    '50 525 Td (Sir / Madam,) Tj',
    '0 -16 Td (I beg most respectfully to state that I am ' +
      esc(app.applicantName) +
      ' (' +
      esc(app.designationOrClass) +
      ') of your esteemed) Tj',
    '0 -15 Td (institution. Due to ' +
      esc(app.reason) +
      ', I am unable to attend my duties/classes) Tj',
    '0 -15 Td (during the period from ' +
      esc(app.startDate) +
      ' to ' +
      esc(app.endDate) +
      ' consisting of ' +
      app.daysCount +
      ' working day(s).) Tj',
    '0 -20 Td (I therefore pray and hope that you would be kind enough to grant me leave of absence for those) Tj',
    '0 -15 Td (days only and oblige thereby.) Tj',
    'ET',

    // Details Box
    'q 0.96 0.97 0.98 rg 50 360 495 65 re f 0.75 0.8 0.85 RG 0.5 w 50 360 495 65 re s Q',
    'BT /F1 8.5 Tf 0.2 0.25 0.35 rg',
    '60 405 Td (Leave Category: ' + esc(app.category.toUpperCase()) + ' LEAVE) Tj',
    '230 0 Td (Leave Classification: ' + esc(app.leaveType.toUpperCase()) + ') Tj',
    '60 385 Td (Total Duration: ' + app.daysCount + ' Working Days [' + esc(app.startDate) + ' to ' + esc(app.endDate) + ']) Tj',
  ]

  if (isTeacher && app.substituteStaffName) {
    lines.push('60 368 Td (Designated Class Substitute: ' + esc(app.substituteStaffName) + ') Tj')
  } else if (!isTeacher && app.guardianContact) {
    lines.push('60 368 Td (Guardian Contact Phone: ' + esc(app.guardianContact) + ') Tj')
  }

  lines.push('ET')

  // Applicant Signature Block
  lines.push(
    'BT /F1 9 Tf 0.2 0.25 0.3 rg',
    '340 280 Td (Yours obediently,) Tj',
    '0 -28 Td (________________________________) Tj',
    '0 -13 Td (' + esc(app.applicantName) + ') Tj',
    '0 -12 Td (' + esc(app.designationOrClass) + ') Tj',
    'ET',
  )

  // Recommendation & Action Block (Class Teacher / Dept Head & Principal)
  lines.push(
    'q 0.93 0.95 0.97 rg 50 85 495 125 re f 0.65 0.7 0.8 RG 0.5 w 50 85 495 125 re s Q',
    'BT /F1 9 Tf 0.1 0.2 0.4 rg 60 190 Td (INSTITUTIONAL RECOMMENDATION & SANCTION RECORD) Tj ET',
    'BT /F1 8.5 Tf 0.25 0.3 0.35 rg',
    '60 165 Td (Status: ' + (app.status === 'approved' ? 'APPROVED & SANCTIONED' : app.status === 'rejected' ? 'REJECTED' : 'PENDING REVIEW') + ') Tj',
    '250 0 Td (Action Date: ' + esc(app.actionDate || 'Pending') + ') Tj',
    '60 145 Td (Remarks: ' + esc(app.approvalRemarks || 'Recommended for sanction per institutional rules.') + ') Tj',
    'ET',
    'BT /F1 8 Tf 0.3 0.35 0.4 rg',
    '60 102 Td (______________________________) Tj',
    '0 -12 Td (Class Teacher / Section Head) Tj',
    '330 12 Td (______________________________) Tj',
    '0 -12 Td (Headmaster / Principal Seal) Tj',
    'ET',
  )

  return assemblePdf(lines.join('\n'))
}

/**
 * Generates an official vector A4 Portrait (595 x 842 pt) Leave Sanction Order / Certificate.
 */
export function createLeaveSanctionOrderPdf(
  app: LeaveApplication,
  school: SchoolDetails,
): Uint8Array {
  const lines: string[] = [
    // Classical Certificate Border
    'q 0.1 0.3 0.5 RG 1.5 w 30 30 535 782 re s Q',
    'q 0.6 0.75 0.85 RG 0.5 w 35 35 525 772 re s Q',

    // School Header
    'BT /F1 15 Tf 0.1 0.15 0.3 rg 50 760 Td (' + esc(school.schoolName.toUpperCase()) + ') Tj',
    '0 -15 Td /F1 9 Tf 0.35 0.4 0.5 rg (EIIN: ' +
      esc(school.eiin || '108234') +
      '   |   ' +
      esc(school.address || 'Dhaka, Bangladesh') +
      '   |   OFFICE OF THE PRINCIPAL) Tj',
    '0 -12 Td (---------------------------------------------------------------------------------------------------------------------------------) Tj',
    'ET',

    // Sanction Title Banner
    'q 0.92 0.96 0.94 rg 50 685 495 26 re f 0.6 0.8 0.7 RG 0.75 w 50 685 495 26 re s Q',
    'BT /F1 12 Tf 0.1 0.45 0.25 rg 140 693 Td (OFFICIAL LEAVE SANCTION ORDER / ছুটি মঞ্জুরি আদেশ) Tj',
    'ET',

    // Metadata Row
    'BT /F1 9 Tf 0.3 0.35 0.4 rg',
    '50 655 Td (Order Memo No: SO-' + esc(app.applicationNo) + ') Tj',
    '350 0 Td (Sanction Date: ' + esc(app.actionDate || new Date().toISOString().slice(0, 10)) + ') Tj',
    'ET',

    // Formal Sanction Notification
    'BT /F1 10 Tf 0.15 0.2 0.3 rg',
    '50 615 Td (OFFICE MEMORANDUM) Tj',
    'ET',

    'BT /F1 9.5 Tf 0.2 0.25 0.3 rg',
    '50 585 Td (In accordance with the Institutional Service & Leave Regulations, leave of absence has been formally) Tj',
    '0 -16 Td (SANCTIONED in favor of the following individual:) Tj',
    'ET',

    // Examinee / Teacher Profile Box
    'q 0.95 0.97 0.99 rg 50 440 495 110 re f 0.75 0.8 0.9 RG 0.5 w 50 440 495 110 re s Q',
    'BT /F1 9 Tf 0.15 0.25 0.4 rg',
    '65 525 Td (Individual Name: ' + esc(app.applicantName) + ') Tj',
    '280 0 Td (ID / Roll No: ' + esc(app.applicantId) + ') Tj',
    '65 505 Td (Designation / Class: ' + esc(app.designationOrClass) + ') Tj',
    '280 0 Td (Category: ' + esc(app.category.toUpperCase()) + ') Tj',
    '65 485 Td (Type of Leave: ' + esc(app.leaveType.toUpperCase()) + ' LEAVE) Tj',
    '280 0 Td (Sanctioned Period: ' + app.daysCount + ' Working Days) Tj',
    '65 465 Td (Date Range: ' + esc(app.startDate) + ' to ' + esc(app.endDate) + ') Tj',
    '280 0 Td (Attendance Status: EXCUSED / LEAVE [L]) Tj',
    'ET',

    // Terms and Conditions
    'BT /F1 9 Tf 0.2 0.25 0.3 rg',
    '50 405 Td (Terms & Directives:) Tj',
    '0 -15 Td (1. The sanctioned period shall be recorded in the official attendance register as LEAVE.) Tj',
    '0 -15 Td (2. Student collegiate examination eligibility quota shall not be penalized for this excused absence.) Tj',
    '0 -15 Td (3. Teacher duties during the leave period shall be covered by the designated substitute staff.) Tj',
    '0 -15 Td (4. The applicant must resume duty / classes promptly on the next working day following expiry.) Tj',
    'ET',

    // Remarks
    'BT /F1 8.5 Tf 0.35 0.4 0.45 rg',
    '50 310 Td (Administrative Remarks: ' + esc(app.approvalRemarks || 'Sanctioned per submitted prayer and institutional authorization.') + ') Tj',
    'ET',

    // Principal Sign-off & Seal Box
    'BT /F1 9 Tf 0.2 0.25 0.35 rg',
    '340 180 Td (By Order of the Governing Body / Authority) Tj',
    '0 -35 Td (____________________________________) Tj',
    '0 -14 Td (Headmaster / Principal / অধ্যক্ষ) Tj',
    '0 -12 Td (' + esc(school.schoolName) + ') Tj',
    'ET',

    // Verification Seal Note
    'q 0.9 0.93 0.98 rg 50 65 200 45 re f 0.7 0.75 0.85 RG 0.5 w 50 65 200 45 re s Q',
    'BT /F1 7.5 Tf 0.2 0.3 0.5 rg',
    '60 92 Td (OFFICIAL INSTITUTIONAL SEAL) Tj',
    '60 77 Td (Verified electronically via EduOS) Tj',
    'ET',

    'BT /F1 7 Tf 0.5 0.55 0.6 rg 50 38 Td (Official Institutional Sanction Order generated by EduOS. Valid for administrative and board records.) Tj ET',
  ]

  return assemblePdf(lines.join('\n'))
}
