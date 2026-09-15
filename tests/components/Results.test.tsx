import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Results from '@/pages/Results'
import i18n from '@/i18n'

const mockPublishedResults = [
  // Student 1: High performer (All passed)
  {
    id: 'res-1',
    school_id: 'sch-1',
    exam_id: 'ex-math',
    student_id: 's-1',
    marks_obtained: 95,
    exam_total: 100,
    exam_name: 'Mathematics',
    subject_name: 'Mathematics',
    student_name: 'Tanvir Ahmed',
    student_roll: '7A-01',
    published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'res-2',
    school_id: 'sch-1',
    exam_id: 'ex-eng',
    student_id: 's-1',
    marks_obtained: 88,
    exam_total: 100,
    exam_name: 'English',
    subject_name: 'English',
    student_name: 'Tanvir Ahmed',
    student_roll: '7A-01',
    published: true,
    created_at: new Date().toISOString(),
  },
  // Student 2: Moderate performer (All passed)
  {
    id: 'res-3',
    school_id: 'sch-1',
    exam_id: 'ex-math',
    student_id: 's-2',
    marks_obtained: 72,
    exam_total: 100,
    exam_name: 'Mathematics',
    subject_name: 'Mathematics',
    student_name: 'Nusrat Jahan',
    student_roll: '7A-02',
    published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'res-4',
    school_id: 'sch-1',
    exam_id: 'ex-eng',
    student_id: 's-2',
    marks_obtained: 65,
    exam_total: 100,
    exam_name: 'English',
    subject_name: 'English',
    student_name: 'Nusrat Jahan',
    student_roll: '7A-02',
    published: true,
    created_at: new Date().toISOString(),
  },
  // Student 3: Failed in Math (< 33)
  {
    id: 'res-5',
    school_id: 'sch-1',
    exam_id: 'ex-math',
    student_id: 's-3',
    marks_obtained: 28, // Failed
    exam_total: 100,
    exam_name: 'Mathematics',
    subject_name: 'Mathematics',
    student_name: 'Kamal Hossain',
    student_roll: '7A-03',
    published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'res-6',
    school_id: 'sch-1',
    exam_id: 'ex-eng',
    student_id: 's-3',
    marks_obtained: 80,
    exam_total: 100,
    exam_name: 'English',
    subject_name: 'English',
    student_name: 'Kamal Hossain',
    student_roll: '7A-03',
    published: true,
    created_at: new Date().toISOString(),
  },
]

vi.mock('@/auth/context', () => ({
  useAuth: () => ({
    user: { id: 'u-1' },
    profile: { id: 'u-1', school_id: 'sch-1', role: 'admin' },
    session: null,
    loading: false,
    refreshProfile: vi.fn(),
    signOut: vi.fn(),
  }),
}))

vi.mock('@/data/results', () => ({
  useResults: () => ({
    data: mockPublishedResults,
    isPending: false,
    isError: false,
  }),
  useSaveResults: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  gradeFromPct: (pct: number) => (pct >= 80 ? 'A+' : pct >= 70 ? 'A' : pct >= 60 ? 'A-' : pct >= 33 ? 'D' : 'F'),
}))

vi.mock('@/data/exams', () => ({
  useExams: () => ({
    data: [
      { id: 'ex-math', name: 'Mathematics', total_marks: 100, class_id: 'c-1', class_name: 'Class 7' },
      { id: 'ex-eng', name: 'English', total_marks: 100, class_id: 'c-1', class_name: 'Class 7' },
    ],
    isPending: false,
  }),
}))

vi.mock('@/data/students', () => ({
  useStudents: () => ({
    data: [
      { id: 's-1', full_name: 'Tanvir Ahmed', roll_no: '7A-01', class_id: 'c-1' },
      { id: 's-2', full_name: 'Nusrat Jahan', roll_no: '7A-02', class_id: 'c-1' },
      { id: 's-3', full_name: 'Kamal Hossain', roll_no: '7A-03', class_id: 'c-1' },
    ],
    isPending: false,
  }),
}))

