import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Students from '@/pages/Students'
import i18n from '@/i18n'
import type { StudentWithClass } from '@/data/students'

const mockStudentsList: StudentWithClass[] = [
  {
    id: 's-1',
    school_id: 'sch-1',
    class_id: 'c-1',
    profile_id: null,
    roll_no: '01',
    full_name: 'Tanvir Ahmed',
    dob: '2012-01-10',
    avatar_url: null,
    status: 'active',
    class_name: 'Class 7-A',
  },
  {
    id: 's-2',
    school_id: 'sch-1',
    class_id: 'c-1',
    profile_id: null,
    roll_no: '02',
    full_name: 'Sadia Sultana',
    dob: '2012-04-18',
    avatar_url: null,
    status: 'active',
    class_name: 'Class 7-A',
  },
]

const mockClassesList = [
  { id: 'c-1', school_id: 'sch-1', name: 'Class 7-A', grade: '7', teacher_id: null },
]

vi.mock('@/auth/context', () => ({
  useAuth: () => ({
    user: { id: 'u-1' },
    profile: { id: 'u-1', school_id: 'sch-1', role: 'admin' },
  }),
}))

vi.mock('@/data/students', () => ({
  useStudents: () => ({
    data: mockStudentsList,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useClasses: () => ({
    data: mockClassesList,
    isPending: false,
  }),
  useAddStudent: () => ({
    mutateAsync: vi.fn(),
  }),
  useImportStudents: () => ({
    mutateAsync: vi.fn(),
  }),
  uploadAvatar: vi.fn(),
}))

describe('Students Component (Phase 10: Student ID Card & Roster Selection)', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    vi.clearAllMocks()
  })

  it('renders student list table with rows, roll numbers, and classes', () => {
    render(
      <MemoryRouter>
        <Students />
      </MemoryRouter>,
    )

    expect(screen.getByText('Tanvir Ahmed')).toBeInTheDocument()
    expect(screen.getByText('Sadia Sultana')).toBeInTheDocument()
    expect(screen.getByText('01')).toBeInTheDocument()
    expect(screen.getByText('02')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Print Class ID Cards/i })).toBeInTheDocument()
  })

  it('shows selection action bar when students are selected via checkboxes', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Students />
      </MemoryRouter>,
    )

    // Select first student
    const check1 = screen.getByRole('checkbox', { name: 'Select Tanvir Ahmed' })
    await user.click(check1)

    // Action bar is revealed
    expect(screen.getByText(/1 students selected/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Generate ID Cards \(1\)/i })).toBeInTheDocument()

    // Select second student
    const check2 = screen.getByRole('checkbox', { name: 'Select Sadia Sultana' })
    await user.click(check2)

    expect(screen.getByText(/2 students selected/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Generate ID Cards \(2\)/i })).toBeInTheDocument()
  })

  it('toggles select-all with the table header checkbox', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Students />
      </MemoryRouter>,
    )

    const selectAllCheck = screen.getByRole('checkbox', { name: 'Select all students' })
    await user.click(selectAllCheck)

    expect(screen.getByText(/2 students selected/i)).toBeInTheDocument()

    // Unselect all
    await user.click(selectAllCheck)
    expect(screen.queryByText(/2 students selected/i)).not.toBeInTheDocument()
  })

  it('opens batch Student ID card modal when clicking generate from selection bar', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Students />
      </MemoryRouter>,
    )

    // Select all
    const selectAllCheck = screen.getByRole('checkbox', { name: 'Select all students' })
    await user.click(selectAllCheck)

    const generateBtn = screen.getByRole('button', { name: /Generate ID Cards \(2\)/i })
    await user.click(generateBtn)

    // Modal opens with batch title and card preview
    expect(screen.getByText(/Batch Student ID Cards \(2\)/i)).toBeInTheDocument()
    expect(screen.getByTestId('id-card-front')).toBeInTheDocument()
    expect(screen.getAllByText('Tanvir Ahmed').length).toBeGreaterThanOrEqual(2)
  })

  it('opens single student ID card modal from row action button', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Students />
      </MemoryRouter>,
    )

    const singleIdCardBtn = screen.getByRole('button', { name: /Student ID Card Tanvir Ahmed/i })
    await user.click(singleIdCardBtn)

    expect(screen.getByText('Student ID Card')).toBeInTheDocument()
    expect(screen.getByTestId('id-card-front')).toBeInTheDocument()
    expect(screen.getAllByText('Tanvir Ahmed').length).toBeGreaterThanOrEqual(2)
  })
})
