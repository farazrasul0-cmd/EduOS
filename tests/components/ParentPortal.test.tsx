import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ParentPortal from '@/pages/ParentPortal'
import { resetPortalStore } from '@/data/portal'
import { ToastProvider } from '@/components/ui/Toast'
import i18n from '@/i18n'

vi.mock('@/auth/context', () => ({
  useAuth: () => ({
    user: { id: 'u-parent-1' },
    profile: { id: 'u-parent-1', school_id: 'sch-1', full_name: 'Md. Farhad Ahmed', role: 'parent' },
    session: null,
    loading: false,
    refreshProfile: vi.fn(),
    signOut: vi.fn(),
  }),
}))

describe('ParentPortal Component (Phase 20: Dedicated Parent & Student Portal)', () => {
  let queryClient: QueryClient

  beforeEach(async () => {
    resetPortalStore()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    await i18n.changeLanguage('en')
    vi.clearAllMocks()
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-portal-url')
    window.URL.revokeObjectURL = vi.fn()
  })

  function renderParentPortal() {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ToastProvider>
            <ParentPortal />
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }

  it('renders portal header, 4 core KPIs, and child switcher', () => {
    renderParentPortal()

    expect(screen.getByText('Dedicated Parent & Student Portal')).toBeInTheDocument()
    expect(screen.getByText('Attendance Rate')).toBeInTheDocument()
    expect(screen.getByText('Outstanding Fees')).toBeInTheDocument()
    expect(screen.getByText('Term Result (GPA)')).toBeInTheDocument()
    expect(screen.getByText('Homework Pending')).toBeInTheDocument()

    // Default child: Tanvir Ahmed
    expect(screen.getByText('88.8%')).toBeInTheDocument()
    expect(screen.getByText('৳2,500')).toBeInTheDocument()
    expect(screen.getByText('GPA 4.85')).toBeInTheDocument()
  })

  it('switches between children and dynamically updates KPIs', async () => {
    renderParentPortal()

    const select = screen.getByRole('combobox')
    // Switch to Nusrat Jahan (STD-2026-042)
    fireEvent.change(select, { target: { value: 'STD-2026-042' } })

    await waitFor(() => {
      expect(screen.getByText('68.8%')).toBeInTheDocument()
      expect(screen.getByText('৳0')).toBeInTheDocument()
      expect(screen.getByText('GPA 4.25')).toBeInTheDocument()
    })
  })

  it('navigates through tabs: Attendance, Fees, Academics, and Homework', () => {
    renderParentPortal()

    // 1. Overview & Routine is default
    expect(screen.getByText("Today's Class Routine")).toBeInTheDocument()

    // 2. Switch to Attendance Record
    fireEvent.click(screen.getByRole('button', { name: 'Attendance Record' }))
    expect(screen.getByText('Education Board Examination Collegiate Rules')).toBeInTheDocument()
    expect(screen.getByText('Collegiate (>= 75%)')).toBeInTheDocument()
    expect(screen.getByText('Dis-Collegiate (< 60%)')).toBeInTheDocument()

    // 3. Switch to Fees & bKash Pay
    fireEvent.click(screen.getByRole('button', { name: 'Fees & bKash Pay' }))
    expect(screen.getByText('Tuition Fees & Payments')).toBeInTheDocument()
    expect(screen.getByText('September 2026 Tuition Fee')).toBeInTheDocument()

    // 4. Switch to Academic Marksheet
    fireEvent.click(screen.getByRole('button', { name: 'Academic Marksheet' }))
    expect(screen.getByText('Continuous Assessment & Terminal Results')).toBeInTheDocument()
    expect(screen.getByText('Continuous Assessment (20)')).toBeInTheDocument()

    // 5. Switch to Homework Tracker
    fireEvent.click(screen.getByRole('button', { name: 'Homework Tracker' }))
    expect(screen.getByText('Homework & Assignment Tracker')).toBeInTheDocument()
    expect(screen.getByText('Bangla Grammar Essay: Smart Bangladesh')).toBeInTheDocument()
  })

  it('executes 1-click bKash fee payment workflow', async () => {
    renderParentPortal()

    // Switch to Fees tab
    fireEvent.click(screen.getByRole('button', { name: 'Fees & bKash Pay' }))

    // Click "Pay with bKash / Nagad"
    const payBtn = screen.getByRole('button', { name: /Pay with bKash \/ Nagad/ })
    fireEvent.click(payBtn)

    // Verify modal is open
    const modal = screen.getByRole('dialog')
    expect(within(modal).getByText('Instant Fee Checkout')).toBeInTheDocument()
    expect(within(modal).getByText('Bangladeshi Mobile Financial Services (MFS) Gateway')).toBeInTheDocument()

    // Enter wallet phone number
    const phoneInput = within(modal).getByPlaceholderText('017XXXXXXXX / 018XXXXXXXX')
    fireEvent.change(phoneInput, { target: { value: '01812345678' } })

    // Select Nagad channel inside modal
    fireEvent.click(within(modal).getByRole('button', { name: /Nagad/ }))

    // Confirm Payment
    const confirmBtn = within(modal).getByRole('button', { name: 'Confirm & Pay Now' })
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(screen.getByText(/Fee payment verified successfully!/)).toBeInTheDocument()
    })
  })

  it('submits homework solution via modal', async () => {
    renderParentPortal()

    // Switch to Homework Tracker tab
    fireEvent.click(screen.getByRole('button', { name: 'Homework Tracker' }))

    const submitButtons = screen.getAllByRole('button', { name: /Submit Homework/ })
    fireEvent.click(submitButtons[0])

    expect(screen.getByText('Submit Homework Solution')).toBeInTheDocument()

    const noteInput = screen.getByPlaceholderText('Enter your answer or describe your completed work...')
    fireEvent.change(noteInput, { target: { value: 'Detailed essay submitted in PDF format to class teacher.' } })

    const confirmSubmitBtn = screen.getByRole('button', { name: 'Submit Assignment' })
    fireEvent.click(confirmSubmitBtn)

    await waitFor(() => {
      expect(screen.getByText('Homework solution submitted successfully!')).toBeInTheDocument()
    })
  })

  it('triggers PDF downloads for Dossier, Report Card, and Admit Card', () => {
    renderParentPortal()

    // 1. Progress Dossier
    const dossierBtn = screen.getByRole('button', { name: /Download Progress Dossier/ })
    fireEvent.click(dossierBtn)
    expect(window.URL.createObjectURL).toHaveBeenCalled()

    // 2. Marksheet / Report Card & Admit Card
    fireEvent.click(screen.getByRole('button', { name: 'Academic Marksheet' }))
    const reportCardBtn = screen.getByRole('button', { name: /Download NCTB Report Card/ })
    fireEvent.click(reportCardBtn)
    expect(window.URL.createObjectURL).toHaveBeenCalled()

    const admitCardBtn = screen.getByRole('button', { name: /Download Exam Admit Card/ })
    fireEvent.click(admitCardBtn)
    expect(window.URL.createObjectURL).toHaveBeenCalled()
  })
})