describe('Results Page & NCTB Academic Reporting', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    vi.clearAllMocks()
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    window.URL.revokeObjectURL = vi.fn()
  })

  it('renders Gradebook table with student rows, marks, and NCTB merit rankings', () => {
    render(<Results />)

    expect(screen.getByText('Tanvir Ahmed')).toBeInTheDocument()
    expect(screen.getByText('Nusrat Jahan')).toBeInTheDocument()
    expect(screen.getByText('Kamal Hossain')).toBeInTheDocument()

    // Tanvir is #1 merit, Nusrat is #2, Kamal is #3 (failed Math)
    expect(screen.getByText('#1')).toBeInTheDocument()
    expect(screen.getByText('#2')).toBeInTheDocument()
    expect(screen.getByText('#3')).toBeInTheDocument()
  })

  it('displays KPI cards summarizing class academic metrics', () => {
    render(<Results />)

    expect(screen.getByText('Class average')).toBeInTheDocument()
    expect(screen.getByText('Top performer')).toBeInTheDocument()
    expect(screen.getByText('Reports drafted')).toBeInTheDocument()
  })

  it('switches to Reports tab and displays student progress cards with merit badges and pass/fail indicators', async () => {
    const user = userEvent.setup()
    render(<Results />)

    // Click "Report cards" tab
    const reportsTab = screen.getByRole('button', { name: /report cards/i })
    await user.click(reportsTab)

    expect(screen.getByText('Merit #1')).toBeInTheDocument()
    expect(screen.getByText('Merit #2')).toBeInTheDocument()
    expect(screen.getByText('Merit #3')).toBeInTheDocument()

    // Pass and Fail indicators
    expect(screen.getAllByText('Passed').length).toBe(2)
    expect(screen.getByText('Failed')).toBeInTheDocument()
  })

  it('triggers single report card PDF download when download button is clicked', async () => {
    const user = userEvent.setup()
    render(<Results />)

    const reportsTab = screen.getByRole('button', { name: /report cards/i })
    await user.click(reportsTab)

    const downloadButtons = screen.getAllByRole('button', { name: /download pdf report card/i })
    expect(downloadButtons.length).toBeGreaterThan(0)

    await user.click(downloadButtons[0])
    expect(window.URL.createObjectURL).toHaveBeenCalled()
  })

  it('triggers batch report card PDF download for entire class in one click', async () => {
    const user = userEvent.setup()
    render(<Results />)

    const reportsTab = screen.getByRole('button', { name: /report cards/i })
    await user.click(reportsTab)

    const downloadAllBtn = screen.getByRole('button', { name: /download all report cards/i })
    expect(downloadAllBtn).toBeInTheDocument()

    await user.click(downloadAllBtn)
    expect(window.URL.createObjectURL).toHaveBeenCalled()
  })

  it('switches to Tabulation Sheet tab and displays broadsheet matrix with CA and Final totals', async () => {
    const user = userEvent.setup()
    render(<Results />)

    const tabBtn = screen.getByRole('button', { name: /tabulation sheet/i })
    await user.click(tabBtn)

    expect(screen.getByText('Class Tabulation Broadsheet')).toBeInTheDocument()
    expect(screen.getByText('Class 7 (Section A)')).toBeInTheDocument()
    expect(screen.getByText('Academic Session 2026 · Official Tabulation Broadsheet')).toBeInTheDocument()

    // Pass and Fail indicators
    expect(screen.getByText('Pass Rate:')).toBeInTheDocument()
    expect(screen.getByText('GPA 5.0 (A+):')).toBeInTheDocument()
  })

  it('triggers Tabulation Broadsheet PDF download when download button is clicked', async () => {
    const user = userEvent.setup()
    render(<Results />)

    const tabBtn = screen.getByRole('button', { name: /tabulation sheet/i })
    await user.click(tabBtn)

    const downloadButtons = screen.getAllByRole('button', { name: /export tabulation broadsheet \(pdf\)/i })
    expect(downloadButtons.length).toBeGreaterThan(0)

    await user.click(downloadButtons[0])
    expect(window.URL.createObjectURL).toHaveBeenCalled()
  })
})

