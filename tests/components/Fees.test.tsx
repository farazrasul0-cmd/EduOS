import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Fees from '@/pages/Fees'
import { ToastProvider } from '@/components/ui/Toast'
import i18n from '@/i18n'
import type { InvoiceWithStudent } from '@/data/fees'

const mockStudents = [
  {
    id: 's-1',
    school_id: 'sch-1',
    full_name: 'Tanvir Ahmed',
    roll_no: '7A-01',
    class_id: 'c-1',
    class_name: 'Class 7',
    parent_name: 'Rafiqul Ahmed',
    parent_phone: '01711000001',
  },
  {
    id: 's-2',
    school_id: 'sch-1',
    full_name: 'Nusrat Jahan',
    roll_no: '7A-02',
    class_id: 'c-1',
    class_name: 'Class 7',
    parent_name: 'Monira Jahan',
    parent_phone: '01811000002',
  },
]

const mockPlans = [
  {
    id: 'plan-1',
    school_id: 'sch-1',
    name: 'Tuition Fee - Monthly',
    amount: 1500,
    interval: 'monthly',
  },
]

const mockInvoices: InvoiceWithStudent[] = [
  {
    id: 'inv-1',
    school_id: 'sch-1',
    student_id: 's-1',
    student_name: 'Tanvir Ahmed',
    invoice_no: 'INV-2026-001',
    fee_plan_id: 'plan-1',
    amount: 1500,
    paid_amount: 1500,
    status: 'paid',
    due_date: '2026-05-10',
    created_at: '2026-05-01T00:00:00Z',
  },
  {
    id: 'inv-2',
    school_id: 'sch-1',
    student_id: 's-2',
    student_name: 'Nusrat Jahan',
    invoice_no: 'INV-2026-002',
    fee_plan_id: 'plan-1',
    amount: 2000,
    paid_amount: 0,
    status: 'overdue',
    due_date: '2026-05-10', // 15 days overdue by 2026-05-25 (8 days past 7-day grace -> 8*5 = ৳40 fine)
    created_at: '2026-05-01T00:00:00Z',
  },
]

const mutateCreateInvoice = vi.fn()
const mutateRecordPayment = vi.fn()
const mockSendSms = vi.fn(async () => ({
  success: true,
  messageId: 'sms-mock-fees-123',
  recipientCount: 1,
  estimatedCostBdt: 0.35,
  btrcCompliant: true,
}))
const mockCreateFeeDefaultersPdf = vi.fn(() => new Uint8Array([37, 80, 68, 70]))

vi.mock('@/data/students', () => ({
  useStudents: () => ({
    data: mockStudents,
    isPending: false,
    isError: false,
  }),
}))

vi.mock('@/data/fees', () => ({
  useInvoices: () => ({
    data: mockInvoices,
    isPending: false,
    isError: false,
  }),
  useFeePlans: () => ({
    data: mockPlans,
    isPending: false,
    isError: false,
  }),
  useInvoicePayments: () => ({
    data: [],
    isPending: false,
    isError: false,
  }),
  useCreateInvoice: () => ({
    mutate: mutateCreateInvoice,
    isPending: false,
    isError: false,
  }),
  useRecordPayment: () => ({
    mutate: mutateRecordPayment,
    isPending: false,
    isError: false,
  }),
}))

vi.mock('@/lib/sms-gateway', () => ({
  calculateSmsParts: vi.fn(() => ({
    encoding: 'GSM-7' as const,
    charCount: 95,
    partsCount: 1,
    remainingInPart: 65,
    maxSinglePart: 160,
    maxMultiPart: 153,
  })),
  sendSms: (...args: unknown[]) => mockSendSms(...args),
}))

vi.mock('@/lib/fee-defaulters-pdf', () => ({
  createFeeDefaultersPdf: (...args: unknown[]) => mockCreateFeeDefaultersPdf(...args),
}))

function renderFees() {
  return render(
    <ToastProvider>
      <Fees />
    </ToastProvider>,
  )
}

