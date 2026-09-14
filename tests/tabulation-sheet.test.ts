import { describe, it, expect } from 'vitest'
import {
  calculateSubjectScore,
  buildTabulationRows,
  calculateCohortStatistics,
} from '@/lib/tabulation'
import { createTabulationSheetPdf } from '@/lib/tabulation-pdf'

const mockSchool = {
  schoolName: 'Ideal High School & College',
  eiin: '108234',
  address: 'Dhanmondi, Dhaka, Bangladesh',
}

const mockStudents = [
  { id: 'STU-1001', name: 'Amina Begum', roll: '01' },
  { id: 'STU-1002', name: 'Sabbir Hossain', roll: '02' },
  { id: 'STU-1003', name: 'Tanvir Hasan', roll: '03' },
]

const mockSubjectNames = ['Bangla', 'English', 'Mathematics']

const mockMarksMap = {
  'STU-1001': {
    Bangla: { ca: 18, final: 70 }, // 88 (A+, 5.0)
    English: { ca: 19, final: 68 }, // 87 (A+, 5.0)
    Mathematics: { ca: 20, final: 75 }, // 95 (A+, 5.0)
  },
  'STU-1002': {
    Bangla: { ca: 14, final: 55 }, // 69 (A-, 3.5)
    English: { ca: 15, final: 60 }, // 75 (A, 4.0)
    Mathematics: { ca: 16, final: 62 }, // 78 (A, 4.0)
  },
  'STU-1003': {
    Bangla: { ca: 12, final: 45 }, // 57 (B, 3.0)
    English: { ca: 5, final: 20 }, // 25 (F, 0.0) -> FAILS COMPULSORY
    Mathematics: { ca: 15, final: 55 }, // 70 (A, 4.0)
  },
}

describe('Tabulation Broadsheet Domain Engine', () => {
  it('combines CA and Final marks into NCTB scores accurately', () => {
    // 18 CA + 70 Final = 88 (A+, 5.0)
    const s1 = calculateSubjectScore('Bangla', 18, 70)
    expect(s1.totalMarks).toBe(88)
    expect(s1.letter).toBe('A+')
    expect(s1.gpa).toBe(5.0)
    expect(s1.isPassed).toBe(true)

    // 5 CA + 20 Final = 25 (F, 0.0)
    const s2 = calculateSubjectScore('English', 5, 20)
    expect(s2.totalMarks).toBe(25)
    expect(s2.letter).toBe('F')
    expect(s2.gpa).toBe(0.0)
    expect(s2.isPassed).toBe(false)
  })

  it('builds ranked tabulation rows adhering to strict NCTB fail policy', () => {
    const rows = buildTabulationRows(mockStudents, mockMarksMap, mockSubjectNames)
    expect(rows.length).toBe(3)

    // Amina Begum should rank #1 with GPA 5.00
    const amina = rows.find((r) => r.studentName === 'Amina Begum')
    expect(amina).toBeDefined()
    expect(amina?.meritPosition).toBe(1)
    expect(amina?.isPassed).toBe(true)
    expect(amina?.gpa).toBe(5.0)
    expect(amina?.overallGrade).toBe('A+')

    // Sabbir Hossain should rank #2 with passing GPA
    const sabbir = rows.find((r) => r.studentName === 'Sabbir Hossain')
    expect(sabbir).toBeDefined()
    expect(sabbir?.meritPosition).toBe(2)
    expect(sabbir?.isPassed).toBe(true)

    // Tanvir Hasan failed English (<33%), so overall GPA must be 0.0 and status FAILED
    const tanvir = rows.find((r) => r.studentName === 'Tanvir Hasan')
    expect(tanvir).toBeDefined()
    expect(tanvir?.isPassed).toBe(false)
    expect(tanvir?.gpa).toBe(0.0)
    expect(tanvir?.overallGrade).toBe('F')
    expect(tanvir?.meritPosition).toBe(3)
  })

  it('calculates cohort pass rates, GPA 5 counts, and subject statistics', () => {
    const rows = buildTabulationRows(mockStudents, mockMarksMap, mockSubjectNames)
    const stats = calculateCohortStatistics(rows, mockSubjectNames)

    expect(stats.totalAppeared).toBe(3)
    expect(stats.totalPassed).toBe(2)
    expect(stats.totalFailed).toBe(1)
    expect(stats.passPercentage).toBe(66.7)
    expect(stats.gpa5Count).toBe(1) // Amina Begum

    // Subject stats
    expect(stats.subjectStats['Mathematics'].highestMarks).toBe(95)
    expect(stats.subjectStats['English'].failCount).toBe(1)
  })
})

describe('Vector PDF Generation for Tabulation Broadsheet', () => {
  it('generates an official vector A4 Landscape Master Tabulation Broadsheet PDF', () => {
    const rows = buildTabulationRows(mockStudents, mockMarksMap, mockSubjectNames)
    const stats = calculateCohortStatistics(rows, mockSubjectNames)

    const pdfBytes = createTabulationSheetPdf({
      school: mockSchool,
      examTitle: 'Half-Yearly Examination 2026',
      academicYear: '2026',
      className: 'Class 7',
      sectionName: 'A',
      subjectNames: mockSubjectNames,
      rows,
      stats,
    })

    expect(pdfBytes.length).toBeGreaterThan(600)

    const pdfText = new TextDecoder().decode(pdfBytes)
    expect(pdfText).toContain('%PDF-1.4')
    expect(pdfText).toContain('[0 0 842 595]') // Landscape MediaBox
    expect(pdfText).toContain('MASTER CLASS TABULATION SHEET')
    expect(pdfText).toContain('IDEAL HIGH SCHOOL & COLLEGE')
    expect(pdfText).toContain('Amina Begum')
    expect(pdfText).toContain('Sabbir Hossain')
    expect(pdfText).toContain('Tanvir Hasan')
    expect(pdfText).toContain('%%EOF')
  })
})
