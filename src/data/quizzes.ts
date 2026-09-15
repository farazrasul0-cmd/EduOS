import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  QuestionBankItem,
  QuizModelTest,
  QuizAttempt,
} from '@/lib/quizzes'
import { evaluateQuizAttempt } from '@/lib/quizzes'

const INITIAL_QUESTION_BANK: QuestionBankItem[] = [
  {
    id: 'Q-SCI-001',
    subject: 'General Science',
    className: 'Class 10',
    chapter: 'Cell Structure & Genetics',
    questionText: 'Which organelle is universally known as the powerhouse of the cell?',
    questionTextBn: 'কোষের শক্তিঘর (পাওয়ার হাউস) হিসেবে কোনটি পরিচিত?',
    options: ['Ribosome', 'Mitochondria', 'Golgi Apparatus', 'Endoplasmic Reticulum'],
    optionsBn: ['রাইবোজোম', 'মাইটোকন্ড্রিয়া', 'গলগি বডি', 'এন্ডোপ্লাজমিক রেটিকুলাম'],
    correctOptionIndex: 1,
    explanation: 'Mitochondria generate most of the chemical energy needed to power the cell biochemical reactions (ATP).',
    marks: 1,
    difficulty: 'easy',
  },
  {
    id: 'Q-SCI-002',
    subject: 'General Science',
    className: 'Class 10',
    chapter: 'Photosynthesis',
    questionText: 'What gas is released as a byproduct during the light reaction of photosynthesis?',
    questionTextBn: 'সালোকসংশ্লেষণের আলোক পর্যায়ে উপজাত হিসেবে কোন গ্যাস নির্গত হয়?',
    options: ['Carbon Dioxide (CO2)', 'Nitrogen (N2)', 'Oxygen (O2)', 'Hydrogen (H2)'],
    optionsBn: ['কার্বন ডাই অক্সাইড (CO2)', 'নাইট্রোজেন (N2)', 'অক্সিজেন (O2)', 'হাইড্রোজেন (H2)'],
    correctOptionIndex: 2,
    explanation: 'Photolysis of water molecules during the light reaction produces molecular oxygen.',
    marks: 1,
    difficulty: 'medium',
  },
  {
    id: 'Q-SCI-003',
    subject: 'General Science',
    className: 'Class 10',
    chapter: 'Circulatory System',
    questionText: 'Which blood group is universally designated as the universal donor in blood transfusions?',
    questionTextBn: 'রক্ত পরিসঞ্চালনে কোন রক্তের গ্রুপকে সর্বজনীন দাতা বলা হয়?',
    options: ['Group A', 'Group B', 'Group AB', 'Group O Negative'],
    optionsBn: ['গ্রুপ এ', 'গ্রুপ বি', 'গ্রুপ এবি', 'গ্রুপ ও নেগেটিভ'],
    correctOptionIndex: 3,
    explanation: 'O-negative red blood cells do not exhibit A, B, or Rh antigens on their surface.',
    marks: 1,
    difficulty: 'easy',
  },
  {
    id: 'Q-MATH-001',
    subject: 'Mathematics',
    className: 'Class 9',
    chapter: 'Algebraic Expressions',
    questionText: 'If (x + 1/x) = 4, what is the value of (x^2 + 1/x^2)?',
    questionTextBn: 'যদি (x + 1/x) = 4 হয়, তবে (x^2 + 1/x^2) এর মান কত?',
    options: ['14', '16', '18', '12'],
    optionsBn: ['১৪', '১৬', '১৮', '১২'],
    correctOptionIndex: 0,
    explanation: '(x + 1/x)^2 = x^2 + 1/x^2 + 2 = 16 => x^2 + 1/x^2 = 16 - 2 = 14.',
    marks: 1,
    difficulty: 'medium',
  },
  {
    id: 'Q-MATH-002',
    subject: 'Mathematics',
    className: 'Class 9',
    chapter: 'Geometry',
    questionText: 'In a right-angled triangle with base 6 cm and height 8 cm, what is the length of the hypotenuse?',
    questionTextBn: 'একটি সমকোণী ত্রিভুজের ভূমি ৬ সেমি এবং উচ্চতা ৮ সেমি হলে, অতিভুজের দৈর্ঘ্য কত?',
    options: ['9 cm', '10 cm', '12 cm', '14 cm'],
    optionsBn: ['৯ সেমি', '১০ সেমি', '১২ সেমি', '১৪ সেমি'],
    correctOptionIndex: 1,
    explanation: 'By Pythagoras theorem: sqrt(6^2 + 8^2) = sqrt(36 + 64) = sqrt(100) = 10 cm.',
    marks: 1,
    difficulty: 'easy',
  },
  {
    id: 'Q-BN-001',
    subject: 'Bangla',
    className: 'Class 8',
    chapter: 'Bangla Grammar & Sandhi',
    questionText: 'সন্ধি বিচ্ছেদ করুন: "বিদ্যালয়"?',
    questionTextBn: 'সন্ধি বিচ্ছেদ করুন: "বিদ্যালয়"?',
    options: ['বিদ্যা + আলয়', 'বিদ + আলয়', 'বিদ্যা + লয়', 'বিদ্য + আলয়'],
    optionsBn: ['বিদ্যা + আলয়', 'বিদ + আলয়', 'বিদ্যা + লয়', 'বিদ্য + আলয়'],
    correctOptionIndex: 0,
    explanation: 'স্বরসন্ধির নিয়ম অনুসারে আ + আ = আ, তাই বিদ্যা + আলয় = বিদ্যালয়।',
    marks: 1,
    difficulty: 'easy',
  },
  {
    id: 'Q-ICT-001',
    subject: 'ICT',
    className: 'Class 10',
    chapter: 'Computer Architecture',
    questionText: 'Which memory type in a computer is volatile and loses all stored data when powered off?',
    questionTextBn: 'কম্পিউটারের কোন মেমরিটি উদ্বায়ী (Volatile) যা বিদ্যুৎ চলে গেলে তথ্য মুছে যায়?',
    options: ['ROM', 'Hard Disk', 'RAM', 'Flash Drive'],
    optionsBn: ['রম (ROM)', 'হার্ডডিস্ক', 'র‍্যাম (RAM)', 'পেনড্রাইভ'],
    correctOptionIndex: 2,
    explanation: 'RAM (Random Access Memory) requires continuous electrical charge to retain its state.',
    marks: 1,
    difficulty: 'easy',
  },
]