describe('Fees Component (Phase 8: Defaulters & Late Fine Ledger)', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    vi.clearAllMocks()
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    window.URL.revokeObjectURL = vi.fn()
  })

  it('renders invoices list and summary KPI metrics on default tab', () => {
    renderFees()

    expect(screen.getByRole('heading', { name: 'Fees' })).toBeInTheDocument()
    expect(screen.getByText('INV-2026-001')).toBeInTheDocument()
    expect(screen.getByText('INV-2026-002')).toBeInTheDocument()
    expect(screen.getByText('Tanvir Ahmed')).toBeInTheDocument()
    expect(screen.getByText('Nusrat Jahan')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Export/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /New invoice/i })).toBeInTheDocument()
  })

  it('switches to Fee defaulters & fine ledger tab and displays calculated overdue fines', async () => {
    const user = userEvent.setup()
    renderFees()

    const defaultersTab = screen.getByRole('button', { name: /Fee defaulters & fine ledger/i })
    await user.click(defaultersTab)

    // Nusrat Jahan is overdue (due 2026-05-10, evaluation 2026-05-25: 15 days overdue, 8 days past 7-day grace)
    expect(screen.getByText('15 days late')).toBeInTheDocument()
    expect(screen.getByText('+৳40')).toBeInTheDocument()
    // Displays in both Total Due KPI card and student row
    expect(screen.getAllByText('৳2,040')).toHaveLength(2)

    // Action buttons for defaulters
    expect(screen.getByRole('button', { name: /Send reminder SMS \(1\)/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Download defaulters notice \(PDF\)/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Export defaulters \(CSV\)/i })).toBeInTheDocument()
  })

  it('opens BTRC payment reminder SMS modal and sends broadcast to overdue guardian', async () => {
    const user = userEvent.setup()
    renderFees()

    const defaultersTab = screen.getByRole('button', { name: /Fee defaulters & fine ledger/i })
    await user.click(defaultersTab)

    const bulkSmsButton = screen.getByRole('button', { name: /Send reminder SMS \(1\)/i })
    await user.click(bulkSmsButton)

    // Verify SMS modal is visible
    expect(screen.getByText('Confirm Payment Reminder SMS')).toBeInTheDocument()
    expect(screen.getByText(/Nusrat Jahan \(7A-02\) · 01811000002/i)).toBeInTheDocument()
    expect(screen.getByText(/Encoding:/i)).toBeInTheDocument()

    // Send SMS
    const confirmSendButton = screen.getByRole('button', { name: /Send 1 SMS reminders/i })
    await user.click(confirmSendButton)

    await waitFor(() => {
      expect(mockSendSms).toHaveBeenCalledTimes(1)
      expect(mockSendSms).toHaveBeenCalledWith(
        '01811000002',
        expect.stringContaining('Nusrat Jahan'),
      )
    })

    // Verify toast notification
    await waitFor(() => {
      expect(screen.getByText('Fee reminder SMS dispatched successfully.')).toBeInTheDocument()
    })
  })

  it('triggers single student reminder SMS via row action button', async () => {
    const user = userEvent.setup()
    renderFees()

    const defaultersTab = screen.getByRole('button', { name: /Fee defaulters & fine ledger/i })
    await user.click(defaultersTab)

    // Row action button
    const singleSmsBtn = screen.getByRole('button', { name: 'Send reminder SMS' })
    await user.click(singleSmsBtn)

    expect(screen.getByText('Confirm Payment Reminder SMS')).toBeInTheDocument()
    expect(screen.getByText(/Nusrat Jahan \(7A-02\) · 01811000002/i)).toBeInTheDocument()

    const confirmSendBtn = screen.getByRole('button', { name: /Send 1 SMS reminders/i })
    await user.click(confirmSendBtn)

    await waitFor(() => {
      expect(mockSendSms).toHaveBeenCalledTimes(1)
    })
  })

  it('generates and downloads A4 Fee Defaulters Notice & Ledger PDF', async () => {
    const user = userEvent.setup()
    renderFees()

    const defaultersTab = screen.getByRole('button', { name: /Fee defaulters & fine ledger/i })
    await user.click(defaultersTab)

    const downloadPdfBtn = screen.getByRole('button', { name: /Download defaulters notice \(PDF\)/i })
    await user.click(downloadPdfBtn)

    expect(mockCreateFeeDefaultersPdf).toHaveBeenCalledTimes(1)
    expect(mockCreateFeeDefaultersPdf).toHaveBeenCalledWith(
      expect.objectContaining({
        eiin: '108234',
        academicYear: '2026',
        date: '2026-05-25',
        defaulters: expect.arrayContaining([
          expect.objectContaining({
            studentName: 'Nusrat Jahan',
            rollNo: '7A-02',
            daysOverdue: 15,
            principal: 2000,
            fine: 40,
            total: 2040,
          }),
        ]),
      }),
    )
    expect(window.URL.createObjectURL).toHaveBeenCalled()
  })
})
