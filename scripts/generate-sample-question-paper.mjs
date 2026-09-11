import { mkdirSync, writeFileSync } from 'node:fs'
import { createQuestionPaperPdf } from '../src/lib/question-paper-pdf.ts'

mkdirSync('output/pdf', { recursive: true })
writeFileSync('output/pdf/exam-question-paper-sample.pdf', createQuestionPaperPdf({
  school: 'Riverside Public School', exam: 'Mathematics Mid-term', className: '7-A', subject: 'Mathematics', date: '2026-08-01', totalMarks: 12,
  questions: [
    { prompt: 'Solve for x: 3x + 7 = 22', marks: 2 },
    { prompt: 'If a train travels 240 km in 4 hours, what is its average speed?', marks: 2, options: ['50 km/h', '60 km/h', '70 km/h', '80 km/h'] },
    { prompt: 'The sum of two consecutive integers is 47. Find the integers.', marks: 3 },
    { prompt: 'Simplify: 4(x - 2) + 3(x + 5)', marks: 2 },
    { prompt: 'A shopkeeper sells a pen for BDT 120 at a 20% profit. Find the cost price.', marks: 3 },
  ],
}))