const INITIAL_QUIZZES: QuizModelTest[] = [
  {
    id: 'QUIZ-2026-01',
    title: 'SSC Model Test 2026: General Science & ICT',
    titleBn: 'এসএসসি মডেল টেস্ট ২০২৬: সাধারণ বিজ্ঞান ও আইসিটি',
    subject: 'General Science',
    className: 'Class 10',
    totalMarks: 4,
    passMarks: 2,
    durationMinutes: 10,
    negativeMarkingRate: 0.25,
    status: 'active',
    questions: [
      INITIAL_QUESTION_BANK[0],
      INITIAL_QUESTION_BANK[1],
      INITIAL_QUESTION_BANK[2],
      INITIAL_QUESTION_BANK[6],
    ],
  },
  {
    id: 'QUIZ-2026-02',
    title: 'Class 9 Mathematics Speed Test: Algebra & Geometry',
    titleBn: 'নবম শ্রেণি গণিত স্পিড টেস্ট: বীজগণিত ও জ্যামিতি',
    subject: 'Mathematics',
    className: 'Class 9',
    totalMarks: 2,
    passMarks: 1,
    durationMinutes: 8,
    negativeMarkingRate: 0.25,
    status: 'active',
    questions: [
      INITIAL_QUESTION_BANK[3],
      INITIAL_QUESTION_BANK[4],
    ],
  },
  {
    id: 'QUIZ-2026-03',
    title: 'Class 8 Bangla 2nd Paper Grammar Assessment',
    titleBn: 'অষ্টম শ্রেণি বাংলা ২য় পত্র ব্যাকরণ মূল্যায়ন',
    subject: 'Bangla',
    className: 'Class 8',
    totalMarks: 1,
    passMarks: 1,
    durationMinutes: 5,
    negativeMarkingRate: 0.0,
    status: 'active',
    questions: [
      INITIAL_QUESTION_BANK[5],
    ],
  },
]

const INITIAL_ATTEMPTS: QuizAttempt[] = [
  {
    id: 'ATT-2026-001',
    quizId: 'QUIZ-2026-01',
    quizTitle: 'SSC Model Test 2026: General Science & ICT',
    studentId: 'STD-2026-001',
    studentName: 'Tanvir Ahmed',
    studentNameBn: 'তানভীর আহমেদ',
    rollNo: '01',
    className: 'Class 10',
    section: 'A',
    score: 3.75,
    maxScore: 4,
    correctCount: 4,
    incorrectCount: 0,
    unansweredCount: 0,
    accuracy: 100,
    passed: true,
    timeSpentSeconds: 320,
    submittedAt: '2026-09-14 10:25 AM',
    evaluations: [
      {
        questionId: 'Q-SCI-001',
        questionText: INITIAL_QUESTION_BANK[0].questionText,
        selectedOption: 1,
        correctOption: 1,
        isCorrect: true,
        isUnanswered: false,
        marksAwarded: 1,
        explanation: INITIAL_QUESTION_BANK[0].explanation,
      },
      {
        questionId: 'Q-SCI-002',
        questionText: INITIAL_QUESTION_BANK[1].questionText,
        selectedOption: 2,
        correctOption: 2,
        isCorrect: true,
        isUnanswered: false,
        marksAwarded: 1,
        explanation: INITIAL_QUESTION_BANK[1].explanation,
      },
      {
        questionId: 'Q-SCI-003',
        questionText: INITIAL_QUESTION_BANK[2].questionText,
        selectedOption: 3,
        correctOption: 3,
        isCorrect: true,
        isUnanswered: false,
        marksAwarded: 1,
        explanation: INITIAL_QUESTION_BANK[2].explanation,
      },
      {
        questionId: 'Q-ICT-001',
        questionText: INITIAL_QUESTION_BANK[6].questionText,
        selectedOption: 2,
        correctOption: 2,
        isCorrect: true,
        isUnanswered: false,
        marksAwarded: 1,
        explanation: INITIAL_QUESTION_BANK[6].explanation,
      },
    ],
  },
]

