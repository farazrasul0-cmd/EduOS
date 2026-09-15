import type { CertificateRecord } from './certificates'

const esc = (value: string) =>
  value.replace(/[^\x20-\x7E]/g, '?').replace(/([\\()])/g, '\\$1')

export interface SchoolDetails {
  schoolName: string
  eiin?: string
  address?: string
  phone?: string
  email?: string
  establishedYear?: string
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
 * Generates an official vector A4 Portrait (595 x 842 pt) Transfer Certificate (TC / ছাড়পত্র).
 */
export function createTransferCertificatePdf(
  record: CertificateRecord,
  school: SchoolDetails,
): Uint8Array {
  const lines: string[] = [
    // Double Institutional Security Border
    'q 0.15 0.25 0.4 RG 1.5 w 30 30 535 782 re s Q',
    'q 0.5 0.6 0.75 RG 0.75 w 36 36 523 770 re s Q',

    // School Header
    'BT /F1 16 Tf 0.1 0.15 0.3 rg 60 760 Td (' + esc(school.schoolName.toUpperCase()) + ') Tj',
    '0 -16 Td /F1 9 Tf 0.3 0.35 0.45 rg (ESTD: ' +
      esc(school.establishedYear || '1995') +
      '   |   EIIN: ' +
      esc(school.eiin || '108234') +
      '   |   ' +
      esc(school.address || 'Dhaka, Bangladesh') +
      ') Tj',
    '0 -14 Td /F1 8.5 Tf 0.4 0.45 0.5 rg (Affiliated with Board of Intermediate & Secondary Education, Dhaka) Tj',
    '0 -12 Td (---------------------------------------------------------------------------------------------------------------------------------) Tj',
    'ET',

    // Certificate Title Box
    'q 0.94 0.96 0.99 rg 170 675 255 28 re f 0.3 0.45 0.7 RG 1 w 170 675 255 28 re s Q',
    'BT /F1 12.5 Tf 0.1 0.2 0.5 rg 185 684 Td (TRANSFER CERTIFICATE  /  TC) Tj ET',

    // Tracking Serial & Issue Date
    'BT /F1 9 Tf 0.2 0.25 0.35 rg',
    '60 645 Td (Certificate Sl No: ' + esc(record.serialNo) + ') Tj',
    '330 0 Td (Issue Date: ' + esc(record.issueDate) + ') Tj',
    'ET',

    // Formatted Body Lines
    'BT /F1 9.5 Tf 0.15 0.2 0.3 rg',
    '60 610 Td (1. Full Name of Student: ' + esc(record.studentName) + ') Tj',
    '0 -20 Td (2. Father\'s Name: ' + esc(record.fatherName) + ') Tj',
    '0 -20 Td (3. Mother\'s Name: ' + esc(record.motherName) + ') Tj',
    '0 -20 Td (4. Digital Birth Registration No: ' + esc(record.birthRegNo) + ') Tj',
    '0 -20 Td (5. Date of Birth (Christian Era): ' + esc(record.dateOfBirth) + ') Tj',
    '0 -20 Td (6. Class in which the student was reading: ' + esc(record.className) + '   |   Section: ' + esc(record.section) + '   |   Roll: ' + esc(record.rollNo) + ') Tj',
    '0 -20 Td (7. Date of Admission into this Institution: ' + esc(record.admissionDate || '2022-01-10') + ') Tj',
    '0 -20 Td (8. Date of Student Leaving the School: ' + esc(record.dateOfLeaving || record.issueDate) + ') Tj',
    '0 -20 Td (9. Reason for Leaving: ' + esc(record.reasonForLeaving || 'Guardian employment transfer / relocation') + ') Tj',
    '0 -20 Td (10. Student Conduct and Character: ' + esc(record.conduct || 'Good') + ') Tj',
    '0 -20 Td (11. Promotion Status / Academic Standing: ' + esc(record.promotedToClass || 'Eligible for promotion') + ') Tj',
    '0 -20 Td (12. Clearance of Institutional Dues: ' + esc(record.duesClearedUpTo || 'All dues cleared up to date') + ') Tj',
    'ET',

    // Remarks box
    'q 0.98 0.98 0.98 rg 60 310 475 36 re f 0.85 0.88 0.9 RG 0.5 w 60 310 475 36 re s Q',
    'BT /F1 8.5 Tf 0.3 0.35 0.4 rg',
    '70 330 Td (Certified that the above particulars are true and verified from the institutional admission register.) Tj',
    '0 -13 Td (The student leaves the institution with our best wishes for future academic progress.) Tj',
    'ET',

    // Official Signatures
    'BT /F1 8.5 Tf 0.25 0.3 0.4 rg',
    '65 140 Td (____________________________) Tj',
    '0 -13 Td (Prepared By: Head Clerk) Tj',
    '155 13 Td (____________________________) Tj',
    '0 -13 Td (Checked By: Class Teacher) Tj',
    '155 13 Td (____________________________) Tj',
    '0 -13 Td (Headmaster / Principal Signature) Tj',
    'ET',

    // Seal box placeholder
    'q 0.8 0.85 0.9 RG 0.5 w 410 75 90 40 re s Q',
    'BT /F1 7.5 Tf 0.5 0.55 0.6 rg 428 92 Td ([ SCHOOL SEAL ]) Tj ET',

    'BT /F1 7 Tf 0.55 0.6 0.65 rg 60 50 Td (Official Transfer Certificate issued by EduOS School Management System. Verify online at eduos.ac.bd/verify/' + esc(record.serialNo) + ') Tj ET',
  ]

  return assemblePdf(lines.join('\n'), '[0 0 595 842]')
}

/**
 * Generates an official vector A4 Portrait (595 x 842 pt) Academic Testimonial (প্রশংসাপত্র).
 */
export function createTestimonialPdf(
  record: CertificateRecord,
  school: SchoolDetails,
): Uint8Array {
  const lines: string[] = [
    // Double Institutional Security Border
    'q 0.15 0.35 0.25 RG 1.5 w 30 30 535 782 re s Q',
    'q 0.6 0.75 0.65 RG 0.75 w 36 36 523 770 re s Q',

    // School Header
    'BT /F1 16 Tf 0.1 0.25 0.15 rg 60 760 Td (' + esc(school.schoolName.toUpperCase()) + ') Tj',
    '0 -16 Td /F1 9 Tf 0.3 0.35 0.45 rg (EIIN: ' +
      esc(school.eiin || '108234') +
      '   |   ' +
      esc(school.address || 'Dhaka, Bangladesh') +
      ') Tj',
    '0 -14 Td /F1 8.5 Tf 0.35 0.4 0.45 rg (Recognized by the Ministry of Education & BISE, ' +
      esc(record.boardName || 'Dhaka') +
      ') Tj',
    '0 -12 Td (---------------------------------------------------------------------------------------------------------------------------------) Tj',
    'ET',

    // Title Box
    'q 0.93 0.97 0.94 rg 145 675 305 28 re f 0.2 0.5 0.3 RG 1 w 145 675 305 28 re s Q',
    'BT /F1 12 Tf 0.1 0.35 0.2 rg 165 684 Td (ACADEMIC TESTIMONIAL  /  CHARACTER CERTIFICATE) Tj ET',

    // Serial & Date
    'BT /F1 9 Tf 0.2 0.25 0.35 rg',
    '60 645 Td (Testimonial Sl No: ' + esc(record.serialNo) + ') Tj',
    '340 0 Td (Issue Date: ' + esc(record.issueDate) + ') Tj',
    'ET',

    // Testimonial Narrative Paragraph
    'BT /F1 10 Tf 0.15 0.2 0.25 rg',
    '60 600 Td (This is to certify that ' + esc(record.studentName) + ') Tj',
    '0 -18 Td (Son / Daughter of ' + esc(record.fatherName) + ' and ' + esc(record.motherName) + ') Tj',
    '0 -18 Td (was a regular student of this recognized institution in Class ' + esc(record.className) + '.) Tj',
    '0 -24 Td (He / She appeared at the Secondary School Certificate (SSC) Examination) Tj',
    '0 -18 Td (held in the year ' +
      esc(String(record.passingYear || 2026)) +
      ' under the Board of Intermediate & Secondary Education, ' +
      esc(record.boardName || 'Dhaka') +
      '.) Tj',
    '0 -24 Td (Examination Credentials:) Tj',
    '20 -18 Td (/F1 9.5 Tf Board Roll Number: ' + esc(record.boardRollNo || '619283') + ') Tj',
    '0 -16 Td (Registration Number: ' + esc(record.boardRegNo || '2119283921') + '   |   Session: ' + esc(record.session || '2024-2025') + ') Tj',
    '0 -16 Td (Grade Point Average: GPA ' +
      esc(String(record.gpaAchieved || '5.00')) +
      '   |   Letter Grade: ' +
      esc(record.gradeAchieved || 'A+') +
      ') Tj',
    '-20 -24 Td /F1 10 Tf (Moral Conduct & Discipline Affidavit:) Tj',
    '0 -18 Td (/F1 9.5 Tf To the best of my knowledge and institutional records, he/she bears a good moral character) Tj',
    '0 -15 Td (and pleasant personality. He/She did not take part in any activity subversive of the state) Tj',
    '0 -15 Td (or contrary to institutional discipline during his/her study period here.) Tj',
    '0 -22 Td (Co-Curricular Activities & Achievements: ' + esc(record.activities || 'Scouts, Cultural Club, Debate Forum') + ') Tj',
    '0 -24 Td (/F1 10 Tf I wish him/her every success and a bright future in all academic and personal pursuits.) Tj',
    'ET',

    // Signatures
    'BT /F1 8.5 Tf 0.25 0.3 0.4 rg',
    '65 140 Td (____________________________) Tj',
    '0 -13 Td (Convener: Exam Committee) Tj',
    '330 13 Td (____________________________) Tj',
    '0 -13 Td (Headmaster / Principal Signature) Tj',
    'ET',

    // Seal placeholder
    'q 0.7 0.85 0.75 RG 0.5 w 245 80 95 45 re s Q',
    'BT /F1 7.5 Tf 0.3 0.5 0.35 rg 262 98 Td ([ INSTITUTION SEAL ]) Tj ET',

    'BT /F1 7 Tf 0.55 0.6 0.65 rg 60 50 Td (Authentic institutional testimonial produced via EduOS. Validation serial: ' + esc(record.serialNo) + ') Tj ET',
  ]

  return assemblePdf(lines.join('\n'), '[0 0 595 842]')
}

/**
 * Generates an official vector A4 Portrait (595 x 842 pt) Bonafide Student Certificate (অধ্যয়নরত সনদপত্র).
 */
export function createBonafideCertificatePdf(
  record: CertificateRecord,
  school: SchoolDetails,
): Uint8Array {
  const lines: string[] = [
    // Double Border
    'q 0.2 0.3 0.45 RG 1.5 w 30 30 535 782 re s Q',
    'q 0.65 0.7 0.8 RG 0.75 w 36 36 523 770 re s Q',

    // School Header
    'BT /F1 16 Tf 0.1 0.2 0.35 rg 60 760 Td (' + esc(school.schoolName.toUpperCase()) + ') Tj',
    '0 -16 Td /F1 9 Tf 0.3 0.35 0.45 rg (EIIN: ' +
      esc(school.eiin || '108234') +
      '   |   ' +
      esc(school.address || 'Dhaka, Bangladesh') +
      ') Tj',
    '0 -12 Td (---------------------------------------------------------------------------------------------------------------------------------) Tj',
    'ET',

    // Title Box
    'q 0.95 0.96 0.99 rg 140 680 315 28 re f 0.25 0.4 0.65 RG 1 w 140 680 315 28 re s Q',
    'BT /F1 12 Tf 0.1 0.25 0.5 rg 155 689 Td (TO WHOM IT MAY CONCERN  /  BONAFIDE CERTIFICATE) Tj ET',

    // Serial & Date
    'BT /F1 9 Tf 0.2 0.25 0.35 rg',
    '60 645 Td (Reference No: ' + esc(record.serialNo) + ') Tj',
    '340 0 Td (Issue Date: ' + esc(record.issueDate) + ') Tj',
    'ET',

    // Narrative
    'BT /F1 10.5 Tf 0.15 0.2 0.3 rg',
    '60 600 Td (This is to certify that ' + esc(record.studentName) + ') Tj',
    '0 -20 Td (Son / Daughter of ' + esc(record.fatherName) + ' and ' + esc(record.motherName) + ') Tj',
    '0 -20 Td (bearing Digital Birth Registration No: ' + esc(record.birthRegNo) + ') Tj',
    '0 -20 Td (and Date of Birth: ' + esc(record.dateOfBirth) + ') Tj',
    '0 -24 Td (is a bonafide, regular, and active student of this institution in:) Tj',
    '30 -22 Td (/F1 10 Tf Class: ' + esc(record.className) + '   |   Section: ' + esc(record.section) + '   |   Roll Number: ' + esc(record.rollNo) + ') Tj',
    '0 -18 Td (Academic Session: 2026) Tj',
    '-30 -26 Td /F1 10.5 Tf (Purpose of Certificate Issuance:) Tj',
    '0 -18 Td (/F1 9.5 Tf This certificate is issued upon guardian request for the official purpose of:) Tj',
    '20 -18 Td (/F1 10 Tf "' + esc(record.purpose || 'Official Student Identification & Record') + '") Tj',
    '-20 -24 Td /F1 9.5 Tf (Validity Period: This document is valid for the academic session 2026 or until ' +
      esc(record.validUntil || '2026-12-31') +
      '.) Tj',
    '0 -20 Td (To the best of our knowledge, he/she bears a good moral character.) Tj',
    'ET',

    // Signatures
    'BT /F1 8.5 Tf 0.25 0.3 0.4 rg',
    '65 140 Td (____________________________) Tj',
    '0 -13 Td (Administrative Officer / Head Clerk) Tj',
    '330 13 Td (____________________________) Tj',
    '0 -13 Td (Headmaster / Principal Signature) Tj',
    'ET',

    // Seal placeholder
    'q 0.7 0.8 0.9 RG 0.5 w 410 75 90 40 re s Q',
    'BT /F1 7.5 Tf 0.4 0.5 0.6 rg 428 92 Td ([ SCHOOL SEAL ]) Tj ET',

    'BT /F1 7 Tf 0.55 0.6 0.65 rg 60 50 Td (Verified institutional bonafide record generated by EduOS. Reference: ' + esc(record.serialNo) + ') Tj ET',
  ]

  return assemblePdf(lines.join('\n'), '[0 0 595 842]')
}
