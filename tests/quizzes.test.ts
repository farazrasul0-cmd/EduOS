import { describe, it, expect } from 'vitest'
import {
  evaluateQuizAttempt,
  formatQuizDuration,
  getDifficultyTone,
  type QuizModelTest,
  type QuestionBankItem,
  type QuizAttempt,
} from '@/lib/quizzes'
import { createQuizPerformanceReportPdf } from '@/lib/quiz-pdf'

const mockQuestions: QuestionBankItem[] = [
  {
    id: 'Q-1',
    subject: 'General Science',
    className: 'Class 10',
    chapter: 'Cell Biology',
    questionText: 'Which organelle is the powerhouse of the cell?',
    options: ['Ribosome', 'Mitochondria', 'Golgi body', 'Nucleus'],
    correctOptionIndex: 1, // B
    explanation: 'Mitochondria produce ATP.',
    marks: 1,
    difficulty: 'easy',
  },
  {
    id: 'Q-2',
    subject: 'General Science',
    className: 'Class 10',
    chapter: 'Photosynthesis',
    questionText: 'What gas is released during photosynthesis?',
    options: ['CO2', 'O2', 'N2', 'H2'],
    correctOptionIndex: 1, // B
    explanation: 'Photolysis releases oxygen.',
    marks: 1,
    difficulty: 'medium',
  },
  {
    id: 'Q-3',
    subject: 'General Science',
    className: 'Class 10',
    chapter: 'Genetics',
    questionText: 'Who is the father of genetics?',
    options: ['Darwin', 'Mendel', 'Lamarck', 'Watson'],
    correctOptionIndex: 1, // B
    explanation: 'Gregor Mendel formulated laws of inheritance.',
    marks: 1,
    difficulty: 'hard',
  },
  {
    id: 'Q-4',
    subject: 'General Science',
    className: 'Class 10',
    chapter: 'Circulation',
    questionText: 'Which is universal donor?',
    options: ['A', 'B', 'AB', 'O-'],
    correctOptionIndex: 3, // D
    explanation: 'O- has no surface antigens.',
    marks: 1,
    difficulty: 'easy',
  },
]

const mockQuiz: QuizModelTest = {
  id: 'QUIZ-01',
  title: 'Science Model Test',
  subject: 'General Science',
  className: 'Class 10',
  totalMarks: 4,
  passMarks: 2,
  durationMinutes: 10,
  negativeMarkingRate: 0.25,
  status: 'active',
  questions: mockQuestions,
}

const mockAttempt: QuizAttempt = {
  id: 'ATT-01',
  quizId: 'QUIZ-01',
  quizTitle: 'Science Model Test',
  studentId: 'STD-01',
  studentName: 'Tanvir Ahmed',
  rollNo: '01',
  className: 'Class 10',
  section: 'A',
  score: 2.75,
  maxScore: 4,
  correctCount: 3,
  incorrectCount: 1,
  unansweredCount: 0,
  accuracy: 75,
  passed: true,
  timeSpentSeconds: 240,
  submittedAt: '2026-09-15 10:30 AM',
  evaluations: [
    {
      questionId: 'Q-1',
      questionText: mockQuestions[0].questionText,
      selectedOption: 1,
      correctOption: 1,
      isCorrect: true,
      isUnanswered: false,
      marksAwarded: 1,
      explanation: mockQuestions[0].explanation,
    },
    {
      questionId: 'Q-2',
      questionText: mockQuestions[1].questionText,
      selectedOption: 1,
      correctOption: 1,
      isCorrect: true,
      isUnanswered: false,
      marksAwarded: 1,
      explanation: mockQuestions[1].explanation,
    },
    {
      questionId: 'Q-3',
      questionText: mockQuestions[2].questionText,
      selectedOption: 1,
      correctOption: 1,
      isCorrect: true,
      isUnanswered: false,
      marksAwarded: 1,
      explanation: mockQuestions[2].explanation,
    },
    {
      questionId: 'Q-4',
      questionText: mockQuestions[3].questionText,
      selectedOption: 1, // Wrong
      correctOption: 3,
      isCorrect: false,
      isUnanswered: false,
      marksAwarded: -0.25,
      explanation: mockQuestions[3].explanation,
    },
  ],
}

