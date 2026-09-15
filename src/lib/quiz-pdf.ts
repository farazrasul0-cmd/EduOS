import type { QuizAttempt, QuizModelTest } from './quizzes'
import { formatQuizDuration } from './quizzes'

export interface SchoolDetails {
  schoolName: string
  eiin?: string
  address?: string
  phone?: string
  email?: string
}

const esc = (value: string) =>
  value.replace(/[^\x20-\x7E]/g, '?').replace(/([\\()])/g, '\\$1')

function assemblePdf(content: string, mediaBox = '[0 0 595 842]'): Uint8Array {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox ${mediaBox} /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>`,
    `<< /Length ${new TextEncoder().encode(content).length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach(() => {
    offsets.push(new TextEncoder().encode(pdf).length)
  })
  objects.forEach((object, index) => {
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xref = new TextEncoder().encode(pdf).length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => String(offset).padStart(10, '0') + ' 00000 n ').join('\n')}\ntrailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`

  return new TextEncoder().encode(pdf)
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D']

/**
 * Generates an official vector A4 Portrait (595 x 842 pt) Quiz Performance & Diagnostic Report PDF.
 */
export function createQuizPerformanceReportPdf(
  attempt: QuizAttempt,
  quiz: QuizModelTest,
  school: SchoolDetails,
): Uint8Array {
  const lines: string[] = [
    // Double Border
    'q 0.15 0.25 0.45 RG 1.5 w 30 30 535 782 re s Q',
    'q 0.6 0.65 0.75 RG 0.5 w 35 35 525 772 re s Q',

    // School Letterhead
    'BT /F1 15 Tf 0.1 0.15 0.3 rg 50 762 Td (' + esc(school.schoolName.toUpperCase()) + ') Tj',
    '0 -15 Td /F1 9 Tf 0.35 0.4 0.5 rg (EIIN: ' +
      esc(school.eiin || '108234') +
      '   |   ' +
      esc(school.address || 'Dhaka, Bangladesh') +
      '   |   ONLINE EXAMINATION DIVISION) Tj',
    '0 -12 Td (---------------------------------------------------------------------------------------------------------------------------------) Tj',
    'ET',

    // Report Title Banner
    'q 0.94 0.96 0.99 rg 50 690 495 24 re f 0.75 0.8 0.9 RG 0.5 w 50 690 495 24 re s Q',
    'BT /F1 11 Tf 0.15 0.25 0.5 rg 90 697 Td (STUDENT MODEL TEST DIAGNOSTIC EVALUATION REPORT / কুইজ পারফরম্যান্স রিপোর্ট) Tj ET',

    // Student & Test Information Box
    'q 0.97 0.98 0.99 rg 50 580 495 100 re f 0.8 0.82 0.88 RG 0.5 w 50 580 495 100 re s Q',
    'BT /F1 9.5 Tf 0.1 0.15 0.3 rg',
    '65 658 Td (Student Name: ' + esc(attempt.studentName) + ') Tj',
    '260 0 Td (Student ID: ' + esc(attempt.studentId) + ') Tj',
    '65 640 Td (Class & Section: ' + esc(attempt.className) + ' (' + esc(attempt.section) + ')) Tj',
    '260 0 Td (Roll Number: ' + esc(attempt.rollNo) + ') Tj',
    '65 622 Td (Assessment Title: ' + esc(quiz.title) + ') Tj',
    '260 0 Td (Subject: ' + esc(quiz.subject) + ') Tj',
    '65 604 Td (Submitted At: ' + esc(attempt.submittedAt) + ') Tj',
    '260 0 Td (Duration Taken: ' + esc(formatQuizDuration(attempt.timeSpentSeconds)) + ' of ' + quiz.durationMinutes + 'm) Tj',
    'ET',

    // KPI Performance Grid
    'q 0.92 0.95 0.98 rg 50 500 495 68 re f 0.65 0.75 0.85 RG 0.5 w 50 500 495 68 re s Q',
    'BT /F1 10 Tf 0.1 0.2 0.4 rg',
    '65 548 Td (Final Score: ' + attempt.score + ' / ' + attempt.maxScore + '  (' + (attempt.passed ? 'PASSED' : 'FAILED') + ')) Tj',
    '260 0 Td (Accuracy Rate: ' + attempt.accuracy + '%) Tj',
    '65 530 Td (Correct Answers: ' + attempt.correctCount + '  |  Wrong: ' + attempt.incorrectCount + '  |  Unanswered: ' + attempt.unansweredCount + ') Tj',
    '260 0 Td (Negative Marking: -' + quiz.negativeMarkingRate + ' per wrong ans) Tj',
    '65 512 Td (Pass Mark Cutoff: ' + quiz.passMarks + ' / ' + quiz.totalMarks + ' marks required) Tj',
    'ET',

    // Section: Item Analysis Table
    'BT /F1 10.5 Tf 0.1 0.2 0.4 rg 50 478 Td (ITEM-BY-ITEM QUESTION DIAGNOSTIC MATRIX) Tj ET',
    'q 0.93 0.95 0.98 rg 50 450 495 20 re f 0.7 0.75 0.85 RG 0.5 w 50 450 495 20 re s Q',
    'BT /F1 8.5 Tf 0.1 0.15 0.3 rg',
    '60 456 Td (Q#'.padEnd(6) + 'Chapter / Topic'.padEnd(28) + 'Your Ans'.padEnd(14) + 'Correct Key'.padEnd(16) + 'Points'.padEnd(12) + 'Evaluation Status) Tj',
    'ET',
  ]

  // Add question rows (up to 12 questions for single page fit)
  const displayEvaluations = attempt.evaluations.slice(0, 12)
  let currentY = 432

  displayEvaluations.forEach((ev, idx) => {
    const qItem = quiz.questions.find((q) => q.id === ev.questionId)
    const topic = qItem ? qItem.chapter.slice(0, 22) : 'General'
    const yourAns = ev.selectedOption !== null ? OPTION_LETTERS[ev.selectedOption] || '-' : 'SKIPPED'
    const correctKey = OPTION_LETTERS[ev.correctOption] || '-'
    const points = ev.marksAwarded > 0 ? `+${ev.marksAwarded}` : `${ev.marksAwarded}`
    const status = ev.isCorrect ? 'CORRECT' : ev.isUnanswered ? 'UNANSWERED' : 'INCORRECT'

    const rowBg = idx % 2 === 0 ? '0.98 0.98 0.99' : '0.95 0.96 0.98'
    lines.push(`q ${rowBg} rg 50 ${currentY - 4} 495 16 re f Q`)

    lines.push(
      'BT /F1 8.5 Tf 0.15 0.2 0.3 rg',
      `60 ${currentY} Td (` +
        esc(
          `#${idx + 1}`.padEnd(6) +
            topic.padEnd(28) +
            yourAns.padEnd(14) +
            correctKey.padEnd(16) +
            points.padEnd(12) +
            status,
        ) +
        ') Tj ET',
    )

    currentY -= 17
  })

  // Teacher Remarks & Recommendations
  lines.push(
    'BT /F1 10 Tf 0.1 0.2 0.4 rg 50 215 Td (EXAMINER RECOMMENDATION & REMARKS:) Tj ET',
    'q 0.98 0.98 0.99 rg 50 160 495 48 re f 0.75 0.8 0.85 RG 0.5 w 50 160 495 48 re s Q',
    'BT /F1 9 Tf 0.2 0.25 0.35 rg',
    '65 192 Td (The student demonstrated ' +
      (attempt.accuracy >= 80 ? 'EXCELLENT' : attempt.accuracy >= 60 ? 'SATISFACTORY' : 'NEEDS IMPROVEMENT') +
      ' conceptual grasp in this model test.) Tj',
    '65 174 Td (Recommended Focus: Review incorrect topics and practice timed mock sets to minimize negative marks.) Tj',
    'ET',
  )

  // Tripartite Signatures
  lines.push(
    'q 0.5 0.55 0.65 RG 0.75 w 60 75 120 0 re s 235 75 120 0 re s 410 75 120 0 re s Q',
    'BT /F1 8.5 Tf 0.2 0.25 0.3 rg',
    '75 62 Td (Subject Teacher) Tj',
    '245 62 Td (Controller of Exams) Tj',
    '425 62 Td (Headmaster / Principal) Tj',
    'ET',
  )

  return assemblePdf(lines.join('\n'))
}
