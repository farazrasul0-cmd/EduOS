import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Admissions from '@/pages/Admissions'
import { resetAdmissionsStore } from '@/data/admissions'
import { ToastProvider } from '@/components/ui/Toast'
import * as pdfModule from '@/lib/admissions-pdf'
import i18n from '@/i18n'

describe('Admissions Component (Phase 11: Administrative Admissions Management)', () => {
  let queryClient: QueryClient

  beforeEach(async () => {
    resetAdmissionsStore()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    await i18n.changeLanguage('en')
    vi.clearAllMocks()
  })

  function renderAdmissions() {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ToastProvider>
            <Admissions />
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }

  it('renders admissions dashboard with summary KPIs and applicant roster', () => {
    renderAdmissions()

    expect(screen.getByText('Admissions & Applications')).toBeInTheDocument()
    expect(screen.getByText('Total Applications')).toBeInTheDocument()
    expect(screen.getByText('Shortlisted for Test')).toBeInTheDocument()
    expect(screen.getByText('Admitted Students')).toBeInTheDocument()

    // Table rows
    expect(screen.getByText('Zubair Al Mahfuz')).toBeInTheDocument()
    expect(screen.getByText('Sumaiya Akter')).toBeInTheDocument()
    expect(screen.getByText('Sourav Roy')).toBeInTheDocument()
    expect(screen.getByText('Fatima Nawar')).toBeInTheDocument()
  })

  it('filters applicant roster by status segmented tabs', async () => {
    const user = userEvent.setup()
    renderAdmissions()

    // Initial state: shows all applicants
    expect(screen.getByText('Zubair Al Mahfuz')).toBeInTheDocument()
    expect(screen.getByText('Sumaiya Akter')).toBeInTheDocument()

    // Click "Shortlisted" tab
    const shortlistedTab = screen.getByRole('button', { name: 'Shortlisted' })
    await user.click(shortlistedTab)

    // Sumaiya is shortlisted
    expect(screen.getByText('Sumaiya Akter')).toBeInTheDocument()
    // Zubair is admitted, so should not appear under Shortlisted tab
    expect(screen.queryByText('Zubair Al Mahfuz')).not.toBeInTheDocument()
  })

  it('opens review modal and displays applicant profile details', async () => {
    const user = userEvent.setup()
    renderAdmissions()

    const reviewBtn = screen.getByRole('button', { name: 'Review Sumaiya Akter' })
    await user.click(reviewBtn)

    expect(screen.getByText(/Admission Applicant Review · ADM-2026-0002/i)).toBeInTheDocument()
    expect(screen.getAllByText('Md. Shahidul Islam').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('20132692518067890')).toBeInTheDocument()
    expect(screen.getByText(/EXM-7002/i)).toBeInTheDocument()
  })

  it('updates applicant status to Admitted and allows active student enrollment', async () => {
    const user = userEvent.setup()
    renderAdmissions()

    // Open review for Sumaiya (shortlisted)
    await user.click(screen.getByRole('button', { name: 'Review Sumaiya Akter' }) )

    // Click "Admit Student"
    const admitBtn = screen.getByRole('button', { name: 'Admit Student' })
    await user.click(admitBtn)

    // Now enroll button should be visible
    expect(screen.getByRole('button', { name: 'Enroll as Active Student' })).toBeInTheDocument()

    // Click enroll
    await user.click(screen.getByRole('button', { name: 'Enroll as Active Student' }))
    expect(screen.getByText(/Applicant enrolled as active student in school roster/i)).toBeInTheDocument()
  })

  it('triggers Admission Fee Voucher PDF download for admitted applicant', async () => {
    const user = userEvent.setup()
    const voucherSpy = vi.spyOn(pdfModule, 'createAdmissionFeeVoucherPdf').mockReturnValue(new Uint8Array([37, 80, 68, 70]))

    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-voucher')
    window.URL.revokeObjectURL = vi.fn()

    renderAdmissions()

    // Open review for Zubair (admitted)
    await user.click(screen.getByRole('button', { name: 'Review Zubair Al Mahfuz' }))

    const voucherBtn = screen.getByRole('button', { name: /Download Fee Voucher \(PDF\)/i })
    await user.click(voucherBtn)

    expect(voucherSpy).toHaveBeenCalledWith(
      expect.objectContaining({ studentName: 'Zubair Al Mahfuz' }),
      expect.anything(),
    )
  })
})
