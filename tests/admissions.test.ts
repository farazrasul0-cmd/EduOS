import { describe, it, expect } from 'vitest'
import {
  generateApplicationNo,
  generateExamRollNo,
  validateBirthCertificate,
  validateBangladeshPhone,
  generateAdmissionSmsText,
  type AdmissionApplicant,
} from '../src/lib/admissions'
import {
  createAdmissionAdmitCardPdf,
  createAdmissionFeeVoucherPdf,
} from '../src/lib/admissions-pdf'

describe('admissions domain engine', () => {
  it('generates structured application numbers with year and sequence', () => {
    expect(generateApplicationNo('2026', 1)).toBe('ADM-2026-0001')
    expect(generateApplicationNo('2026', 42)).toBe('ADM-2026-0042')
    expect(generateApplicationNo(2027, 105)).toBe('ADM-2027-0105')
  })

  it('generates admission test rolls with class prefix', () => {
    expect(generateExamRollNo('Class 6', 1)).toBe('EXM-6001')
    expect(generateExamRollNo('Class 8', 25)).toBe('EXM-8025')
    expect(generateExamRollNo('Playgroup', 3)).toBe('EXM-1003')
  })

  it('validates 17-digit Bangladesh digital birth registration numbers', () => {
    expect(validateBirthCertificate('20142692518012345')).toBe(true)
    expect(validateBirthCertificate('12345678901234567')).toBe(true)
    expect(validateBirthCertificate('1234567890123456')).toBe(false) // 16 digits
    expect(validateBirthCertificate('123456789012345678')).toBe(false) // 18 digits
    expect(validateBirthCertificate('2014269251801234A')).toBe(false) // non-digits
    expect(validateBirthCertificate('')).toBe(false)
    expect(validateBirthCertificate(null)).toBe(false)
  })

  it('validates Bangladeshi mobile phone numbers', () => {
    expect(validateBangladeshPhone('01712345678')).toBe(true)
    expect(validateBangladeshPhone('+8801819556677')).toBe(true)
    expect(validateBangladeshPhone('01912-334455')).toBe(true)
    expect(validateBangladeshPhone('01212345678')).toBe(false) // invalid operator prefix (012)
    expect(validateBangladeshPhone('0171234567')).toBe(false) // 10 digits
    expect(validateBangladeshPhone('')).toBe(false)
  })

  it('generates BTRC-compliant SMS messages for each admissions milestone', () => {
    const applicant: AdmissionApplicant = {
      id: 'adm-test-1',
      schoolId: 'sch-1',
      applicationNo: 'ADM-2026-0010',
      studentName: 'Zubair Al Mahfuz',
      studentNameBn: 'জুবায়ের আল মাহফুজ',
      gender: 'male',
      dob: '2014-04-12',
      religion: 'islam',
      appliedClass: 'Class 6',
      academicYear: '2026',
      guardianName: 'Dr. Mahfuzur Rahman',
      guardianPhone: '+880 1711-223344',
      presentAddress: 'Dhanmondi, Dhaka',
      birthCertificateNo: '20142692518012345',
      status: 'submitted',
      admissionFee: 6500,
      appliedAt: '2026-09-01T00:00:00Z',
    }

    // Submitted (English & Bengali)
    const enSub = generateAdmissionSmsText(applicant, 'EduOS Model School', 'submitted', 'en')
    expect(enSub).toContain('Application ADM-2026-0010 for Zubair Al Mahfuz')

    const bnSub = generateAdmissionSmsText(applicant, 'EduOS Model School', 'submitted', 'bn')
    expect(bnSub).toContain('ভর্তির আবেদন (ADM-2026-0010) সফলভাবে গৃহীত হয়েছে')

    // Shortlisted
    const applicantShortlisted = { ...applicant, examRollNo: 'EXM-6010', examDate: '2026-11-20' }
    const enShort = generateAdmissionSmsText(applicantShortlisted, 'EduOS Model School', 'shortlisted', 'en')
    expect(enShort).toContain('EXM-6010')
    expect(enShort).toContain('shortlisted for admission test')

    // Admitted
    const enAdmit = generateAdmissionSmsText(applicant, 'EduOS Model School', 'admitted', 'en')
    expect(enAdmit).toContain('selected for admission into Class 6')
    expect(enAdmit).toContain('6,500')
  })
})

describe('admissions vector PDF generators', () => {
  const applicant: AdmissionApplicant = {
    id: 'adm-pdf-1',
    schoolId: 'sch-1',
    applicationNo: 'ADM-2026-0105',
    studentName: 'Md. Rayhan Alam',
    studentNameBn: 'মোঃ রায়হান আলম',
    gender: 'male',
    dob: '2013-08-12',
    religion: 'islam',
    appliedClass: 'Class 6',
    academicYear: '2026',
    guardianName: 'Md. Alamgir Hossain',
    guardianPhone: '+880 1712-345678',
    presentAddress: 'Mirpur-10, Dhaka',
    birthCertificateNo: '20132692518011223',
    status: 'shortlisted',
    examRollNo: 'EXM-6024',
    examDate: '20 November 2026',
    examVenue: 'Room 304, Academic Building-2',
    admissionFee: 6500,
    appliedAt: '2026-09-02T00:00:00Z',
  }

  const school = {
    schoolName: 'Viqarunnisa Noon School & College',
    eiin: '108234',
    address: 'Baily Road, Dhaka-1000',
  }

  it('generates a valid A4 Portrait Admission Test Admit Card PDF', () => {
    const bytes = createAdmissionAdmitCardPdf(applicant, school)
    expect(bytes.length).toBeGreaterThan(500)

    const text = new TextDecoder().decode(bytes)
    expect(text.startsWith('%PDF-1.4')).toBe(true)
    expect(text.includes('VIQARUNNISA NOON SCHOOL')).toBe(true)
    expect(text.includes('ADM-2026-0105')).toBe(true)
    expect(text.includes('EXM-6024')).toBe(true)
    expect(text.includes('Md. Rayhan Alam')).toBe(true)
    expect(text.includes('INSTRUCTIONS TO THE CANDIDATE')).toBe(true)
    expect(text.endsWith('%%EOF')).toBe(true)
  })

  it('generates a valid A4 Portrait Admission Fee Voucher PDF', () => {
    const bytes = createAdmissionFeeVoucherPdf(applicant, school)
    expect(bytes.length).toBeGreaterThan(500)

    const text = new TextDecoder().decode(bytes)
    expect(text.startsWith('%PDF-1.4')).toBe(true)
    expect(text.includes('OFFICIAL ADMISSION OFFER & FEE VOUCHER')).toBe(true)
    expect(text.includes('ADM-2026-0105')).toBe(true)
    expect(text.includes('BDT 6500.00')).toBe(true)
    expect(text.includes('ITEMIZED ADMISSION FEE SCHEDULE')).toBe(true)
    expect(text.includes('ACCEPTED PAYMENT METHODS')).toBe(true)
    expect(text.endsWith('%%EOF')).toBe(true)
  })
})
