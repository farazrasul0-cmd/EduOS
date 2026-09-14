import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Leave from '@/pages/Leave'
import { resetLeaveStore } from '@/data/leave'
import { ToastProvider } from '@/components/ui/Toast'
import i18n from '@/i18n'

vi.mock('@/auth/context', () => ({
  useAuth: () => ({
    user: { id: 'u-1' },
    profile: { id: 'u-1', school_id: 'sch-1', full_name: 'Principal M. A. Karim', role: 'admin' },
    session: null,
    loading: false,
    refreshProfile: vi.fn(),
    signOut: vi.fn(),
  }),
}))

describe('Leave Component (Phase 18: Teacher & Student Leave Management System)', () => {
  let queryClient: QueryClient

  beforeEach(async () => {
    resetLeaveStore()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    await i18n.changeLanguage('en')
    vi.clearAllMocks()
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    window.URL.revokeObjectURL = vi.fn()
  })

  function renderLeave() {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ToastProvider>
            <Leave />
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }

  it('renders leave management page with KPIs and student applications', () => {
    renderLeave()

    expect(screen.getByText('Leave Management')).toBeInTheDocument()
    expect(screen.getByText('Total Applications')).toBeInTheDocument()
    expect(screen.getByText('Pending Approvals')).toBeInTheDocument()
    expect(screen.getByText('Staff Quota Utilization')).toBeInTheDocument()

    // Default tab shows student applications
    expect(screen.getByText('Tanvir Ahmed')).toBeInTheDocument()
    expect(screen.getByText('Nusrat Jahan')).toBeInTheDocument()
  })

  it('filters applications by search query', async () => {
    const user = userEvent.setup()
    renderLeave()

    expect(screen.getByText('Tanvir Ahmed')).toBeInTheDocument()
    expect(screen.getByText('Nusrat Jahan')).toBeInTheDocument()

    const searchInput = screen.getByPlaceholderText(/Search/i)
    await user.type(searchInput, 'Nusrat')

    expect(screen.getByText('Nusrat Jahan')).toBeInTheDocument()
    expect(screen.queryByText('Tanvir Ahmed')).not.toBeInTheDocument()
  })

  it('switches between Student Leaves, Teacher Leave Ledger, and Applications Archive tabs', async () => {
    const user = userEvent.setup()
    renderLeave()

    // Switch to Teacher Leave Ledger
    const teacherTab = screen.getByRole('button', { name: /teacher leave ledger/i })
    await user.click(teacherTab)

    expect(screen.getAllByText('Md. Rafiqul Islam').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Nasrin Sultana').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Casual Leave \(CL\):/i).length).toBeGreaterThanOrEqual(1)

    // Switch to Applications Archive
    const archiveTab = screen.getByRole('button', { name: /applications archive/i })
    await user.click(archiveTab)

    expect(screen.getAllByText(/LV-2026-/i).length).toBeGreaterThanOrEqual(1)
  })

  it('opens and submits a new leave application via modal', async () => {
    const user = userEvent.setup()
    renderLeave()

    const applyBtn = screen.getByRole('button', { name: /apply for leave/i })
    await user.click(applyBtn)

    expect(screen.getByText('Submit Leave Application')).toBeInTheDocument()

    // Fill reason
    const reasonInput = screen.getByPlaceholderText(/Explain reason for leave/i)
    await user.type(reasonInput, 'Medical appointment with specialist in Dhanmondi')

    // Submit form
    const submitBtn = screen.getAllByRole('button', { name: /apply for leave/i })[1]
    await user.click(submitBtn)

    // Modal closes
    expect(screen.queryByText('Submit Leave Application')).not.toBeInTheDocument()
  })

  it('opens review modal for pending application and approves it', async () => {
    const user = userEvent.setup()
    renderLeave()

    // Nusrat Jahan has a pending application with Review button
    const reviewButtons = screen.getAllByRole('button', { name: /review/i })
    expect(reviewButtons.length).toBeGreaterThan(0)

    await user.click(reviewButtons[0])

    expect(screen.getByText('Review Leave Application')).toBeInTheDocument()
    expect(
      screen.getByText(/Approved student leaves are automatically recorded as 'Leave'/i),
    ).toBeInTheDocument()

    // Click Approve
    const approveBtn = screen.getByRole('button', { name: /approve & sanction/i })
    await user.click(approveBtn)

    // Modal closes
    expect(screen.queryByText('Review Leave Application')).not.toBeInTheDocument()
  })

  it('triggers PDF download when PDF action button is clicked', async () => {
    const user = userEvent.setup()
    renderLeave()

    const downloadButtons = screen.getAllByTitle(/download application \(pdf\)/i)
    expect(downloadButtons.length).toBeGreaterThan(0)

    await user.click(downloadButtons[0])
    expect(window.URL.createObjectURL).toHaveBeenCalled()
  })
})