describe('Online MCQ Quiz Domain Engine', () => {
  it('correctly calculates score with 100% correct answers', () => {
    const answers = {
      'Q-1': 1,
      'Q-2': 1,
      'Q-3': 1,
      'Q-4': 3,
    }

    const res = evaluateQuizAttempt(mockQuiz, answers)
    expect(res.score).toBe(4)
    expect(res.correctCount).toBe(4)
    expect(res.incorrectCount).toBe(0)
    expect(res.unansweredCount).toBe(0)
    expect(res.accuracy).toBe(100)
    expect(res.passed).toBe(true)
  })

  it('accurately applies negative marking penalty (-0.25 per wrong answer)', () => {
    const answers = {
      'Q-1': 1, // Correct (+1)
      'Q-2': 1, // Correct (+1)
      'Q-3': 0, // Wrong (-0.25)
      'Q-4': 0, // Wrong (-0.25)
    }

    const res = evaluateQuizAttempt(mockQuiz, answers)
    // 2 correct = 2 marks; 2 incorrect * 0.25 = -0.5 marks => 1.5 marks
    expect(res.score).toBe(1.5)
    expect(res.correctCount).toBe(2)
    expect(res.incorrectCount).toBe(2)
    expect(res.unansweredCount).toBe(0)
    expect(res.accuracy).toBe(50)
    expect(res.passed).toBe(false) // passMarks is 2
  })

  it('does not penalize unanswered questions', () => {
    const answers = {
      'Q-1': 1, // Correct (+1)
      'Q-2': 1, // Correct (+1)
      // Q-3 and Q-4 left unanswered
    }

    const res = evaluateQuizAttempt(mockQuiz, answers)
    expect(res.score).toBe(2)
    expect(res.correctCount).toBe(2)
    expect(res.incorrectCount).toBe(0)
    expect(res.unansweredCount).toBe(2)
    expect(res.accuracy).toBe(100)
    expect(res.passed).toBe(true)
  })

  it('prevents negative final scores from going below zero', () => {
    const answers = {
      'Q-1': 0, // Wrong (-0.25)
      'Q-2': 0, // Wrong (-0.25)
      'Q-3': 0, // Wrong (-0.25)
      'Q-4': 0, // Wrong (-0.25)
    }

    const res = evaluateQuizAttempt(mockQuiz, answers)
    expect(res.score).toBe(0)
    expect(res.correctCount).toBe(0)
    expect(res.incorrectCount).toBe(4)
    expect(res.accuracy).toBe(0)
    expect(res.passed).toBe(false)
  })

  it('formats duration in seconds into human readable text', () => {
    expect(formatQuizDuration(45)).toBe('45s')
    expect(formatQuizDuration(125)).toBe('2m 05s')
    expect(formatQuizDuration(600)).toBe('10m 00s')
  })

  it('maps difficulty levels to badge tones', () => {
    expect(getDifficultyTone('easy')).toBe('success')
    expect(getDifficultyTone('medium')).toBe('warning')
    expect(getDifficultyTone('hard')).toBe('danger')
  })
})

describe('Vector PDF Generation for Quiz Performance Reports', () => {
  it('generates an official vector A4 Quiz Diagnostic Report PDF', () => {
    const school = {
      schoolName: 'Dhaka Model High School & College',
      eiin: '108234',
      address: 'Dhanmondi, Dhaka, Bangladesh',
    }

    const bytes = createQuizPerformanceReportPdf(mockAttempt, mockQuiz, school)
    expect(bytes.byteLength).toBeGreaterThan(600)

    const text = new TextDecoder().decode(bytes)
    expect(text).toContain('%PDF-1.4')
    expect(text).toContain('DHAKA MODEL HIGH SCHOOL')
    expect(text).toContain('Tanvir Ahmed')
    expect(text).toContain('Final Score: 2.75 / 4')
    expect(text).toContain('ITEM-BY-ITEM QUESTION DIAGNOSTIC MATRIX')
    expect(text).toContain('%%EOF')
  })
})
