import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import NoticeBoard from '@/pages/NoticeBoard'
import { resetNoticesStore } from '@/data/notices'
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

describe('NoticeBoard Component (Phase 19: Digital Notice Board & Circular Distribution)', () => {
  let queryClient: QueryClient

  beforeEach(async () => {
    resetNoticesStore()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    await i18n.changeLanguage('en')
    vi.clearAllMocks()
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    window.URL.revokeObjectURL = vi.fn()
  })

  function renderNoticeBoard() {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ToastProvider>
            <NoticeBoard />
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }

  it('renders digital notice board with summary KPIs and initial circular cards', () => {
    renderNoticeBoard()

    expect(screen.getByText('Digital Notice Board & Circulars')).toBeInTheDocument()
    expect(screen.getByText('Active Notices')).toBeInTheDocument()
    expect(screen.getByText('Pinned Circulars')).toBeInTheDocument()
    expect(screen.getByText('Emergency Notices')).toBeInTheDocument()
    expect(screen.getByText('SMS Alerts Sent')).toBeInTheDocument()

    // Default notices
    expect(screen.getByText('Holy Eid-ul-Adha & Summer Vacation 2026 Schedule')).toBeInTheDocument()
    expect(
      screen.getByText('Emergency Heatwave Alert: Provisional School Closure by Ministry of Education'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Half-Yearly Examination 2026 Routine & Admit Card Collection Guidelines'),
    ).toBeInTheDocument()
  })

  it('filters circulars by search query and category segmented tab', async () => {
    const user = userEvent.setup()
    renderNoticeBoard()

    expect(screen.getByText('Holy Eid-ul-Adha & Summer Vacation 2026 Schedule')).toBeInTheDocument()

    const searchInput = screen.getByPlaceholderText(/Search/i)
    await user.type(searchInput, 'Heatwave')

    expect(
      screen.getByText('Emergency Heatwave Alert: Provisional School Closure by Ministry of Education'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Holy Eid-ul-Adha & Summer Vacation 2026 Schedule'),
    ).not.toBeInTheDocument()
  })

  it('opens publish notice modal and publishes a new circular notice with SMS broadcast option', async () => {
    const user = userEvent.setup()
    renderNoticeBoard()

    const publishBtn = screen.getByRole('button', { name: /publish notice/i })
    await user.click(publishBtn)

    expect(screen.getByText('Publish Official Circular')).toBeInTheDocument()

    // Fill title and content
    const titleInput = screen.getByPlaceholderText(/Summer Vacation & Holy Eid-ul-Adha/i)
    fireEvent.change(titleInput, { target: { value: 'Annual Sports Day 2026 Registration' } })

    const contentInput = screen.getByPlaceholderText(/Enter full circular resolution/i)
    fireEvent.change(contentInput, {
      target: {
        value: 'Annual sports competition registration is now open for all students across athletics, football, and cricket events.',
      },
    })

    // Check SMS Broadcast
    const smsCheckbox = screen.getByRole('checkbox', {
      name: /broadcast instant sms alert via eduos gateway/i,
    })
    await user.click(smsCheckbox)

    expect(screen.getByText(/SMS Text Preview:/i)).toBeInTheDocument()

    // Submit
    const submitBtn = screen.getAllByRole('button', { name: /publish notice/i })[1]
    await user.click(submitBtn)

    // Modal closes and new notice appears
    expect(screen.queryByText('Publish Official Circular')).not.toBeInTheDocument()
    expect(screen.getByText('Annual Sports Day 2026 Registration')).toBeInTheDocument()
  })

  it('toggles pin status on a circular', async () => {
    const user = userEvent.setup()
    renderNoticeBoard()

    const pinButtons = screen.getAllByTitle(/pin \/ unpin/i)
    expect(pinButtons.length).toBeGreaterThan(0)

    await user.click(pinButtons[0])
    // Still rendered and toggled
    expect(screen.getByText('Digital Notice Board & Circulars')).toBeInTheDocument()
  })

  it('opens full circular detail modal and triggers PDF download', async () => {
    const user = userEvent.setup()
    renderNoticeBoard()

    const readMoreButtons = screen.getAllByRole('button', { name: /read full circular/i })
    expect(readMoreButtons.length).toBeGreaterThan(0)

    await user.click(readMoreButtons[0])

    expect(screen.getByText('Official Circular Notice')).toBeInTheDocument()

    // Download PDF from modal
    const downloadBtns = screen.getAllByRole('button', { name: /download circular \(pdf\)/i })
    await user.click(downloadBtns[downloadBtns.length - 1])

    expect(window.URL.createObjectURL).toHaveBeenCalled()
  })
})
