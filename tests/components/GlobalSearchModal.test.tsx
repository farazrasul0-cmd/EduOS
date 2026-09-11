import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { GlobalSearchModal } from '@/components/layout/GlobalSearchModal'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/data/students', () => ({
  useStudents: () => ({
    data: [
      {
        id: 's-1',
        full_name: 'Rahim Khan',
        roll_no: '10',
        class_name: 'Class 7A',
      },
      {
        id: 's-2',
        full_name: 'Amina Akter',
        roll_no: '15',
        class_name: 'Class 8B',
      },
    ],
    isLoading: false,
  }),
}))

vi.mock('@/data/fees', () => ({
  useInvoices: () => ({
    data: [
      {
        id: 'inv-1',
        invoice_no: 'INV-2026-001',
        student_name: 'Rahim Khan',
        amount: 2500,
      },
    ],
    isLoading: false,
  }),
}))

vi.mock('@/data/exams', () => ({
  useExams: () => ({
    data: [
      {
        id: 'ex-1',
        name: 'Mid-term Exam',
        subject_name: 'General Science',
      },
    ],
    isLoading: false,
  }),
}))

describe('GlobalSearchModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when open is false', () => {
    render(
      <MemoryRouter>
        <GlobalSearchModal open={false} onClose={vi.fn()} />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders dialog and default navigation routes when opened', () => {
    render(
      <MemoryRouter>
        <GlobalSearchModal open={true} onClose={vi.fn()} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
  })

  it('filters results by search query across students and invoices', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <GlobalSearchModal open={true} onClose={vi.fn()} />
      </MemoryRouter>,
    )

    const input = screen.getByPlaceholderText(/search/i)
    await user.type(input, 'Rahim')

    expect(screen.getByText('Rahim Khan')).toBeInTheDocument()
    expect(screen.getByText('INV-2026-001')).toBeInTheDocument()
  })

  it('closes on Escape keypress', () => {
    const handleClose = vi.fn()
    render(
      <MemoryRouter>
        <GlobalSearchModal open={true} onClose={handleClose} />
      </MemoryRouter>,
    )

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('navigates to student detail when clicking student result', async () => {
    const user = userEvent.setup()
    const handleClose = vi.fn()
    render(
      <MemoryRouter>
        <GlobalSearchModal open={true} onClose={handleClose} />
      </MemoryRouter>,
    )

    const input = screen.getByPlaceholderText(/search/i)
    await user.type(input, 'Amina')

    const aminaOption = screen.getByText('Amina Akter')
    await user.click(aminaOption)

    expect(mockNavigate).toHaveBeenCalledWith('/students/s-2')
    expect(handleClose).toHaveBeenCalled()
  })

  it('navigates with Enter key for the highlighted result', async () => {
    const user = userEvent.setup()
    const handleClose = vi.fn()
    render(
      <MemoryRouter>
        <GlobalSearchModal open={true} onClose={handleClose} />
      </MemoryRouter>,
    )

    const input = screen.getByPlaceholderText(/search/i)
    await user.type(input, 'Science')

    fireEvent.keyDown(window, { key: 'Enter' })
    expect(mockNavigate).toHaveBeenCalledWith('/exams')
    expect(handleClose).toHaveBeenCalled()
  })
})
