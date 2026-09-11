import assert from 'node:assert/strict'
import test from 'node:test'
import { createQuestionPaperPdf } from '../src/lib/question-paper-pdf.ts'

test('question paper generator emits a valid A4 PDF document', () => {
  const bytes = createQuestionPaperPdf({ school: 'EduOS School', exam: 'Mid-term', className: '7-A', subject: 'Math', date: '2026-08-01', totalMarks: 10, questions: [{ prompt: 'Solve x + 2 = 5', marks: 2 }, { prompt: 'Choose the prime number', marks: 1, options: ['4', '5', '6'] }] })
  const text = new TextDecoder().decode(bytes)
  assert.equal(text.startsWith('%PDF-1.4'), true)
  assert.equal(text.includes('Solve x + 2 = 5'), true)
  assert.equal(text.endsWith('%%EOF'), true)
})
