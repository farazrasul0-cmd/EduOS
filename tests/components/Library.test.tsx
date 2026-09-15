import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Library from '@/pages/Library'
import { resetLibraryStore } from '@/data/library'
import { ToastProvider } from '@/components/ui/Toast'
import * as pdfModule from '@/lib/library-pdf'
import i18n from '@/i18n'

describe('Library Component (Phase 12: Library & NCTB Textbook Management)', () => {
  let queryClient: QueryClient

  beforeEach(async () => {
    resetLibraryStore()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    await i18n.changeLanguage('en')
    vi.clearAllMocks()
  })

  function renderLibrary() {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ToastProvider>
            <Library />
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }

  it('renders library dashboard with summary KPIs and book catalog', () => {
    renderLibrary()

    expect(screen.getByText('Library & Textbooks')).toBeInTheDocument()
    expect(screen.getByText('Total Books')).toBeInTheDocument()
    expect(screen.getByText('Active Loans')).toBeInTheDocument()
    expect(screen.getByText('Overdue Books')).toBeInTheDocument()
    expect(screen.getByText('NCTB Distributed')).toBeInTheDocument()

    // Default Catalog rows
    expect(screen.getByText('Gitanjali')).toBeInTheDocument()
    expect(screen.getByText('Rabindranath Tagore')).toBeInTheDocument()
    expect(screen.getByText('Sanchita')).toBeInTheDocument()
    expect(screen.getByText('Dipu Number Two')).toBeInTheDocument()
  })

  it('filters catalog list using search input', async () => {
    const user = userEvent.setup()
    renderLibrary()

    expect(screen.getByText('Gitanjali')).toBeInTheDocument()
    expect(screen.getByText('Dipu Number Two')).toBeInTheDocument()

    const searchInput = screen.getByPlaceholderText(/Search by title, author, accession no…/i)
    await user.type(searchInput, 'Dipu')

    expect(screen.getByText('Dipu Number Two')).toBeInTheDocument()
    expect(screen.queryByText('Gitanjali')).not.toBeInTheDocument()
  })

  it('switches to Circulation Desk tab and shows active & overdue loans', async () => {
    const user = userEvent.setup()
    renderLibrary()

    // Switch to Circulation tab
    const circTab = screen.getByRole('button', { name: 'Circulation Desk' })
    await user.click(circTab)

    expect(screen.getByText('Tanvir Ahmed')).toBeInTheDocument()
    expect(screen.getByText('Sadia Sultana')).toBeInTheDocument()
    expect(screen.getByText('Sourav Roy')).toBeInTheDocument()
    expect(screen.getAllByText('OVERDUE').length).toBeGreaterThanOrEqual(1)
  })

  it('opens return modal for an overdue loan and settles book return', async () => {
    const user = userEvent.setup()
    renderLibrary()

    // Circulation tab
    await user.click(screen.getByRole('button', { name: 'Circulation Desk' }))

    // Click Return Book for Tanvir
    const returnButtons = screen.getAllByRole('button', { name: 'Return Book' })
    await user.click(returnButtons[0])

    expect(screen.getByText('Return Book & Settle Fine')).toBeInTheDocument()
    expect(screen.getByText(/Accrued Late Fine/i)).toBeInTheDocument()

    // Waive fine and confirm return
    const waiveCheckbox = screen.getByLabelText(/Waive Late Fine/i)
    await user.click(waiveCheckbox)

    const confirmBtn = screen.getByRole('button', { name: 'Confirm Book Return' })
    await user.click(confirmBtn)

    expect(screen.getByText('Book returned and inventory updated')).toBeInTheDocument()
  })

  it('switches to NCTB Textbook Register tab and triggers distribution checklist', async () => {
    const user = userEvent.setup()
    renderLibrary()

    // Click NCTB tab
    const nctbTab = screen.getByRole('button', { name: 'NCTB Textbook Register' })
    await user.click(nctbTab)

    expect(screen.getByText('Zubair Al Mahfuz')).toBeInTheDocument()
    expect(screen.getByText('Sumaiya Akter')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Distribute All to Class' })).toBeInTheDocument()

    // Click Distribute All to Class
    await user.click(screen.getByRole('button', { name: 'Distribute All to Class' }))
    expect(screen.getByText('All NCTB textbooks distributed to class')).toBeInTheDocument()
  })

  it('triggers PDF generation for NCTB UEO Register and Overdue Notice', async () => {
    const user = userEvent.setup()
    const nctbSpy = vi.spyOn(pdfModule, 'createBookDistributionReportPdf').mockReturnValue(new Uint8Array([37, 80, 68, 70]))
    const overdueSpy = vi.spyOn(pdfModule, 'createLibraryOverdueNoticePdf').mockReturnValue(new Uint8Array([37, 80, 68, 70]))

    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-pdf')
    window.URL.revokeObjectURL = vi.fn()

    renderLibrary()

    // 1. Download NCTB Register from NCTB tab
    await user.click(screen.getByRole('button', { name: 'NCTB Textbook Register' }))
    const nctbDownloadBtn = screen.getByRole('button', { name: 'Download UEO Register (PDF)' })
    await user.click(nctbDownloadBtn)

    expect(nctbSpy).toHaveBeenCalledWith(
      expect.anything(),
      'Class 6-A',
      expect.anything(),
    )

    // 2. Download Overdue Notice from Overdue tab
    await user.click(screen.getByRole('button', { name: 'Overdue & Fines' }))
    const overdueDownloadBtn = screen.getByRole('button', { name: 'Download Overdue Notice (PDF)' })
    await user.click(overdueDownloadBtn)

    expect(overdueSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
    )
  })
})
