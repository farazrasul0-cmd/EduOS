import { describe, it, expect } from 'vitest'
import {
  calculateNctbSubjectResult,
  calculateNctbStudentResult,
  calculateMeritPositions,
} from '@/lib/grading'
import { createReportCardPdf, createBatchReportCardsPdf } from '@/lib/report-card-pdf'

describe('NCTB Academic Grading & Merit Position Engine', () => {
  describe('calculateNctbSubjectResult', () => {
    it('accurately maps marks to Bangladesh NCTB letter grades and grade points', () => {
      // A+ (80-100%)
      const r85 = calculateNctbSubjectResult(85, 100)
      expect(r85.letter).toBe('A+')
      expect(r85.gpa).toBe(5.0)
      expect(r85.isPassed).toBe(true)

      // A (70-79%)
      const r75 = calculateNctbSubjectResult(75, 100)
      expect(r75.letter).toBe('A')
      expect(r75.gpa).toBe(4.0)
      expect(r75.isPassed).toBe(true)

      // A- (60-69%)
      const r62 = calculateNctbSubjectResult(62, 100)
      expect(r62.letter).toBe('A-')
      expect(r62.gpa).toBe(3.5)

      // B (50-59%)
      const r54 = calculateNctbSubjectResult(54, 100)
      expect(r54.letter).toBe('B')
      expect(r54.gpa).toBe(3.0)

      // C (40-49%)
      const r45 = calculateNctbSubjectResult(45, 100)
      expect(r45.letter).toBe('C')
      expect(r45.gpa).toBe(2.0)

      // D (33-39%)
      const r33 = calculateNctbSubjectResult(33, 100)
      expect(r33.letter).toBe('D')
      expect(r33.gpa).toBe(1.0)
      expect(r33.isPassed).toBe(true)

      // F (< 33%)
      const r32 = calculateNctbSubjectResult(32, 100)
      expect(r32.letter).toBe('F')
      expect(r32.gpa).toBe(0.0)
      expect(r32.isPassed).toBe(false)
    })

    it('handles non-100 base total marks correctly', () => {
      // 40 out of 50 = 80% (A+)
      const r = calculateNctbSubjectResult(40, 50)
      expect(r.percentage).toBe(80)
      expect(r.letter).toBe('A+')
      expect(r.gpa).toBe(5.0)

      // 16 out of 50 = 32% (F)
      const f = calculateNctbSubjectResult(16, 50)
      expect(f.percentage).toBe(32)
      expect(f.letter).toBe('F')
      expect(f.isPassed).toBe(false)
    })
  })

  describe('calculateNctbStudentResult', () => {
    it('calculates average GPA and passed status when all subjects pass', () => {
      const result = calculateNctbStudentResult([
        { subject: 'Bangla', marks: 85, total: 100 }, // 5.0
        { subject: 'English', marks: 75, total: 100 }, // 4.0
        { subject: 'Mathematics', marks: 82, total: 100 }, // 5.0
      ])

      expect(result.isPassed).toBe(true)
      expect(result.totalMarks).toBe(242)
      expect(result.totalPossibleMarks).toBe(300)
      expect(result.gpa).toBe(4.67) // (5 + 4 + 5) / 3 = 4.67
      expect(result.overallGrade).toBe('A')
    })

    it('strictly fails student (GPA 0.00) if any compulsory subject is below 33%', () => {
      const result = calculateNctbStudentResult([
        { subject: 'Bangla', marks: 95, total: 100 }, // 5.0
        { subject: 'English', marks: 92, total: 100 }, // 5.0
        { subject: 'Mathematics', marks: 25, total: 100 }, // 0.0 (F)
      ])

      // Despite high marks in Bangla & English, failing Math fails the exam
      expect(result.isPassed).toBe(false)
      expect(result.gpa).toBe(0.0)
      expect(result.overallGrade).toBe('F')
      expect(result.remarksEn).toBe('Fail')
    })

    it('safely handles empty subject records', () => {
      const result = calculateNctbStudentResult([])
      expect(result.isPassed).toBe(false)
      expect(result.gpa).toBe(0)
    })
  })

  describe('calculateMeritPositions', () => {
    it('ranks passed students by GPA, breaks ties with total marks, and ranks failed students last', () => {
      const students = [
        { studentId: 's-fail', isPassed: false, gpa: 0.0, totalMarks: 190 },
        { studentId: 's-tie-lower', isPassed: true, gpa: 4.5, totalMarks: 240 },
        { studentId: 's-topper', isPassed: true, gpa: 5.0, totalMarks: 285 },
        { studentId: 's-tie-higher', isPassed: true, gpa: 4.5, totalMarks: 255 },
      ]

      const ranked = calculateMeritPositions(students)

      expect(ranked[0].studentId).toBe('s-topper')
      expect(ranked[0].meritPosition).toBe(1)

      // Tie breaker: s-tie-higher (255 marks) beats s-tie-lower (240 marks)
      expect(ranked[1].studentId).toBe('s-tie-higher')
      expect(ranked[1].meritPosition).toBe(2)

      expect(ranked[2].studentId).toBe('s-tie-lower')
      expect(ranked[2].meritPosition).toBe(3)

      // Failed student ranked last
      expect(ranked[3].studentId).toBe('s-fail')
      expect(ranked[3].meritPosition).toBe(4)
    })
  })

  describe('Official PDF Generation & Batch Export', () => {
    it('generates a valid official single-page report card PDF', () => {
      const pdfBytes = createReportCardPdf({
        school: 'Motijheel Ideal School and College',
        schoolAddress: 'Dhaka - 1000',
        eiin: '108275',
        examTerm: 'Annual Examination 2026',
        academicYear: '2026',
        student: 'Md. Tanvir Ahmed',
        roll: '7A-01',
        className: 'Class 7',
        sectionName: 'A',
        rows: [
          { subject: 'Bangla 1st', marks: 85, total: 100, grade: 'A+', gpa: 5.0, highestMarks: 92 },
          { subject: 'Mathematics', marks: 90, total: 100, grade: 'A+', gpa: 5.0, highestMarks: 98 },
        ],
        average: 87.5,
        gpa: 5.0,
        overallGrade: 'A+',
        isPassed: true,
        meritPosition: 1,
        totalStudents: 45,
        attendanceRate: 96.5,
      })

      const text = new TextDecoder().decode(pdfBytes)
      expect(text.startsWith('%PDF-1.4')).toBe(true)
      expect(text).toContain('Motijheel Ideal School and College')
      expect(text).toContain('EIIN: 108275')
      expect(text).toContain('Md. Tanvir Ahmed')
      expect(text).toContain('NCTB GRADING SCALE')
      expect(text).toContain('PASSED / PROMOTED')
      expect(text.endsWith('%%EOF')).toBe(true)
    })

    it('generates a valid multi-page batch report cards PDF', () => {
      const cards = [
        {
          school: 'Chittagong Collegiate School',
          student: 'Rahim Khan',
          roll: '1',
          rows: [{ subject: 'General Science', marks: 80, total: 100, grade: 'A+', gpa: 5.0 }],
          average: 80,
          gpa: 5.0,
          isPassed: true,
        },
        {
          school: 'Chittagong Collegiate School',
          student: 'Amina Akter',
          roll: '2',
          rows: [{ subject: 'General Science', marks: 70, total: 100, grade: 'A', gpa: 4.0 }],
          average: 70,
          gpa: 4.0,
          isPassed: true,
        },
      ]

      const batchBytes = createBatchReportCardsPdf(cards)
      const text = new TextDecoder().decode(batchBytes)

      expect(text.startsWith('%PDF-1.4')).toBe(true)
      expect(text).toContain('/Count 2')
      expect(text).toContain('Rahim Khan')
      expect(text).toContain('Amina Akter')
      expect(text.endsWith('%%EOF')).toBe(true)
    })
  })
})
