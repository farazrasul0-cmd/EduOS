import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CheckSquare,
  HelpCircle,
  Clock,
  Award,
  BookOpen,
  Send,
  Plus,
  Download,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  HelpCircle as QuestionIcon,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { KPI } from '@/components/ui/KPI'
import { Segmented } from '@/components/ui/Segmented'
import { Modal } from '@/components/ui/Modal'
import { Field, Input, Select, SearchInput, Textarea } from '@/components/ui/form'
import { useToast } from '@/components/ui/Toast'
import type { AppLanguage } from '@/i18n'
import type {
  QuizModelTest,
  QuestionBankItem,
  QuizAttempt,
  QuizDifficulty,
} from '@/lib/quizzes'
import {
  formatQuizDuration,
  getDifficultyTone,
} from '@/lib/quizzes'
import {
  useQuizzes,
  useQuestionBank,
  useQuizAttempts,
  useSubmitQuizAttempt,
  useCreateQuestion,
} from '@/data/quizzes'
import { createQuizPerformanceReportPdf } from '@/lib/quiz-pdf'

const SCHOOL_DETAILS = {
  schoolName: 'Dhaka Model High School & College',
  eiin: '108234',
  address: 'Dhanmondi, Dhaka-1209, Bangladesh',
  phone: '+880 1711-000000',
  email: 'info@dhakamodel.edu.bd',
}

const EMPTY_QUIZZES: QuizModelTest[] = []
const EMPTY_QUESTIONS: QuestionBankItem[] = []
const EMPTY_ATTEMPTS: QuizAttempt[] = []
const OPTION_LETTERS = ['A', 'B', 'C', 'D']

