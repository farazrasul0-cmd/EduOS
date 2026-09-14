import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AdmitCards from '@/pages/AdmitCards'
import { resetAdmitCardStore } from '@/data/admit-cards'
import { ToastProvider } from '@/components/ui/Toast'
import * as pdfModule from '@/lib/admit-card-pdf'
import i18n from '@/i18n'

describe('AdmitCards Component (Phase 16: Exam Admit Cards & Hall Seat Planner)', () => {
  let queryClient: QueryClient

  beforeEach(async () => {
    resetAdmitCardStore()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    await i18n.changeLanguage('en')
    vi.clearAllMocks()
  })

  function renderAdmitCards() {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ToastProvider>
            <AdmitCards />
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }

  it('renders admit card desk with summary KPIs and examinee roster', () => {
    renderAdmitCards()

    expect(screen.getByText('Exam Admit Cards & Hall Seat Planner')).toBeInTheDocument()
    expect(screen.getByText('Total Examinees')).toBeInTheDocument()
    expect(screen.getByText('Admit Cards Ready')).toBeInTheDocument()
    expect(screen.getByText('Dues Pending (Withheld)')).toBeInTheDocument()
    expect(screen.getByText('Active Exam Halls')).toBeInTheDocument()

    // Default examinee records
    expect(screen.getByText('Amina Begum')).toBeInTheDocument()
    expect(screen.getByText('Sabbir Hossain')).toBeInTheDocument()
    expect(screen.getByText('Tanvir Hasan')).toBeInTheDocument()
  })

  it('filters examinees using the search input', async () => {
    const user = userEvent.setup()
    renderAdmitCards()

    expect(screen.getByText('Amina Begum')).toBeInTheDocument()
    expect(screen.getByText('Sabbir Hossain')).toBeInTheDocument()

    const searchInput = screen.getByPlaceholderText(/Search/i)
    await user.type(searchInput, 'Amina')

    expect(screen.getByText('Amina Begum')).toBeInTheDocument()
    expect(screen.queryByText('Sabbir Hossain')).not.toBeInTheDocument()
  })

  it('switches between Admit Card Desk, Hall Seat Planner, and Invigilation tabs', async () => {
    const user = userEvent.setup()
    renderAdmitCards()

    // Tab 2: Hall Seat Planner
    const seatPlanTab = screen.getByRole('button', { name: 'Hall Seat Planner' })
    await user.click(seatPlanTab)

    expect(screen.getAllByText(/Room 101/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Bench 1/).length).toBeGreaterThan(0)

    // Tab 3: Invigilation Schedule
    const invigTab = screen.getByRole('button', { name: 'Invigilation Schedule' })
    await user.click(invigTab)

    expect(screen.getByText('Md. Nazmul Huda (Senior Teacher, English)')).toBeInTheDocument()
    expect(screen.getByText('Fatema Khatun (Assistant Teacher, Math)')).toBeInTheDocument()
  })

  it('opens and closes Authorize Special Examination Clearance modal', async () => {
    const user = userEvent.setup()
    renderAdmitCards()

    const overrideBtn = screen.getByRole('button', { name: /Authorize Clearance/i })
    await user.click(overrideBtn)

    expect(screen.getByText('Authorize Special Examination Clearance')).toBeInTheDocument()
    expect(screen.getByText('Reason / Authority Notes')).toBeInTheDocument()

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i })
    await user.click(cancelBtn)

    expect(screen.queryByText('Authorize Special Examination Clearance')).not.toBeInTheDocument()
  })

  it('triggers student admit card PDF download', async () => {
    const passSpy = vi.spyOn(pdfModule, 'createStudentAdmitCardPdf')
    const user = userEvent.setup()
    renderAdmitCards()

    const downloadBtns = screen.getAllByTitle('Download Admit Card')
    expect(downloadBtns.length).toBeGreaterThan(0)

    await user.click(downloadBtns[0])
    expect(passSpy).toHaveBeenCalled()
  })

  it('triggers hall door notice and bench stickers PDF download', async () => {
    const doorSpy = vi.spyOn(pdfModule, 'createExamHallDoorNoticePdf')
    const stickersSpy = vi.spyOn(pdfModule, 'createBenchStickersPdf')
    const user = userEvent.setup()
    renderAdmitCards()

    // Switch to Hall Seat Planner
    const seatPlanTab = screen.getByRole('button', { name: 'Hall Seat Planner' })
    await user.click(seatPlanTab)

    // Door notice
    const doorBtns = screen.getAllByRole('button', { name: /Hall Door Notice \(PDF\)/i })
    expect(doorBtns.length).toBeGreaterThan(0)
    await user.click(doorBtns[0])
    expect(doorSpy).toHaveBeenCalled()

    // Bench stickers
    const stickersBtn = screen.getByRole('button', { name: /Bench Stickers \(PDF\)/i })
    await user.click(stickersBtn)
    expect(stickersSpy).toHaveBeenCalled()
  })
})
