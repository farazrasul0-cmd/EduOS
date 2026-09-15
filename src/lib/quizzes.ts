export type QuizDifficulty = 'easy' | 'medium' | 'hard'
export type QuizStatus = 'draft' | 'active' | 'archived'

export interface QuestionBankItem {
  id: string
  subject: string
  className: string
  chapter: string
  questionText: string
  questionTextBn?: string
  options: string[]
  optionsBn?: string[]
  correctOptionIndex: number // 0, 1, 2, 3
  explanation: string
  explanationBn?: string
  marks: number
  difficulty: QuizDifficulty
}

export interface QuizModelTest {
  id: string
  title: string
  titleBn?: string
  subject: string
  className: string
  totalMarks: number
  passMarks: number
  durationMinutes: number
  negativeMarkingRate: number // 0.0, 0.25, 0.50
  status: QuizStatus
  questions: QuestionBankItem[]
}

export interface QuestionEvaluation {
  questionId: string
  questionText: string
  selectedOption: number | null
  correctOption: number
  isCorrect: boolean
  isUnanswered: boolean
  marksAwarded: number
  explanation: string
}

export interface QuizEvaluationResult {
  score: number
  maxScore: number
  correctCount: number
  incorrectCount: number
  unansweredCount: number
  accuracy: number
  passed: boolean
  evaluations: QuestionEvaluation[]
}

export interface QuizAttempt {
  id: string
  quizId: string
  quizTitle: string
  studentId: string
  studentName: string
  studentNameBn?: string
  rollNo: string
  className: string
  section: string
  score: number
  maxScore: number
  correctCount: number
  incorrectCount: number
  unansweredCount: number
  accuracy: number
  passed: boolean
  timeSpentSeconds: number
  submittedAt: string
  evaluations: QuestionEvaluation[]
}

/**
 * Evaluates a student's quiz responses against the correct answer keys,
 * applying positive marks for correct answers, zero for unanswered questions,
 * and negative marking deductions for incorrect choices.
 */
export function evaluateQuizAttempt(
  quiz: QuizModelTest,
  studentAnswers: Record<string, number | null>,
): QuizEvaluationResult {
  const evaluations: QuestionEvaluation[] = []
  let totalScore = 0
  let correctCount = 0
  let incorrectCount = 0
  let unansweredCount = 0

  quiz.questions.forEach((q) => {
    const selected = studentAnswers[q.id]
    const isUnanswered = selected === null || selected === undefined

    if (isUnanswered) {
      unansweredCount++
      evaluations.push({
        questionId: q.id,
        questionText: q.questionText,
        selectedOption: null,
        correctOption: q.correctOptionIndex,
        isCorrect: false,
        isUnanswered: true,
        marksAwarded: 0,
        explanation: q.explanation,
      })
    } else if (selected === q.correctOptionIndex) {
      correctCount++
      const marks = q.marks
      totalScore += marks
      evaluations.push({
        questionId: q.id,
        questionText: q.questionText,
        selectedOption: selected,
        correctOption: q.correctOptionIndex,
        isCorrect: true,
        isUnanswered: false,
        marksAwarded: marks,
        explanation: q.explanation,
      })
    } else {
      incorrectCount++
      const penalty = Math.round(q.marks * quiz.negativeMarkingRate * 100) / 100
      totalScore -= penalty
      evaluations.push({
        questionId: q.id,
        questionText: q.questionText,
        selectedOption: selected,
        correctOption: q.correctOptionIndex,
        isCorrect: false,
        isUnanswered: false,
        marksAwarded: -penalty,
        explanation: q.explanation,
      })
    }
  })

  // Normalize final score: minimum 0, rounded to 2 decimals
  const finalScore = Math.max(0, Math.round(totalScore * 100) / 100)
  const answeredCount = correctCount + incorrectCount
  const accuracy =
    answeredCount > 0
      ? Math.round((correctCount / answeredCount) * 1000) / 10
      : 0

  return {
    score: finalScore,
    maxScore: quiz.totalMarks,
    correctCount,
    incorrectCount,
    unansweredCount,
    accuracy,
    passed: finalScore >= quiz.passMarks,
    evaluations,
  }
}

/**
 * Formats duration in seconds into human-readable minutes and seconds.
 */
export function formatQuizDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  return `${m}m ${s.toString().padStart(2, '0')}s`
}

/**
 * Converts difficulty level into UI Badge tone.
 */
export function getDifficultyTone(
  diff: QuizDifficulty,
): 'success' | 'warning' | 'danger' {
  switch (diff) {
    case 'easy':
      return 'success'
    case 'medium':
      return 'warning'
    case 'hard':
      return 'danger'
  }
}
