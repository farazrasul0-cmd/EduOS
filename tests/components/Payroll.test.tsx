import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Payroll from '@/pages/Payroll'
import { resetPayrollStore } from '@/data/payroll'
import { ToastProvider } from '@/components/ui/Toast'
import * as pdfModule from '@/lib/payroll-pdf'
import i18n from '@/i18n'

describe('Payroll Component (Phase 13: Payroll & Staff Compensation Management)', () => {
  let queryClient: QueryClient

  beforeEach(async () => {
    resetPayrollStore()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    await i18n.changeLanguage('en')
    vi.clearAllMocks()
  })

  function renderPayroll() {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ToastProvider>
            <Payroll />
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }

  it('renders payroll dashboard with summary KPIs and monthly salary sheet', () => {
    renderPayroll()

    expect(screen.getByText('Payroll & Staff Compensation')).toBeInTheDocument()
    expect(screen.getByText('Total Monthly Payroll')).toBeInTheDocument()
    expect(screen.getByText('Disbursed Amount')).toBeInTheDocument()
    expect(screen.getByText('Pending Disbursement')).toBeInTheDocument()
    expect(screen.getByText('Staff on Payroll')).toBeInTheDocument()

    // Default roster entries in Salary Sheet
    expect(screen.getByText('Dr. Muhammad Rafiqul Islam')).toBeInTheDocument()
    expect(screen.getByText('Begum Rokeya Akhtar')).toBeInTheDocument()
    expect(screen.getByText('Shamsur Rahman')).toBeInTheDocument()
    expect(screen.getByText('Tanvir Ahmed')).toBeInTheDocument()
  })

  it('filters salary sheet using search input', async () => {
    const user = userEvent.setup()
    renderPayroll()

    expect(screen.getByText('Dr. Muhammad Rafiqul Islam')).toBeInTheDocument()
    expect(screen.getByText('Tanvir Ahmed')).toBeInTheDocument()

    const searchInput = screen.getByPlaceholderText(/Search/i)
    await user.type(searchInput, 'Tanvir')

    expect(screen.getByText('Tanvir Ahmed')).toBeInTheDocument()
    expect(screen.queryByText('Dr. Muhammad Rafiqul Islam')).not.toBeInTheDocument()
  })

  it('switches to Disbursement Ledger tab and displays payment channels', async () => {
    const user = userEvent.setup()
    renderPayroll()

    const disbursementTab = screen.getByRole('button', { name: 'Disbursement Ledger' })
    await user.click(disbursementTab)

    expect(screen.getByText('Select All Pending')).toBeInTheDocument()
    expect(screen.getAllByText('bKash Corporate').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Bank Transfer (BEFTN)').length).toBeGreaterThan(0)
  })

  it('switches to Staff Salary Profiles tab and renders base pay and allowances', async () => {
    const user = userEvent.setup()
    renderPayroll()

    const profilesTab = screen.getByRole('button', { name: 'Salary Structure & Profiles' })
    await user.click(profilesTab)

    expect(screen.getAllByText(/Edit Structure/i).length).toBeGreaterThan(0)
    expect(screen.getByText('Dr. Muhammad Rafiqul Islam')).toBeInTheDocument()
  })

  it('opens and closes Generate Monthly Sheet modal', async () => {
    const user = userEvent.setup()
    renderPayroll()

    const generateBtn = screen.getByRole('button', { name: /Generate Monthly Sheet/i })
    await user.click(generateBtn)

    expect(screen.getByText('Generate Monthly Salary Sheet')).toBeInTheDocument()
    expect(screen.getByText('Billing Month')).toBeInTheDocument()

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i })
    await user.click(cancelBtn)

    expect(screen.queryByText('Generate Monthly Salary Sheet')).not.toBeInTheDocument()
  })

  it('triggers payslip PDF generation upon clicking download', async () => {
    const createPayslipSpy = vi.spyOn(pdfModule, 'createPayslipPdf')
    const user = userEvent.setup()
    renderPayroll()

    const downloadButtons = screen.getAllByTitle('Payslip (PDF)')
    expect(downloadButtons.length).toBeGreaterThan(0)

    await user.click(downloadButtons[0])
    expect(createPayslipSpy).toHaveBeenCalled()
  })
})
