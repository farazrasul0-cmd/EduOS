import { describe, it, expect } from 'vitest'
import { createQuestionPaperPdf } from '../src/lib/question-paper-pdf'

describe('exam question paper generator', () => {
  it('emits a valid A4 PDF document', () => {
    const bytes = createQuestionPaperPdf({
      school: 'EduOS School',
      exam: 'Mid-term',
      className: '7-A',
      subject: 'Math',
      date: '2026-08-01',
      totalMarks: 10,
      questions: [
        { prompt: 'Solve x + 2 = 5', marks: 2 },
        { prompt: 'Choose the prime number', marks: 1, options: ['4', '5', '6'] },
      ],
    })
    const text = new TextDecoder().decode(bytes)
    expect(text.startsWith('%PDF-1.4')).toBe(true)
    expect(text.includes('Solve x + 2 = 5')).toBe(true)
    expect(text.endsWith('%%EOF')).toBe(true)
  })
})
