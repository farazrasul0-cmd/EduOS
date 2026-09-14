import { describe, it, expect } from 'vitest'
import {
  generateCertificateSerial,
  getCertificateTypeLabel,
  type CertificateRecord,
} from '@/lib/certificates'
import {
  createTransferCertificatePdf,
  createTestimonialPdf,
  createBonafideCertificatePdf,
} from '@/lib/certificates-pdf'

const mockSchool = {
  schoolName: 'Ideal High School & College',
  eiin: '108234',
  address: 'Dhanmondi, Dhaka, Bangladesh',
  phone: '+880 1711-000000',
  establishedYear: '1995',
}

const mockTcRecord: CertificateRecord = {
  id: 'CERT-2026-0001',
  serialNo: 'TC-2026-0001',
  certificateType: 'tc',
  studentId: 'STU-1001',
  studentName: 'Amina Begum',
  studentNameBn: 'আমিনা বেগম',
  fatherName: 'Md. Abdur Rahim',
  fatherNameBn: 'মো. আব্দুর রহিম',
  motherName: 'Rokeya Begum',
  motherNameBn: 'রোকেয়া বেগম',
  birthRegNo: '20122692019283719',
  dateOfBirth: '2012-05-14',
  className: 'Class 7',
  section: 'A',
  rollNo: '03',
  gender: 'female',
  issueDate: '2026-09-02',
  status: 'issued',
  admissionDate: '2023-01-10',
  dateOfLeaving: '2026-08-31',
  reasonForLeaving: "Father's employment transfer to Chattogram",
  conduct: 'Excellent',
  promotedToClass: 'Class 7 (Mid-session)',
  duesClearedUpTo: 'August 2026',
}

const mockTestimonialRecord: CertificateRecord = {
  id: 'CERT-2026-0003',
  serialNo: 'TST-2026-0001',
  certificateType: 'testimonial',
  studentId: 'STU-0901',
  studentName: 'Sabbir Hossain',
  studentNameBn: 'সাব্বির হোসেন',
  fatherName: 'Md. Shahidul Islam',
  fatherNameBn: 'মো. শহিদুল ইসলাম',
  motherName: 'Nasrin Sultana',
  motherNameBn: 'নাসরিন সুলতানা',
  birthRegNo: '20092692019283711',
  dateOfBirth: '2009-03-12',
  className: 'Class 10 (SSC 2026)',
  section: 'Science-A',
  rollNo: '01',
  gender: 'male',
  issueDate: '2026-08-15',
  status: 'issued',
  boardName: 'Dhaka',
  boardRollNo: '482910',
  boardRegNo: '2118392102',
  session: '2024-2025',
  passingYear: 2026,
  gpaAchieved: 5.0,
  gradeAchieved: 'A+',
  activities: 'Bangladesh Scouts, School Cricket Team',
}

const mockBonafideRecord: CertificateRecord = {
  id: 'CERT-2026-0005',
  serialNo: 'BON-2026-0001',
  certificateType: 'bonafide',
  studentId: 'STU-1003',
  studentName: 'Tanvir Hasan',
  studentNameBn: 'তানভীর হাসান',
  fatherName: 'Golam Mostafa',
  fatherNameBn: 'গোলাম মোস্তফা',
  motherName: 'Salma Khatun',
  motherNameBn: 'সালমা খাতুন',
  birthRegNo: '20112692019283715',
  dateOfBirth: '2011-07-09',
  className: 'Class 8',
  section: 'A',
  rollNo: '05',
  gender: 'male',
  issueDate: '2026-09-08',
  status: 'issued',
  purpose: 'Bangladesh E-Passport Application & Biometric Enrollment',
  validUntil: '2026-12-31',
}

describe('Certificates Domain Engine', () => {
  it('generates standard verification serial tokens for each certificate type', () => {
    expect(generateCertificateSerial('tc', 2026, 42)).toBe('TC-2026-0042')
    expect(generateCertificateSerial('testimonial', 2026, 18)).toBe('TST-2026-0018')
    expect(generateCertificateSerial('bonafide', 2026, 105)).toBe('BON-2026-0105')
  })

  it('returns localized labels in English and Bengali', () => {
    expect(getCertificateTypeLabel('tc', 'en')).toBe('Transfer Certificate (TC)')
    expect(getCertificateTypeLabel('tc', 'bn')).toBe('ছাড়পত্র (টিসি)')
    expect(getCertificateTypeLabel('testimonial', 'en')).toBe('Academic Testimonial')
    expect(getCertificateTypeLabel('testimonial', 'bn')).toBe('প্রশংসাপত্র (টেস্টিমোনিয়াল)')
    expect(getCertificateTypeLabel('bonafide', 'en')).toBe('Bonafide Student Certificate')
    expect(getCertificateTypeLabel('bonafide', 'bn')).toBe('অধ্যয়নরত প্রত্যয়নপত্র')
  })
})

describe('Vector PDF Generation for Certificates', () => {
  it('generates official vector A4 Transfer Certificate PDF', () => {
    const pdfBytes = createTransferCertificatePdf(mockTcRecord, mockSchool)
    expect(pdfBytes.length).toBeGreaterThan(600)

    const pdfText = new TextDecoder().decode(pdfBytes)
    expect(pdfText).toContain('%PDF-1.4')
    expect(pdfText).toContain('TRANSFER CERTIFICATE')
    expect(pdfText).toContain('TC-2026-0001')
    expect(pdfText).toContain('Amina Begum')
    expect(pdfText).toContain('20122692019283719')
    expect(pdfText).toContain('%%EOF')
  })

  it('generates official vector A4 Academic Testimonial PDF', () => {
    const pdfBytes = createTestimonialPdf(mockTestimonialRecord, mockSchool)
    expect(pdfBytes.length).toBeGreaterThan(600)

    const pdfText = new TextDecoder().decode(pdfBytes)
    expect(pdfText).toContain('%PDF-1.4')
    expect(pdfText).toContain('ACADEMIC TESTIMONIAL')
    expect(pdfText).toContain('TST-2026-0001')
    expect(pdfText).toContain('Sabbir Hossain')
    expect(pdfText).toContain('482910')
    expect(pdfText).toContain('GPA 5')
    expect(pdfText).toContain('Dhaka')
    expect(pdfText).toContain('%%EOF')
  })

  it('generates official vector A4 Bonafide Student Certificate PDF', () => {
    const pdfBytes = createBonafideCertificatePdf(mockBonafideRecord, mockSchool)
    expect(pdfBytes.length).toBeGreaterThan(600)

    const pdfText = new TextDecoder().decode(pdfBytes)
    expect(pdfText).toContain('%PDF-1.4')
    expect(pdfText).toContain('BONAFIDE CERTIFICATE')
    expect(pdfText).toContain('BON-2026-0001')
    expect(pdfText).toContain('Tanvir Hasan')
    expect(pdfText).toContain('E-Passport Application')
    expect(pdfText).toContain('%%EOF')
  })
})
