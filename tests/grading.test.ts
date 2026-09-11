import assert from 'node:assert/strict'
import test from 'node:test'
import { averageGpa, gradeForPercentage, validMarks } from '../src/lib/grading.ts'
import { createReportCardPdf } from '../src/lib/report-card-pdf.ts'

test('Bangladesh grade boundaries and GPA are applied', () => {
  assert.deepEqual(gradeForPercentage(80), { min: 80, letter: 'A+', gpa: 5 })
  assert.equal(gradeForPercentage(32.99).letter, 'F')
  assert.equal(averageGpa([80, 70, 60]), 4.17)
})

test('marks must stay within the exam total', () => {
  assert.equal(validMarks('100', 100), true)
  assert.equal(validMarks('101', 100), false)
  assert.equal(validMarks('-1', 100), false)
  assert.equal(validMarks('', 100), false)
})

test('report card generator emits a valid one-page PDF', () => {
  const bytes = createReportCardPdf({ school: 'EduOS School', student: 'Test Student', roll: '7A-01', rows: [{ subject: 'Math', exam: 'Midterm', marks: 80, total: 100, grade: 'A+', gpa: 5 }], average: 80, gpa: 5 })
  const text = new TextDecoder().decode(bytes)
  assert.equal(text.startsWith('%PDF-1.4'), true)
  assert.equal(text.includes('/Type /Page'), true)
  assert.equal(text.endsWith('%%EOF'), true)
})
