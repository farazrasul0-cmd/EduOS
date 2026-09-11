import { mkdirSync, writeFileSync } from 'node:fs'
import { createReportCardPdf } from '../src/lib/report-card-pdf.ts'

mkdirSync('output/pdf', { recursive: true })
writeFileSync('output/pdf/results-report-card-sample.pdf', createReportCardPdf({
  school: 'Riverside Public School', student: 'Tahmid Rahman', roll: '7A-01', average: 78.3, gpa: 4.17,
  rows: [
    { subject: 'Mathematics', exam: 'Mid-term', marks: 84, total: 100, grade: 'A+', gpa: 5 },
    { subject: 'Science', exam: 'Mid-term', marks: 76, total: 100, grade: 'A', gpa: 4 },
    { subject: 'English', exam: 'Mid-term', marks: 75, total: 100, grade: 'A', gpa: 4 },
  ],
}))
