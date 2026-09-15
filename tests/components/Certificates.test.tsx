import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Certificates from '@/pages/Certificates'
import { resetCertificatesStore } from '@/data/certificates'
import { ToastProvider } from '@/components/ui/Toast'
import * as pdfModule from '@/lib/certificates-pdf'
import i18n from '@/i18n'

describe('Certificates Component (Phase 14: Certificate & Document Issuance Center)', () => {
  let queryClient: QueryClient

  beforeEach(async () => {
    resetCertificatesStore()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    await i18n.changeLanguage('en')
    vi.clearAllMocks()
  })

  function renderCertificates() {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ToastProvider>
            <Certificates />
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }

  it('renders certificate center with KPIs and issuance register', () => {
    renderCertificates()

    expect(screen.getByText('Certificate & Document Center')).toBeInTheDocument()
    expect(screen.getByText('Total Issued')).toBeInTheDocument()
    expect(screen.getAllByText('Bonafide Certificates').length).toBeGreaterThanOrEqual(1)

    // Default roster records
    expect(screen.getByText('Amina Begum')).toBeInTheDocument()
    expect(screen.getByText('Sabbir Hossain')).toBeInTheDocument()
    expect(screen.getByText('Tanvir Hasan')).toBeInTheDocument()
  })

  it('filters certificate records by search query', async () => {
    const user = userEvent.setup()
    renderCertificates()

    expect(screen.getByText('Amina Begum')).toBeInTheDocument()
    expect(screen.getByText('Sabbir Hossain')).toBeInTheDocument()

    const searchInput = screen.getByPlaceholderText(/Search/i)
    await user.type(searchInput, 'Amina')

    expect(screen.getByText('Amina Begum')).toBeInTheDocument()
    expect(screen.queryByText('Sabbir Hossain')).not.toBeInTheDocument()
  })

  it('filters certificates by segmented tab', async () => {
    const user = userEvent.setup()
    renderCertificates()

    const testimonialsTab = screen.getByRole('button', { name: 'Testimonials' })
    await user.click(testimonialsTab)

    expect(screen.getByText('Sabbir Hossain')).toBeInTheDocument()
    expect(screen.getByText('Fatima Zahra')).toBeInTheDocument()
    expect(screen.queryByText('Amina Begum')).not.toBeInTheDocument()
  })

  it('opens and closes Issue Official Certificate modal', async () => {
    const user = userEvent.setup()
    renderCertificates()

    const issueButtons = screen.getAllByRole('button', { name: /Issue Certificate/i })
    await user.click(issueButtons[0])

    expect(screen.getByText('Issue Official Certificate')).toBeInTheDocument()
    expect(screen.getByText('Student Information')).toBeInTheDocument()

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i })
    await user.click(cancelBtn)

    expect(screen.queryByText('Issue Official Certificate')).not.toBeInTheDocument()
  })

  it('triggers PDF download when PDF button is clicked', async () => {
    const tcSpy = vi.spyOn(pdfModule, 'createTransferCertificatePdf')
    const user = userEvent.setup()
    renderCertificates()

    const downloadButtons = screen.getAllByTitle('Download PDF')
    expect(downloadButtons.length).toBeGreaterThan(0)

    await user.click(downloadButtons[0])
    expect(tcSpy).toHaveBeenCalled()
  })

  it('allows revoking an issued certificate', async () => {
    const user = userEvent.setup()
    renderCertificates()

    const revokeButtons = screen.getAllByTitle('Revoke')
    expect(revokeButtons.length).toBeGreaterThan(0)

    await user.click(revokeButtons[0])
    expect(await screen.findByText(/Certificate revoked successfully/i)).toBeInTheDocument()
  })
})
