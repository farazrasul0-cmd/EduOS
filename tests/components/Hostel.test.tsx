import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Hostel from '@/pages/Hostel'
import { resetHostelStore } from '@/data/hostel'
import { ToastProvider } from '@/components/ui/Toast'
import * as pdfModule from '@/lib/hostel-pdf'
import i18n from '@/i18n'

describe('Hostel Component (Phase 15: Hostel & Dormitory Management)', () => {
  let queryClient: QueryClient

  beforeEach(async () => {
    resetHostelStore()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    await i18n.changeLanguage('en')
    vi.clearAllMocks()
  })

  function renderHostel() {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ToastProvider>
            <Hostel />
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }

  it('renders hostel management page with KPIs and room inventory', () => {
    renderHostel()

    expect(screen.getByText('Hostel & Dormitory Management')).toBeInTheDocument()
    expect(screen.getByText('Total Capacity (Beds)')).toBeInTheDocument()
    expect(screen.getByText('Current Boarders')).toBeInTheDocument()
    expect(screen.getByText('Vacant Beds')).toBeInTheDocument()
    expect(screen.getByText('Occupancy Rate')).toBeInTheDocument()

    // Default room records
    expect(screen.getAllByText(/Kazi Nazrul Islam Hall/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Begum Rokeya Bhaban/).length).toBeGreaterThan(0)
  })

  it('filters rooms by search input', async () => {
    const user = userEvent.setup()
    renderHostel()

    expect(screen.getByText('Room 101')).toBeInTheDocument()
    expect(screen.getByText('Room 102')).toBeInTheDocument()

    const searchInput = screen.getByPlaceholderText(/Search/i)
    await user.type(searchInput, '101')

    expect(screen.getByText('Room 101')).toBeInTheDocument()
    expect(screen.queryByText('Room 102')).not.toBeInTheDocument()
  })

  it('switches between Rooms, Boarders, and Gate Pass tabs', async () => {
    const user = userEvent.setup()
    renderHostel()

    // Tab 2: Boarder Roster
    const boardersTab = screen.getByRole('button', { name: 'Boarder Roster' })
    await user.click(boardersTab)

    expect(screen.getByText('Tanvir Hasan')).toBeInTheDocument()
    expect(screen.getByText('Sabbir Hossain')).toBeInTheDocument()

    // Tab 3: Gate Pass & Curfew
    const gatePassTab = screen.getByRole('button', { name: 'Gate Pass & Curfew' })
    await user.click(gatePassTab)

    expect(screen.getByText('GP-2026-0001')).toBeInTheDocument()
    expect(screen.getByText('GP-2026-0002')).toBeInTheDocument()
  })

  it('opens and closes Allocate Seat modal', async () => {
    const user = userEvent.setup()
    renderHostel()

    const allocateButtons = screen.getAllByRole('button', { name: /Allocate Seat/i })
    await user.click(allocateButtons[0])

    expect(screen.getByText('Allocate Hostel Seat to Student')).toBeInTheDocument()
    expect(screen.getByText('Student Full Name')).toBeInTheDocument()

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i })
    await user.click(cancelBtn)

    expect(screen.queryByText('Allocate Hostel Seat to Student')).not.toBeInTheDocument()
  })

  it('opens and closes Issue Gate Pass modal', async () => {
    const user = userEvent.setup()
    renderHostel()

    const issuePassBtn = screen.getByRole('button', { name: /Issue Gate Pass/i })
    await user.click(issuePassBtn)

    expect(screen.getByText('Issue Student Hostel Gate Pass / Out-Pass')).toBeInTheDocument()
    expect(screen.getByText('Destination Address')).toBeInTheDocument()

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i })
    await user.click(cancelBtn)

    expect(screen.queryByText('Issue Student Hostel Gate Pass / Out-Pass')).not.toBeInTheDocument()
  })

  it('triggers occupancy register PDF report download', async () => {
    const reportSpy = vi.spyOn(pdfModule, 'createHostelOccupancyReportPdf')
    const user = userEvent.setup()
    renderHostel()

    const downloadBtn = screen.getByRole('button', { name: /Occupancy Register \(PDF\)/i })
    await user.click(downloadBtn)

    expect(reportSpy).toHaveBeenCalled()
  })

  it('triggers gate pass PDF download from Gate Pass tab', async () => {
    const passSpy = vi.spyOn(pdfModule, 'createHostelGatePassPdf')
    const user = userEvent.setup()
    renderHostel()

    // Switch to gate pass tab
    const gatePassTab = screen.getByRole('button', { name: 'Gate Pass & Curfew' })
    await user.click(gatePassTab)

    const pdfDownloadBtns = screen.getAllByTitle('Download Pass Slip')
    expect(pdfDownloadBtns.length).toBeGreaterThan(0)

    await user.click(pdfDownloadBtns[0])
    expect(passSpy).toHaveBeenCalled()
  })
})
