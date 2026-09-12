import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Exams from '@/pages/Exams'
import i18n from '@/i18n'
import type { ExamWithStats } from '@/data/exams'

const mockExams: ExamWithStats[] = [
  {
    id: 'exam-1',
    school_id: 'sch-1',
    class_id: 'c-7',
    class_name: 'Class 7',
    subject_id: 'sub-math',
    subject_name: 'Mathematics',
    name: 'Half-Yearly Math',
    exam_date: '2026-06-15',
    total_marks: 100,
    state: 'scheduled',
    created_at: '2026-05-01T00:00:00Z',
    results_count: 0,
    avg_pct: null,
  },
  {
    id: 'exam-2',
    school_id: 'sch-1',
    class_id: 'c-8',
    class_name: 'Class 8',
    subject_id: 'sub-sci',
    subject_name: 'General Science',
    name: 'Half-Yearly Science',
    exam_date: '2026-06-17',
    total_marks: 100,
    state: 'scheduled',
    created_at: '2026-05-01T00:00:00Z',
    results_count: 0,
    avg_pct: null,
  },
]

const mockClasses = [
  { id: 'c-7', school_id: 'sch-1', name: 'Class 7', grade: '7', teacher_id: 't-1' },
  { id: 'c-8', school_id: 'sch-1', name: 'Class 8', grade: '8', teacher_id: 't-2' },
]

const mockSubjects = [
  { id: 'sub-math', school_id: 'sch-1', name: 'Mathematics', code: 'MTH-101' },
  { id: 'sub-sci', school_id: 'sch-1', name: 'General Science', code: 'SCI-101' },
]

const mockCreateExamRoutinePdf = vi.fn(() => new Uint8Array([37, 80, 68, 70]))

vi.mock('@/auth/context', () => ({
  useAuth: () => ({
    user: { id: 'u-1' },
    profile: { id: 'u-1', school_id: 'sch-1', role: 'admin' },
  }),
}))

vi.mock('@/data/exams', () => ({
  useExams: () => ({
    data: mockExams,
    isPending: false,
    isError: false,
  }),
  useExamQuestions: () => ({
    data: [],
    isPending: false,
  }),
  useSaveExam: () => ({
    mutate: vi.fn(),
    reset: vi.fn(),
    isPending: false,
  }),
  useDeleteExam: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('@/data/students', () => ({
  useClasses: () => ({
    data: mockClasses,
    isPending: false,
  }),
  useStudents: () => ({
    data: [
      { id: 's-1', class_id: 'c-7', full_name: 'Student 1' },
      { id: 's-2', class_id: 'c-8', full_name: 'Student 2' },
    ],
    isPending: false,
  }),
}))

vi.mock('@/data/assignments', () => ({
  useSubjects: () => ({
    data: mockSubjects,
    isPending: false,
  }),
}))

vi.mock('@/lib/exam-routine-pdf', () => ({
  createExamRoutinePdf: (...args: unknown[]) => mockCreateExamRoutinePdf(...args),
}))

function renderExams() {
  return render(
    <MemoryRouter>
      <Exams />
    </MemoryRouter>,
  )
}

describe('Exams Component (Phase 9: Examination Routine Scheduler)', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    vi.clearAllMocks()
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    window.URL.revokeObjectURL = vi.fn()
  })

  it('renders exams list and KPI metrics on default tab', () => {
    renderExams()

    expect(screen.getByRole('heading', { name: 'Exams' })).toBeInTheDocument()
    expect(screen.getByText('Half-Yearly Math')).toBeInTheDocument()
    expect(screen.getByText('Half-Yearly Science')).toBeInTheDocument()
  })

  it('switches to Exam routine & schedule tab and displays chronological routine matrix', async () => {
    const user = userEvent.setup()
    renderExams()

    const routineTab = screen.getByRole('button', { name: /Exam routine & schedule/i })
    await user.click(routineTab)

    // Table headers & entries
    expect(screen.getByText('Date & day')).toBeInTheDocument()
    expect(screen.getByText('Time slot')).toBeInTheDocument()
    expect(screen.getByText('Subject & code')).toBeInTheDocument()
    expect(screen.getByText('Mathematics')).toBeInTheDocument()
    expect(screen.getByText('General Science')).toBeInTheDocument()

    // Action buttons
    expect(screen.getByRole('button', { name: /Download exam routine \(PDF\)/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Export routine \(CSV\)/i })).toBeInTheDocument()
  })

  it('filters exam routine when a specific class is selected', async () => {
    const user = userEvent.setup()
    renderExams()

    const routineTab = screen.getByRole('button', { name: /Exam routine & schedule/i })
    await user.click(routineTab)

    const classSelector = screen.getByLabelText('Filter by class')
    await user.selectOptions(classSelector, 'c-7')

    // Mathematics (Class 7) should be present, while General Science (Class 8) is filtered out
    expect(screen.getByText('Mathematics')).toBeInTheDocument()
    expect(screen.queryByText('General Science')).not.toBeInTheDocument()
  })

  it('generates and downloads A4 Exam Routine PDF', async () => {
    const user = userEvent.setup()
    renderExams()

    const routineTab = screen.getByRole('button', { name: /Exam routine & schedule/i })
    await user.click(routineTab)

    const downloadPdfBtn = screen.getByRole('button', { name: /Download exam routine \(PDF\)/i })
    await user.click(downloadPdfBtn)

    expect(mockCreateExamRoutinePdf).toHaveBeenCalledTimes(1)
    expect(mockCreateExamRoutinePdf).toHaveBeenCalledWith(
      expect.objectContaining({
        eiin: '108234',
        academicYear: '2026',
        items: expect.arrayContaining([
          expect.objectContaining({
            date: '2026-06-15',
            subjectName: 'Mathematics',
            totalMarks: 100,
          }),
        ]),
      }),
    )
    expect(window.URL.createObjectURL).toHaveBeenCalled()
  })

  it('exports exam routine to CSV format', async () => {
    const user = userEvent.setup()
    renderExams()

    const routineTab = screen.getByRole('button', { name: /Exam routine & schedule/i })
    await user.click(routineTab)

    const exportCsvBtn = screen.getByRole('button', { name: /Export routine \(CSV\)/i })
    await user.click(exportCsvBtn)

    expect(window.URL.createObjectURL).toHaveBeenCalled()
    expect(window.URL.revokeObjectURL).toHaveBeenCalled()
  })
})
