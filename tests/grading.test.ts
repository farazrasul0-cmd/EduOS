import { describe, it, expect } from 'vitest'
import { averageGpa, gradeForPercentage, validMarks } from '../src/lib/grading'
import { createReportCardPdf } from '../src/lib/report-card-pdf'

describe('grading logic and report cards', () => {
  it('Bangladesh grade boundaries and GPA are applied', () => {
    expect(gradeForPercentage(80)).toEqual({ min: 80, letter: 'A+', gpa: 5 })
    expect(gradeForPercentage(32.99).letter).toBe('F')
    expect(averageGpa([80, 70, 60])).toBe(4.17)
  })

  it('marks must stay within the exam total', () => {
    expect(validMarks('100', 100)).toBe(true)
    expect(validMarks('101', 100)).toBe(false)
    expect(validMarks('-1', 100)).toBe(false)
    expect(validMarks('', 100)).toBe(false)
  })

  it('report card generator emits a valid one-page PDF', () => {
    const bytes = createReportCardPdf({
      school: 'EduOS School',
      student: 'Test Student',
      roll: '7A-01',
      rows: [{ subject: 'Math', exam: 'Midterm', marks: 80, total: 100, grade: 'A+', gpa: 5 }],
      average: 80,
      gpa: 5,
    })
    const text = new TextDecoder().decode(bytes)
    expect(text.startsWith('%PDF-1.4')).toBe(true)
    expect(text.includes('/Type /Page')).toBe(true)
    expect(text.endsWith('%%EOF')).toBe(true)
  })
})