export default function OnlineQuizzes() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'en') as AppLanguage
  const toast = useToast()

  const { data: quizzes = EMPTY_QUIZZES } = useQuizzes()
  const { data: questionBank = EMPTY_QUESTIONS } = useQuestionBank()
  const { data: attempts = EMPTY_ATTEMPTS } = useQuizAttempts()

  const submitAttemptMutation = useSubmitQuizAttempt()
  const createQuestionMutation = useCreateQuestion()

  type TabType = 'tests' | 'live' | 'bank' | 'results'
  const [activeTab, setActiveTab] = useState<TabType>('tests')

  // Live Quiz State
  const [activeQuizId, setActiveQuizId] = useState<string>(quizzes[0]?.id || 'QUIZ-2026-01')
  const [isQuizActive, setIsQuizActive] = useState<boolean>(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0)
  const [studentAnswers, setStudentAnswers] = useState<Record<string, number | null>>({})
  const [secondsRemaining, setSecondsRemaining] = useState<number>(600)
  const timeSpentRef = useRef<number>(0)
  const answersRef = useRef<Record<string, number | null>>({})

  useEffect(() => {
    answersRef.current = studentAnswers
  }, [studentAnswers])

  // Modals state
  const [resultModalOpen, setResultModalOpen] = useState<boolean>(false)
  const [latestAttempt, setLatestAttempt] = useState<QuizAttempt | null>(null)
  const [addQuestionModalOpen, setAddQuestionModalOpen] = useState<boolean>(false)

  // Bank filters
  const [bankSearch, setBankSearch] = useState('')
  const [bankSubjectFilter, setBankSubjectFilter] = useState('all')
  const [bankDifficultyFilter, setBankDifficultyFilter] = useState<string>('all')

  // Add Question Form State
  const [newSubject, setNewSubject] = useState('General Science')
  const [newClass, setNewClass] = useState('Class 10')
  const [newChapter, setNewChapter] = useState('')
  const [newQuestionText, setNewQuestionText] = useState('')
  const [newOptionA, setNewOptionA] = useState('')
  const [newOptionB, setNewOptionB] = useState('')
  const [newOptionC, setNewOptionC] = useState('')
  const [newOptionD, setNewOptionD] = useState('')
  const [newCorrectIndex, setNewCorrectIndex] = useState<number>(0)
  const [newExplanation, setNewExplanation] = useState('')
  const [newDifficulty, setNewDifficulty] = useState<QuizDifficulty>('easy')

  const currentQuiz = useMemo(
    () => quizzes.find((q) => q.id === activeQuizId) || quizzes[0],
    [quizzes, activeQuizId],
  )

  // Summary KPIs
  const totalModelTests = quizzes.length
  const totalBankQuestions = questionBank.length
  const totalSubmissions = attempts.length
  const averageAccuracy = useMemo(() => {
    if (attempts.length === 0) return 0
    const sum = attempts.reduce((acc, a) => acc + a.accuracy, 0)
    return Math.round((sum / attempts.length) * 10) / 10
  }, [attempts])

  // Filtered Question Bank
  const filteredBank = useMemo(() => {
    return questionBank.filter((q) => {
      const matchSearch =
        !bankSearch ||
        q.questionText.toLowerCase().includes(bankSearch.toLowerCase()) ||
        q.chapter.toLowerCase().includes(bankSearch.toLowerCase()) ||
        q.subject.toLowerCase().includes(bankSearch.toLowerCase())
      const matchSubject =
        bankSubjectFilter === 'all' || q.subject === bankSubjectFilter
      const matchDiff =
        bankDifficultyFilter === 'all' || q.difficulty === bankDifficultyFilter
      return matchSearch && matchSubject && matchDiff
    })
  }, [questionBank, bankSearch, bankSubjectFilter, bankDifficultyFilter])

  // Submit attempt callback
  const handleSubmitQuiz = useCallback(async () => {
    if (!currentQuiz) return

    setIsQuizActive(false)

    try {
      const attempt = await submitAttemptMutation.mutateAsync({
        quizId: currentQuiz.id,
        studentId: 'STD-2026-001',
        studentName: 'Tanvir Ahmed',
        studentNameBn: 'তানভীর আহমেদ',
        rollNo: '01',
        className: currentQuiz.className,
        section: 'A',
        answers: answersRef.current,
        timeSpentSeconds: timeSpentRef.current,
      })

      setLatestAttempt(attempt)
      setResultModalOpen(true)
      toast.show({
        tone: 'success',
        title: 'Quiz Submitted',
        message: `Your attempt has been evaluated: Score ${attempt.score} / ${attempt.maxScore}`,
      })
    } catch {
      toast.show({
        tone: 'danger',
        title: 'Error',
        message: 'Failed to submit quiz attempt.',
      })
    }
  }, [currentQuiz, submitAttemptMutation, toast])

  // Timer countdown
  useEffect(() => {
    if (!isQuizActive) return

    const interval = window.setInterval(() => {
      timeSpentRef.current += 1
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          void handleSubmitQuiz()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isQuizActive, handleSubmitQuiz])

  // Start live quiz
  const handleStartLiveQuiz = (quiz: QuizModelTest) => {
    setActiveQuizId(quiz.id)
    setCurrentQuestionIndex(0)
    setStudentAnswers({})
    timeSpentRef.current = 0
    setSecondsRemaining(quiz.durationMinutes * 60)
    setIsQuizActive(true)
    setActiveTab('live')
  }

  // Answer selection
  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setStudentAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }))
  }

  const handleClearOption = (questionId: string) => {
    setStudentAnswers((prev) => ({
      ...prev,
      [questionId]: null,
    }))
  }

  // PDF Download for attempt
  const handleDownloadDiagnosticPdf = (attempt: QuizAttempt) => {
    const quiz = quizzes.find((q) => q.id === attempt.quizId) || currentQuiz
    const bytes = createQuizPerformanceReportPdf(attempt, quiz, SCHOOL_DETAILS)
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Quiz_Diagnostic_${attempt.rollNo}_${attempt.studentName.replace(/\s+/g, '_')}.pdf`
    a.click()
    URL.revokeObjectURL(url)
    toast.show({
      tone: 'success',
      title: 'Report Downloaded',
      message: 'Official Vector A4 Quiz Diagnostic Report generated.',
    })
  }

  // Add Question to bank
  const handleAddQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQuestionText || !newOptionA || !newOptionB) {
      toast.show({
        tone: 'danger',
        title: 'Validation Error',
        message: 'Please provide question text and at least options A and B.',
      })
      return
    }

    try {
      await createQuestionMutation.mutateAsync({
        subject: newSubject,
        className: newClass,
        chapter: newChapter || 'General Topic',
        questionText: newQuestionText,
        options: [newOptionA, newOptionB, newOptionC || 'Option C', newOptionD || 'Option D'],
        correctOptionIndex: newCorrectIndex,
        explanation: newExplanation || 'Direct concept explanation based on NCTB curriculum standard.',
        marks: 1,
        difficulty: newDifficulty,
      })

      setAddQuestionModalOpen(false)
      setNewQuestionText('')
      setNewChapter('')
      setNewOptionA('')
      setNewOptionB('')
      setNewOptionC('')
      setNewOptionD('')
      setNewExplanation('')
      toast.show({
        tone: 'success',
        title: 'Question Added',
        message: t('quizzes.addModal.success'),
      })
    } catch {
      toast.show({
        tone: 'danger',
        title: 'Error',
        message: 'Failed to create question.',
      })
    }
  }

  // Live Quiz current question
  const activeQuestions = currentQuiz?.questions || EMPTY_QUESTIONS
  const currentQ = activeQuestions[currentQuestionIndex]
  const answeredCount = Object.values(studentAnswers).filter((a) => a !== null && a !== undefined).length

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-white shadow-sm">
              <CheckSquare size={22} />
            </span>
            <span>{t('quizzes.title')}</span>
          </div>
        }
        sub={t('quizzes.subtitle')}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setAddQuestionModalOpen(true)}
              className="flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={16} />
              <span>{t('quizzes.bank.addQuestion')}</span>
            </Button>
          </div>
        }
      />

      {/* Top Summary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI
          icon={CheckSquare}
          label={t('quizzes.kpis.activeTests')}
          value={String(totalModelTests)}
          delta="Active sets"
          deltaTone="up"
          footer="NCTB Curriculum Aligned"
        />

        <KPI
          icon={BookOpen}
          label={t('quizzes.kpis.bankItems')}
          value={String(totalBankQuestions)}
          delta="Multi-subject pool"
          deltaTone="up"
          footer="Classes 6 to 10"
        />

        <KPI
          icon={Award}
          label={t('quizzes.kpis.submissions')}
          value={String(totalSubmissions)}
          delta="Evaluated attempts"
          deltaTone="neutral"
          footer="Auto-graded with analytics"
        />

        <KPI
          icon={Clock}
          label={t('quizzes.kpis.avgAccuracy')}
          value={`${averageAccuracy}%`}
          delta={averageAccuracy >= 75 ? 'Optimal' : 'Needs Practice'}
          deltaTone={averageAccuracy >= 75 ? 'up' : 'down'}
          footer="Average Student Passing"
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border pb-3">
        <Segmented<TabType>
          value={activeTab}
          onChange={(tab) => setActiveTab(tab)}
          options={[
            { value: 'tests', label: t('quizzes.tabs.tests') },
            { value: 'live', label: t('quizzes.tabs.live') },
            { value: 'bank', label: t('quizzes.tabs.bank') },
            { value: 'results', label: t('quizzes.tabs.results') },
          ]}
        />
      </div>

      {/* TAB 1: MODEL TESTS LIST */}
      {activeTab === 'tests' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="flex flex-col justify-between rounded-lg border border-border bg-surface p-5 shadow-sm hover:border-border-strong transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <Badge tone="info">{quiz.subject}</Badge>
                  <span className="text-xs font-semibold text-fg-3 uppercase">
                    {quiz.className}
                  </span>
                </div>

                <h3 className="mt-3 text-lg font-bold text-fg-1 leading-snug">
                  {lang === 'bn' && quiz.titleBn ? quiz.titleBn : quiz.title}
                </h3>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-fg-3 bg-neutral-50 p-3 rounded border border-neutral-100">
                  <div>
                    <span className="font-semibold text-fg-2">{t('quizzes.testCard.duration')}:</span>{' '}
                    {quiz.durationMinutes} {t('quizzes.testCard.mins')}
                  </div>
                  <div>
                    <span className="font-semibold text-fg-2">{t('quizzes.testCard.questions')}:</span>{' '}
                    {quiz.questions.length}
                  </div>
                  <div>
                    <span className="font-semibold text-fg-2">{t('quizzes.testCard.marks')}:</span>{' '}
                    {quiz.totalMarks} ({t('quizzes.testCard.passMarks')}: {quiz.passMarks})
                  </div>
                  <div>
                    <span className="font-semibold text-fg-2">{t('quizzes.testCard.negativeMarking')}:</span>{' '}
                    {quiz.negativeMarkingRate > 0
                      ? `-${quiz.negativeMarkingRate}`
                      : t('quizzes.testCard.noPenalty')}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-4">
                <Button
                  variant="primary"
                  onClick={() => handleStartLiveQuiz(quiz)}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <Send size={14} />
                  <span>{t('quizzes.testCard.startTest')}</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: LIVE QUIZ TAKER */}
      {activeTab === 'live' && (
        <div>
          {!isQuizActive ? (
            <div className="rounded-lg border border-border bg-surface p-8 text-center shadow-sm max-w-lg mx-auto space-y-4">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-tint text-primary">
                <HelpCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-fg-1">{t('quizzes.live.selectQuizPrompt')}</h3>
              <p className="text-sm text-fg-3">
                Timed model tests automatically apply negative marking for wrong answers. Make sure you are ready before starting.
              </p>

              <div className="pt-2">
                <Select
                  value={activeQuizId}
                  onChange={(e) => setActiveQuizId(e.target.value)}
                  className="font-medium"
                >
                  {quizzes.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.title} ({q.questions.length} questions | {q.durationMinutes}m)
                    </option>
                  ))}
                </Select>
              </div>

              <Button
                variant="primary"
                onClick={() => handleStartLiveQuiz(currentQuiz)}
                className="w-full flex items-center justify-center gap-2 mt-4"
              >
                <Clock size={16} />
                <span>{t('quizzes.live.startNow')}</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Quiz Header with Timer */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface p-4 shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge tone="info">{currentQuiz.subject}</Badge>
                    <span className="text-xs text-fg-3">{currentQuiz.className}</span>
                  </div>
                  <h2 className="mt-1 text-lg font-bold text-fg-1">{currentQuiz.title}</h2>
                </div>

                {/* Countdown Timer */}
                <div
                  className={`flex items-center gap-2 rounded-md px-4 py-2 text-base font-mono font-bold shadow-inner ${
                    secondsRemaining < 120
                      ? 'bg-rose-100 text-rose-700 animate-pulse'
                      : 'bg-neutral-100 text-fg-1'
                  }`}
                >
                  <Clock size={18} />
                  <span>{formatQuizDuration(secondsRemaining)}</span>
                </div>
              </div>

              {/* Main Quiz Area: Question Card + Question Navigator */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                {/* Question Navigator Palette */}
                <div className="rounded-lg border border-border bg-surface p-4 shadow-sm lg:col-span-1 space-y-4">
                  <h4 className="text-sm font-semibold text-fg-1 border-b border-border pb-2 flex items-center justify-between">
                    <span>{t('quizzes.live.questionPalette')}</span>
                    <span className="text-xs text-fg-3 font-normal">
                      {answeredCount} / {activeQuestions.length} answered
                    </span>
                  </h4>

                  <div className="grid grid-cols-5 gap-2">
                    {activeQuestions.map((q, idx) => {
                      const isAnswered =
                        studentAnswers[q.id] !== null && studentAnswers[q.id] !== undefined
                      const isCurrent = idx === currentQuestionIndex

                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => setCurrentQuestionIndex(idx)}
                          className={`grid h-9 w-9 place-items-center rounded-md text-xs font-bold transition-all ${
                            isCurrent
                              ? 'ring-2 ring-primary border-primary bg-primary text-white'
                              : isAnswered
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-neutral-100 text-fg-2 hover:bg-neutral-200'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      )
                    })}
                  </div>

                  <div className="pt-4 border-t border-border">
                    <Button
                      variant="primary"
                      onClick={handleSubmitQuiz}
                      className="w-full flex items-center justify-center gap-1.5"
                    >
                      <Send size={15} />
                      <span>{t('quizzes.live.submitQuiz')}</span>
                    </Button>
                  </div>
                </div>

                {/* Current Question Display */}
                {currentQ && (
                  <div className="rounded-lg border border-border bg-surface p-6 shadow-sm lg:col-span-3 space-y-6">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <span className="text-xs font-semibold uppercase text-fg-3">
                        Question {currentQuestionIndex + 1} of {activeQuestions.length}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge tone={getDifficultyTone(currentQ.difficulty)}>
                          {currentQ.difficulty.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-fg-3 font-medium">
                          {currentQ.chapter}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-semibold text-fg-1 leading-relaxed">
                      {lang === 'bn' && currentQ.questionTextBn
                        ? currentQ.questionTextBn
                        : currentQ.questionText}
                    </h3>

                    {/* Options (A, B, C, D) */}
                    <div className="space-y-3">
                      {(lang === 'bn' && currentQ.optionsBn ? currentQ.optionsBn : currentQ.options).map(
                        (opt, optIdx) => {
                          const isSelected = studentAnswers[currentQ.id] === optIdx
                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => handleSelectOption(currentQ.id, optIdx)}
                              className={`w-full text-left flex items-center gap-3 p-3.5 rounded-lg border transition-all ${
                                isSelected
                                  ? 'border-primary bg-primary-tint/30 text-fg-1 ring-1 ring-primary'
                                  : 'border-border bg-surface text-fg-2 hover:bg-neutral-50'
                              }`}
                            >
                              <span
                                className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold transition-colors ${
                                  isSelected
                                    ? 'bg-primary text-white'
                                    : 'bg-neutral-100 text-fg-3'
                                }`}
                              >
                                {OPTION_LETTERS[optIdx]}
                              </span>
                              <span className="text-sm font-medium">{opt}</span>
                            </button>
                          )
                        },
                      )}
                    </div>

                    {/* Bottom controls */}
                    <div className="flex items-center justify-between border-t border-border pt-4">
                      <Button
                        variant="secondary"
                        disabled={currentQuestionIndex === 0}
                        onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                        className="flex items-center gap-1 text-xs"
                      >
                        <ChevronLeft size={14} />
                        <span>Previous</span>
                      </Button>

                      {studentAnswers[currentQ.id] !== null && studentAnswers[currentQ.id] !== undefined && (
                        <Button
                          variant="secondary"
                          onClick={() => handleClearOption(currentQ.id)}
                          className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700"
                        >
                          <RotateCcw size={13} />
                          <span>{t('quizzes.live.clearSelection')}</span>
                        </Button>
                      )}

                      {currentQuestionIndex < activeQuestions.length - 1 ? (
                        <Button
                          variant="secondary"
                          onClick={() =>
                            setCurrentQuestionIndex((prev) =>
                              Math.min(activeQuestions.length - 1, prev + 1),
                            )
                          }
                          className="flex items-center gap-1 text-xs"
                        >
                          <span>Next</span>
                          <ChevronRight size={14} />
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          onClick={handleSubmitQuiz}
                          className="flex items-center gap-1.5 text-xs"
                        >
                          <Send size={14} />
                          <span>{t('quizzes.live.submitQuiz')}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: QUESTION BANK */}
      {activeTab === 'bank' && (
        <div className="rounded-lg border border-border bg-surface p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
            <div className="flex flex-wrap items-center gap-3">
              <SearchInput
                placeholder={t('quizzes.bank.searchPlaceholder')}
                value={bankSearch}
                onChange={(e) => setBankSearch(e.target.value)}
                className="w-72"
              />

              <Select
                value={bankSubjectFilter}
                onChange={(e) => setBankSubjectFilter(e.target.value)}
                className="w-40"
              >
                <option value="all">{t('quizzes.bank.filterSubject')}</option>
                <option value="General Science">General Science</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Bangla">Bangla</option>
                <option value="ICT">ICT</option>
              </Select>

              <Select
                value={bankDifficultyFilter}
                onChange={(e) => setBankDifficultyFilter(e.target.value)}
                className="w-36"
              >
                <option value="all">{t('quizzes.bank.filterDifficulty')}</option>
                <option value="easy">{t('quizzes.bank.easy')}</option>
                <option value="medium">{t('quizzes.bank.medium')}</option>
                <option value="hard">{t('quizzes.bank.hard')}</option>
              </Select>
            </div>

            <Button
              variant="primary"
              onClick={() => setAddQuestionModalOpen(true)}
              className="flex items-center gap-1.5 text-xs"
            >
              <Plus size={15} />
              <span>{t('quizzes.bank.addQuestion')}</span>
            </Button>
          </div>

          <div className="space-y-4">
            {filteredBank.map((q, idx) => (
              <div
                key={q.id}
                className="rounded-md border border-border p-4 hover:border-border-strong transition-all bg-surface"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-fg-3">#{idx + 1}</span>
                    <Badge tone="info">{q.subject}</Badge>
                    <span className="text-xs text-fg-3">{q.className} &bull; {q.chapter}</span>
                  </div>
                  <Badge tone={getDifficultyTone(q.difficulty)}>
                    {q.difficulty.toUpperCase()}
                  </Badge>
                </div>

                <p className="mt-2 text-sm font-semibold text-fg-1">
                  {lang === 'bn' && q.questionTextBn ? q.questionTextBn : q.questionText}
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  {q.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className={`p-2 rounded border ${
                        oIdx === q.correctOptionIndex
                          ? 'border-emerald-400 bg-emerald-50/60 font-semibold text-emerald-800'
                          : 'border-border bg-neutral-50/40 text-fg-2'
                      }`}
                    >
                      <span className="mr-1 font-bold">{OPTION_LETTERS[oIdx]}:</span> {opt}
                    </div>
                  ))}
                </div>

                {q.explanation && (
                  <p className="mt-2 text-xs text-fg-3 bg-neutral-50 p-2 rounded">
                    <strong>{t('quizzes.modal.explanation')}:</strong> {q.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: RESULTS & LEADERBOARD */}
      {activeTab === 'results' && (
        <div className="rounded-lg border border-border bg-surface p-6 shadow-sm space-y-6">
          <div className="border-b border-border pb-3">
            <h3 className="text-base font-semibold text-fg-1">{t('quizzes.tabs.results')}</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-neutral-50 text-xs font-semibold uppercase text-fg-3">
                <tr>
                  <th className="px-4 py-2.5">{t('quizzes.results.student')}</th>
                  <th className="px-4 py-2.5">{t('quizzes.results.test')}</th>
                  <th className="px-4 py-2.5">{t('quizzes.results.score')}</th>
                  <th className="px-4 py-2.5">{t('quizzes.results.status')}</th>
                  <th className="px-4 py-2.5">Accuracy</th>
                  <th className="px-4 py-2.5">{t('quizzes.results.time')}</th>
                  <th className="px-4 py-2.5 text-right">{t('quizzes.results.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {attempts.map((att) => (
                  <tr key={att.id} className="hover:bg-neutral-50/50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-fg-1">
                        {lang === 'bn' && att.studentNameBn ? att.studentNameBn : att.studentName}
                      </div>
                      <div className="text-xs text-fg-3">
                        {att.className} ({att.section}) &bull; Roll #{att.rollNo}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-fg-1">{att.quizTitle}</td>
                    <td className="px-4 py-3 font-mono font-bold text-fg-1">
                      {att.score} / {att.maxScore}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={att.passed ? 'success' : 'danger'}>
                        {att.passed ? t('quizzes.modal.passed') : t('quizzes.modal.failed')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-fg-2">
                      {att.accuracy}%
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-fg-3">
                      {formatQuizDuration(att.timeSpentSeconds)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="secondary"
                        onClick={() => handleDownloadDiagnosticPdf(att)}
                        className="text-xs flex items-center gap-1.5 ml-auto"
                      >
                        <Download size={13} />
                        <span>PDF Report</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* POST-SUBMISSION RESULT DIAGNOSTIC MODAL */}
      <Modal
        open={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        title={t('quizzes.modal.resultTitle')}
        sub={latestAttempt?.quizTitle}
        width={640}
      >
        {latestAttempt && (
          <div className="space-y-6">
            {/* Score Banner */}
            <div className="rounded-lg bg-neutral-50 p-4 border border-border flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-semibold text-fg-3">
                  {t('quizzes.modal.scoreLabel')}
                </span>
                <div className="text-3xl font-extrabold text-primary">
                  {latestAttempt.score} / {latestAttempt.maxScore}
                </div>
                <div className="text-xs text-fg-3 mt-1">
                  Time Spent: {formatQuizDuration(latestAttempt.timeSpentSeconds)}
                </div>
              </div>

              <div className="text-right space-y-1">
                <Badge tone={latestAttempt.passed ? 'success' : 'danger'}>
                  {latestAttempt.passed ? t('quizzes.modal.passed') : t('quizzes.modal.failed')}
                </Badge>
                <div className="text-sm font-semibold text-fg-1">
                  {t('quizzes.modal.accuracyLabel')}: {latestAttempt.accuracy}%
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs font-semibold">
              <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded border border-emerald-200">
                <div className="text-base font-bold">{latestAttempt.correctCount}</div>
                <div>{t('quizzes.modal.correct')}</div>
              </div>
              <div className="bg-rose-50 text-rose-800 p-2.5 rounded border border-rose-200">
                <div className="text-base font-bold">{latestAttempt.incorrectCount}</div>
                <div>{t('quizzes.modal.incorrect')}</div>
              </div>
              <div className="bg-neutral-100 text-fg-2 p-2.5 rounded border border-neutral-200">
                <div className="text-base font-bold">{latestAttempt.unansweredCount}</div>
                <div>{t('quizzes.modal.unanswered')}</div>
              </div>
            </div>

            {/* Question by question evaluations */}
            <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
              {latestAttempt.evaluations.map((ev, idx) => (
                <div
                  key={idx}
                  className="rounded border border-border p-3 text-xs bg-surface space-y-1"
                >
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-fg-1 font-semibold">
                      Q{idx + 1}: {ev.questionText}
                    </span>
                    <span className="flex items-center gap-1">
                      {ev.isCorrect ? (
                        <CheckCircle2 size={16} className="text-emerald-600" />
                      ) : ev.isUnanswered ? (
                        <QuestionIcon size={16} className="text-neutral-400" />
                      ) : (
                        <XCircle size={16} className="text-rose-600" />
                      )}
                    </span>
                  </div>
                  <div className="flex gap-4 text-fg-3 pt-1">
                    <span>
                      Your Choice: <strong>{ev.selectedOption !== null ? OPTION_LETTERS[ev.selectedOption] : 'None'}</strong>
                    </span>
                    <span>
                      Correct Key: <strong>{OPTION_LETTERS[ev.correctOption]}</strong>
                    </span>
                    <span>
                      Marks: <strong>{ev.marksAwarded > 0 ? `+${ev.marksAwarded}` : ev.marksAwarded}</strong>
                    </span>
                  </div>
                  {ev.explanation && (
                    <p className="text-[11px] text-fg-3 bg-neutral-50 p-1.5 rounded mt-1">
                      {ev.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <Button
                variant="secondary"
                onClick={() => setResultModalOpen(false)}
              >
                {t('quizzes.modal.close')}
              </Button>
              <Button
                variant="primary"
                onClick={() => handleDownloadDiagnosticPdf(latestAttempt)}
                className="flex items-center gap-1.5"
              >
                <Download size={14} />
                <span>{t('quizzes.modal.downloadPdf')}</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ADD QUESTION MODAL */}
      <Modal
        open={addQuestionModalOpen}
        onClose={() => setAddQuestionModalOpen(false)}
        title={t('quizzes.addModal.title')}
        width={580}
      >
        <form onSubmit={handleAddQuestionSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('quizzes.addModal.subjectLabel')} required>
              <Select
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
              >
                <option value="General Science">General Science</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Bangla">Bangla</option>
                <option value="ICT">ICT</option>
                <option value="Physics">Physics</option>
              </Select>
            </Field>

            <Field label={t('quizzes.addModal.classLabel')} required>
              <Select
                value={newClass}
                onChange={(e) => setNewClass(e.target.value)}
              >
                <option value="Class 10">Class 10</option>
                <option value="Class 9">Class 9</option>
                <option value="Class 8">Class 8</option>
                <option value="Class 7">Class 7</option>
                <option value="Class 6">Class 6</option>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('quizzes.addModal.chapterLabel')} required>
              <Input
                value={newChapter}
                onChange={(e) => setNewChapter(e.target.value)}
                placeholder="e.g. Chapter 4: Photosynthesis"
                required
              />
            </Field>

            <Field label={t('quizzes.bank.difficulty')}>
              <Select
                value={newDifficulty}
                onChange={(e) => setNewDifficulty(e.target.value as QuizDifficulty)}
              >
                <option value="easy">{t('quizzes.bank.easy')}</option>
                <option value="medium">{t('quizzes.bank.medium')}</option>
                <option value="hard">{t('quizzes.bank.hard')}</option>
              </Select>
            </Field>
          </div>

          <Field label={t('quizzes.addModal.questionTextLabel')} required>
            <Textarea
              rows={2}
              value={newQuestionText}
              onChange={(e) => setNewQuestionText(e.target.value)}
              placeholder="Enter question statement..."
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Option A" required>
              <Input
                value={newOptionA}
                onChange={(e) => setNewOptionA(e.target.value)}
                placeholder="First option"
                required
              />
            </Field>
            <Field label="Option B" required>
              <Input
                value={newOptionB}
                onChange={(e) => setNewOptionB(e.target.value)}
                placeholder="Second option"
                required
              />
            </Field>
            <Field label="Option C">
              <Input
                value={newOptionC}
                onChange={(e) => setNewOptionC(e.target.value)}
                placeholder="Third option"
              />
            </Field>
            <Field label="Option D">
              <Input
                value={newOptionD}
                onChange={(e) => setNewOptionD(e.target.value)}
                placeholder="Fourth option"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('quizzes.addModal.correctKeyLabel')} required>
              <Select
                value={newCorrectIndex}
                onChange={(e) => setNewCorrectIndex(Number(e.target.value))}
              >
                <option value={0}>Option A</option>
                <option value={1}>Option B</option>
                <option value={2}>Option C</option>
                <option value={3}>Option D</option>
              </Select>
            </Field>
            <Field label={t('quizzes.addModal.explanationLabel')}>
              <Input
                value={newExplanation}
                onChange={(e) => setNewExplanation(e.target.value)}
                placeholder="Brief justification"
              />
            </Field>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAddQuestionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createQuestionMutation.isPending}
            >
              {t('quizzes.addModal.save')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
