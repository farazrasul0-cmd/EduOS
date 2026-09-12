import { describe, it, expect } from 'vitest'
import {
  generateStudentId,
  validateBloodGroup,
  formatBloodGroup,
  generateQrPattern,
  generateBarcodeBars,
  type StudentIdCardData,
} from '../src/lib/student-id-card'
import {
  createSingleStudentIdCardPdf,
  createBatchStudentIdCardsPdf,
} from '../src/lib/student-id-card-pdf'

describe('student-id-card domain engine', () => {
  it('generates standardized student ID codes from roll and session year', () => {
    expect(generateStudentId('1', '2026')).toBe('STU-2026-0001')
    expect(generateStudentId('42', '2026')).toBe('STU-2026-0042')
    expect(generateStudentId(null, '2026', 'stu-uuid-abcd-1234')).toBe('STU-2026-1234')
  })

  it('validates and normalizes medical blood groups', () => {
    expect(validateBloodGroup('A+')).toBe(true)
    expect(validateBloodGroup('b-')).toBe(true)
    expect(validateBloodGroup('AB+')).toBe(true)
    expect(validateBloodGroup('O+')).toBe(true)
    expect(validateBloodGroup('X+')).toBe(false)
    expect(validateBloodGroup('')).toBe(false)
    expect(validateBloodGroup(null)).toBe(false)

    expect(formatBloodGroup('b+')).toBe('B+')
    expect(formatBloodGroup('invalid')).toBe('N/A')
    expect(formatBloodGroup(undefined)).toBe('N/A')
  })

  it('generates a 21x21 QR pattern with standard finder patterns', () => {
    const matrix = generateQrPattern('https://eduos.app/verify/STU-2026-0001')
    expect(matrix.length).toBe(21)
    expect(matrix[0].length).toBe(21)

    // Top-left finder corner (0,0) is true
    expect(matrix[0][0]).toBe(true)
    // Center of top-left finder (3,3) is true
    expect(matrix[3][3]).toBe(true)
    // Margin of top-left finder (1,1) is false
    expect(matrix[1][1]).toBe(false)
  })

  it('generates visual barcode bars for student identifiers', () => {
    const bars = generateBarcodeBars('STU-2026-0001')
    expect(bars.length).toBeGreaterThan(20)
    bars.forEach((b) => {
      expect(b).toBeGreaterThanOrEqual(1)
      expect(b).toBeLessThanOrEqual(3)
    })
  })
})

describe('student-id-card vector PDF generator', () => {
  const sampleStudent: StudentIdCardData = {
    id: 'student-101',
    studentId: 'STU-2026-0015',
    studentName: 'Tasnim Rahman',
    rollNo: '15',
    className: 'Class 8-A',
    bloodGroup: 'O+',
    dob: '2012-05-14',
    guardianName: 'Dr. M. A. Rahman',
    guardianPhone: '+880 1711-223344',
    schoolName: 'Viqarunnisa Noon School & College',
    schoolAddress: '1/A Baily Road, Dhaka-1000',
    eiin: '108234',
    academicYear: '2026',
    validUntil: '31-12-2026',
    verificationUrl: 'https://eduos.app/verify/student-101',
  }

  it('generates a valid single student ID card PDF with Front and Back layouts', () => {
    const bytes = createSingleStudentIdCardPdf(sampleStudent)
    expect(bytes.length).toBeGreaterThan(500)

    const text = new TextDecoder().decode(bytes)
    expect(text.startsWith('%PDF-1.4')).toBe(true)
    expect(text.includes('VIQARUNNISA NOON SCHOOL')).toBe(true)
    expect(text.includes('Tasnim Rahman')).toBe(true)
    expect(text.includes('STU-2026-0015')).toBe(true)
    expect(text.includes('Blood Group: O+')).toBe(true)
    expect(text.includes('EMERGENCY INFORMATION & TERMS')).toBe(true)
    expect(text.includes('Dr. M. A. Rahman')).toBe(true)
    expect(text.includes('CARD FRONT')).toBe(true)
    expect(text.includes('CARD BACK')).toBe(true)
    expect(text.endsWith('%%EOF')).toBe(true)
  })

  it('generates a batch A4 sheet PDF with 8 cards per page and pagination', () => {
    // Generate 10 students (should yield 2 pages: 8 on page 1, 2 on page 2)
    const students: StudentIdCardData[] = Array.from({ length: 10 }, (_, i) => ({
      ...sampleStudent,
      id: `stu-${i + 1}`,
      studentId: `STU-2026-${String(i + 1).padStart(4, '0')}`,
      studentName: `Student Name ${i + 1}`,
      rollNo: String(i + 1),
    }))

    const bytes = createBatchStudentIdCardsPdf(students, {
      schoolName: 'Ideal School & College',
      academicYear: '2026',
      side: 'front',
    })
    expect(bytes.length).toBeGreaterThan(1000)

    const text = new TextDecoder().decode(bytes)
    expect(text.startsWith('%PDF-1.4')).toBe(true)
    expect(text.includes('BATCH STUDENT ID CARDS')).toBe(true)
    expect(text.includes('/Count 2')).toBe(true) // 2 pages
    expect(text.includes('Page 1 of 2')).toBe(true)
    expect(text.includes('Page 2 of 2')).toBe(true)
    expect(text.includes('Student Name 1')).toBe(true)
    expect(text.includes('Student Name 10')).toBe(true)
    expect(text.endsWith('%%EOF')).toBe(true)
  })
})
