import type { AdmissionApplicant } from './admissions'

const esc = (value: string) =>
  value.replace(/[^\x20-\x7E]/g, '?').replace(/([\\()])/g, '\\$1')

export interface SchoolDetails {
  schoolName: string
  eiin?: string
  address?: string
}

/**
 * Generates an official vector A4 Portrait Admission Test Admit Card (595 x 842 pt).
 */
export function createAdmissionAdmitCardPdf(
  applicant: AdmissionApplicant,
  school: SchoolDetails,
): Uint8Array {
  const lines: string[] = [
    // Header
    'BT /F1 16 Tf 50 790 Td (' + esc(school.schoolName.toUpperCase()) + ') Tj',
    '0 -18 Td /F1 9 Tf (EIIN: ' +
      esc(school.eiin || '108234') +
      '   |   ' +
      esc(school.address || 'Dhaka, Bangladesh') +
      ') Tj',
    '0 -16 Td /F1 12 Tf (ADMISSION TEST ADMIT CARD - SESSION ' +
      esc(applicant.academicYear || '2026') +
      ') Tj',
    '0 -12 Td (-------------------------------------------------------------------------------------------------------) Tj',
    'ET',

    // Photo box (right side)
    'q 0.9 0.93 0.97 rg 440 620 95 115 re f 0.7 0.75 0.85 RG 0.75 w 440 620 95 115 re s Q',
    'BT /F1 8 Tf 0.4 0.45 0.55 rg 462 675 Td (AFFIX PHOTO) Tj ET',

    // Candidate details (left side)
    'BT /F1 10 Tf 0.1 0.15 0.25 rg 50 715 Td (Application No: ) Tj /F1 11 Tf (' +
      esc(applicant.applicationNo) +
      ') Tj',
    '0 -18 Td /F1 10 Tf (Admission Roll: ) Tj /F1 11 Tf 0.12 0.35 0.72 rg (' +
      esc(applicant.examRollNo || 'EXM-6001') +
      ') Tj',
    '0 -18 Td /F1 10 Tf 0.1 0.15 0.25 rg (Candidate Name: ' +
      esc(applicant.studentName) +
      ') Tj',
    '0 -16 Td (Applied Class: ' +
      esc(applicant.appliedClass) +
      '     Gender: ' +
      esc(applicant.gender.toUpperCase()) +
      ') Tj',
    '0 -16 Td (Date of Birth: ' +
      esc(applicant.dob) +
      '     Religion: ' +
      esc(applicant.religion.toUpperCase()) +
      ') Tj',
    '0 -16 Td (Guardian Name: ' +
      esc(applicant.guardianName) +
      ') Tj',
    '0 -16 Td (Emergency Phone: ' +
      esc(applicant.guardianPhone) +
      ') Tj',
    '0 -16 Td (Birth Reg No: ' +
      esc(applicant.birthCertificateNo) +
      ') Tj',
    '0 -24 Td (-------------------------------------------------------------------------------------------------------) Tj',

    // Exam Schedule Box
    '0 -20 Td /F1 11 Tf 0.12 0.35 0.72 rg (EXAMINATION SCHEDULE & VENUE DETAILS) Tj',
    '0 -16 Td /F1 9.5 Tf 0.1 0.15 0.25 rg (Examination Date: ' +
      esc(applicant.examDate || '20 November 2026 (Friday)') +
      ') Tj',
    '0 -15 Td (Reporting Time: 09:30 AM     Exam Duration: 10:00 AM - 12:00 PM) Tj',
    '0 -15 Td (Examination Venue: ' +
      esc(applicant.examVenue || 'Main Academic Building, Hall Room 302') +
      ') Tj',
    '0 -20 Td (-------------------------------------------------------------------------------------------------------) Tj',

    // Instructions to Candidate
    '0 -18 Td /F1 9 Tf (INSTRUCTIONS TO THE CANDIDATE:) Tj',
    '0 -13 Td /F1 8 Tf 0.3 0.35 0.4 rg (1. Candidate must bring this printed Admit Card to gain entrance to the exam hall.) Tj',
    '0 -12 Td (2. Candidates must report at least 30 minutes before the scheduled exam start time.) Tj',
    '0 -12 Td (3. Bring black ballpoint pen, 2B pencil, eraser, and ruler. No borrowing is permitted.) Tj',
    '0 -12 Td (4. Mobile phones, smart watches, electronic calculators, and bags are strictly forbidden.) Tj',
    '0 -12 Td (5. Any unfair means or impersonation will lead to immediate cancellation of candidature.) Tj',

    // Signatures
    '0 -45 Td /F1 9 Tf 0.2 0.25 0.35 rg (_____________________________                                                         _____________________________) Tj',
    '0 -12 Td /F1 8 Tf (    Candidate Signature                                                                        Convener / Headmaster Signature) Tj',
    'ET',
  ]

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
 * Generates an official vector A4 Portrait Admission Offer & Fee Voucher (595 x 842 pt).
 */
export function createAdmissionFeeVoucherPdf(
  applicant: AdmissionApplicant,
  school: SchoolDetails,
): Uint8Array {
  const fee = applicant.admissionFee || 5000
  const lines: string[] = [
    // Header
    'BT /F1 16 Tf 50 790 Td (' + esc(school.schoolName.toUpperCase()) + ') Tj',
    '0 -18 Td /F1 9 Tf (EIIN: ' +
      esc(school.eiin || '108234') +
      '   |   ' +
      esc(school.address || 'Dhaka, Bangladesh') +
      ') Tj',
    '0 -16 Td /F1 12 Tf (OFFICIAL ADMISSION OFFER & FEE VOUCHER) Tj',
    '0 -12 Td (-------------------------------------------------------------------------------------------------------) Tj',

    // Applicant & Offer Details
    '0 -18 Td /F1 10 Tf (Application No: ' +
      esc(applicant.applicationNo) +
      '     Date of Issue: 22 Nov 2026) Tj',
    '0 -16 Td (Student Name: ' +
      esc(applicant.studentName) +
      '     Selected Class: ' +
      esc(applicant.appliedClass) +
      ') Tj',
    '0 -16 Td (Guardian Name: ' +
      esc(applicant.guardianName) +
      '     Phone: ' +
      esc(applicant.guardianPhone) +
      ') Tj',
    '0 -16 Td (Session: ' +
      esc(applicant.academicYear || '2026') +
      '     Payment Due Date: 05 December 2026) Tj',
    '0 -20 Td (-------------------------------------------------------------------------------------------------------) Tj',

    // Fee Schedule Table Header
    '0 -18 Td /F1 10.5 Tf 0.12 0.35 0.72 rg (ITEMIZED ADMISSION FEE SCHEDULE) Tj',
    '0 -15 Td /F1 9 Tf 0.1 0.15 0.25 rg (SL    DESCRIPTION                                                                AMOUNT (BDT)) Tj',
    '0 -8 Td (-------------------------------------------------------------------------------------------------------) Tj',
    '0 -16 Td (01    New Admission / Registration Fee                                           2,500.00) Tj',
    '0 -15 Td (02    Annual Session & Development Fee                                           1,500.00) Tj',
    '0 -15 Td (03    Tuition Fee (First Month)                                                  1,200.00) Tj',
    '0 -15 Td (04    Library, Science Lab & ICT Facility Fee                                      600.00) Tj',
    '0 -15 Td (05    Student Smart ID Card & Academic Diary                                       400.00) Tj',
    '0 -10 Td (-------------------------------------------------------------------------------------------------------) Tj',
    '0 -16 Td /F1 10 Tf 0.12 0.35 0.72 rg (TOTAL PAYABLE AMOUNT:                                                      BDT ' +
      fee.toFixed(2) +
      ') Tj',
    '0 -12 Td /F1 9 Tf 0.1 0.15 0.25 rg (-------------------------------------------------------------------------------------------------------) Tj',

    // Payment Methods
    '0 -20 Td /F1 9.5 Tf (ACCEPTED PAYMENT METHODS:) Tj',
    '0 -14 Td /F1 8 Tf 0.3 0.35 0.4 rg (A. bKash / Nagad Merchant: Select "Make Payment" > Merchant: 01700-000000 > Ref: ' +
      esc(applicant.applicationNo) +
      ') Tj',
    '0 -12 Td (B. Bank Deposit: Sonali Bank Ltd, Motijheel Branch, A/C No: 1020304050, Account: ' +
      esc(school.schoolName.slice(0, 28)) +
      ') Tj',
    '0 -12 Td (C. School Cash Counter: Open Saturday to Thursday from 9:00 AM to 2:00 PM.) Tj',

    // Signatures
    '0 -50 Td /F1 9 Tf 0.2 0.25 0.35 rg (_____________________________                                                         _____________________________) Tj',
    '0 -12 Td /F1 8 Tf (   Accounts Officer Signature                                                                   Principal / Headmaster Signature) Tj',
    'ET',
  ]

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