let questionBankCache: QuestionBankItem[] = JSON.parse(JSON.stringify(INITIAL_QUESTION_BANK))
let quizzesCache: QuizModelTest[] = JSON.parse(JSON.stringify(INITIAL_QUIZZES))
let attemptsCache: QuizAttempt[] = JSON.parse(JSON.stringify(INITIAL_ATTEMPTS))

export function resetQuizStore(): void {
  questionBankCache = JSON.parse(JSON.stringify(INITIAL_QUESTION_BANK))
  quizzesCache = JSON.parse(JSON.stringify(INITIAL_QUIZZES))
  attemptsCache = JSON.parse(JSON.stringify(INITIAL_ATTEMPTS))
}

export function useQuizzes() {
  return useQuery<QuizModelTest[]>({
    queryKey: ['quizzes'],
    queryFn: async () => [...quizzesCache],
    initialData: () => [...quizzesCache],
  })
}

export function useQuizDetails(quizId: string) {
  return useQuery<QuizModelTest>({
    queryKey: ['quiz-details', quizId],
    queryFn: async () => {
      const q = quizzesCache.find((item) => item.id === quizId)
      if (!q) throw new Error(`Quiz not found: ${quizId}`)
      return { ...q }
    },
    initialData: () => {
      return quizzesCache.find((item) => item.id === quizId) || quizzesCache[0]
    },
    enabled: Boolean(quizId),
  })
}

export function useQuestionBank() {
  return useQuery<QuestionBankItem[]>({
    queryKey: ['question-bank'],
    queryFn: async () => [...questionBankCache],
    initialData: () => [...questionBankCache],
  })
}

export function useQuizAttempts(quizId?: string) {
  return useQuery<QuizAttempt[]>({
    queryKey: ['quiz-attempts', quizId || 'all'],
    queryFn: async () => {
      if (quizId) {
        return attemptsCache.filter((a) => a.quizId === quizId)
      }
      return [...attemptsCache]
    },
    initialData: () => {
      if (quizId) {
        return attemptsCache.filter((a) => a.quizId === quizId)
      }
      return [...attemptsCache]
    },
  })
}

export interface SubmitQuizPayload {
  quizId: string
  studentId: string
  studentName: string
  studentNameBn?: string
  rollNo: string
  className: string
  section: string
  answers: Record<string, number | null>
  timeSpentSeconds: number
}

export function useSubmitQuizAttempt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: SubmitQuizPayload): Promise<QuizAttempt> => {
      const quiz = quizzesCache.find((q) => q.id === payload.quizId)
      if (!quiz) throw new Error(`Quiz not found: ${payload.quizId}`)

      const evaluation = evaluateQuizAttempt(quiz, payload.answers)

      const attempt: QuizAttempt = {
        id: `ATT-2026-${(attemptsCache.length + 1).toString().padStart(3, '0')}`,
        quizId: quiz.id,
        quizTitle: quiz.title,
        studentId: payload.studentId,
        studentName: payload.studentName,
        studentNameBn: payload.studentNameBn,
        rollNo: payload.rollNo,
        className: payload.className,
        section: payload.section,
        score: evaluation.score,
        maxScore: evaluation.maxScore,
        correctCount: evaluation.correctCount,
        incorrectCount: evaluation.incorrectCount,
        unansweredCount: evaluation.unansweredCount,
        accuracy: evaluation.accuracy,
        passed: evaluation.passed,
        timeSpentSeconds: payload.timeSpentSeconds,
        submittedAt: new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
        evaluations: evaluation.evaluations,
      }

      attemptsCache.unshift(attempt)
      return attempt
    },
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: ['quiz-attempts'] })
      void qc.invalidateQueries({ queryKey: ['quiz-attempts', variables.quizId] })
    },
  })
}

export function useCreateQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<QuestionBankItem, 'id'>): Promise<QuestionBankItem> => {
      const newItem: QuestionBankItem = {
        ...payload,
        id: `Q-${payload.subject.slice(0, 3).toUpperCase()}-${(questionBankCache.length + 1).toString().padStart(3, '0')}`,
      }
      questionBankCache.unshift(newItem)
      return newItem
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['question-bank'] })
    },
  })
}
