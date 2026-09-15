import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import OnlineQuizzes from '@/pages/OnlineQuizzes'
import { resetQuizStore } from '@/data/quizzes'
import { ToastProvider } from '@/components/ui/Toast'
import i18n from '@/i18n'

vi.mock('@/auth/context', () => ({
  useAuth: () => ({
    user: { id: 'u-teacher-1' },
    profile: { id: 'u-teacher-1', school_id: 'sch-1', full_name: 'Dr. Shah Alam', role: 'teacher' },
    session: null,
    loading: false,
    refreshProfile: vi.fn(),
    signOut: vi.fn(),
  }),
}))

describe('OnlineQuizzes Component (Phase 21: Online MCQ Quiz & Model Test Engine)', () => {
  let queryClient: QueryClient

  beforeEach(async () => {
    resetQuizStore()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    await i18n.changeLanguage('en')
    vi.clearAllMocks()
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-quiz-url')
    window.URL.revokeObjectURL = vi.fn()
  })

  function renderOnlineQuizzes() {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ToastProvider>
            <OnlineQuizzes />
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }

  it('renders page header, 4 summary KPIs, and initial model test cards', () => {
    renderOnlineQuizzes()

    expect(screen.getByText('Online Quizzes & Model Test Engine')).toBeInTheDocument()
    expect(screen.getByText('Active Model Tests')).toBeInTheDocument()
    expect(screen.getByText('Question Bank Items')).toBeInTheDocument()
    expect(screen.getByText('Student Submissions')).toBeInTheDocument()
    expect(screen.getByText('Average Accuracy')).toBeInTheDocument()

    // Model test cards
    expect(screen.getByText('SSC Model Test 2026: General Science & ICT')).toBeInTheDocument()
    expect(screen.getByText('Class 9 Mathematics Speed Test: Algebra & Geometry')).toBeInTheDocument()
    expect(screen.getByText('Class 8 Bangla 2nd Paper Grammar Assessment')).toBeInTheDocument()
  })

  it('starts a live quiz, answers questions, and submits for auto-grading', async () => {
    renderOnlineQuizzes()

    // 1. Click "Take Quiz" on the first card
    const takeQuizBtns = screen.getAllByRole('button', { name: /Take Quiz/ })
    fireEvent.click(takeQuizBtns[0])

    // Verify in live taker
    expect(screen.getByText(/Question 1 of 4/)).toBeInTheDocument()
    expect(screen.getByText('Which organelle is universally known as the powerhouse of the cell?')).toBeInTheDocument()

    // 2. Select option B: Mitochondria
    const optMito = screen.getByText('Mitochondria')
    fireEvent.click(optMito)

    // 3. Navigate to Question 2
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText(/Question 2 of 4/)).toBeInTheDocument()
    expect(screen.getByText(/What gas is released as a byproduct/)).toBeInTheDocument()

    // 4. Select Oxygen (O2)
    const optOxygen = screen.getByText('Oxygen (O2)')
    fireEvent.click(optOxygen)

    // 5. Submit Assessment
    const submitBtn = screen.getAllByRole('button', { name: /Submit Assessment/ })[0]
    fireEvent.click(submitBtn)

    // 6. Post-submission diagnostic modal should open
    await waitFor(() => {
      expect(screen.getByText('Assessment Diagnostic Result')).toBeInTheDocument()
      expect(screen.getByText('Total Score')).toBeInTheDocument()
      expect(screen.getByText(/Accuracy Rate/)).toBeInTheDocument()
    })
  })

  it('switches to Question Bank tab, filters questions, and adds a new question', async () => {
    renderOnlineQuizzes()

    // Switch to Question Bank tab
    fireEvent.click(screen.getByRole('button', { name: 'Question Bank' }))

    expect(screen.getByPlaceholderText('Search questions by topic or keyword...')).toBeInTheDocument()
    expect(screen.getByText('Which organelle is universally known as the powerhouse of the cell?')).toBeInTheDocument()

    // Open Add Question modal
    const addBtn = screen.getAllByRole('button', { name: /Add Question/ })
    fireEvent.click(addBtn[0])

    const modal = screen.getByRole('dialog')
    expect(within(modal).getByText('Add Question to NCTB Bank')).toBeInTheDocument()

    // Fill form
    const chapterInput = within(modal).getByPlaceholderText('e.g. Chapter 4: Photosynthesis')
    fireEvent.change(chapterInput, { target: { value: 'Chapter 5: Ecosystem' } })

    const statementInput = within(modal).getByPlaceholderText('Enter question statement...')
    fireEvent.change(statementInput, { target: { value: 'What is the primary energy source of an ecosystem?' } })

    const optAInput = within(modal).getByPlaceholderText('First option')
    fireEvent.change(optAInput, { target: { value: 'Sunlight' } })

    const optBInput = within(modal).getByPlaceholderText('Second option')
    fireEvent.change(optBInput, { target: { value: 'Water' } })

    // Save
    const saveBtn = within(modal).getByRole('button', { name: 'Save Question' })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(screen.getByText('What is the primary energy source of an ecosystem?')).toBeInTheDocument()
    })
  })

  it('switches to Results tab and downloads diagnostic PDF report', () => {
    renderOnlineQuizzes()

    // Switch to Results & Leaderboard tab
    fireEvent.click(screen.getByRole('button', { name: 'Results & Leaderboard' }))

    expect(screen.getByText('Tanvir Ahmed')).toBeInTheDocument()
    expect(screen.getByText('SSC Model Test 2026: General Science & ICT')).toBeInTheDocument()

    const downloadPdfBtn = screen.getByRole('button', { name: /PDF Report/ })
    fireEvent.click(downloadPdfBtn)

    expect(window.URL.createObjectURL).toHaveBeenCalled()
  })
})
