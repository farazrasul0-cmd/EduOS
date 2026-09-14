import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AdmissionPortal from '@/pages/AdmissionPortal'
import { resetAdmissionsStore } from '@/data/admissions'
import * as pdfModule from '@/lib/admissions-pdf'
import i18n from '@/i18n'

describe('AdmissionPortal Component (Phase 11: Public Online Application Portal)', () => {
  let queryClient: QueryClient

  beforeEach(async () => {
    resetAdmissionsStore()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    await i18n.changeLanguage('en')
    vi.clearAllMocks()
  })

  function renderPortal() {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdmissionPortal />
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }

  it('renders public admission application form with input fields and headers', () => {
    renderPortal()

    expect(screen.getByRole('heading', { name: 'Online Admission Application' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Student Full Name \(English\)/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/17-Digit Digital Birth Certificate No/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Applying For Class/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Guardian Full Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Guardian Mobile Phone/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Submit Admission Application/i })).toBeInTheDocument()
  })

  it('blocks submission and displays error when birth certificate is not 17 digits', async () => {
    const user = userEvent.setup()
    renderPortal()

    // Fill student name
    await user.type(screen.getByLabelText(/Student Full Name \(English\)/i), 'Rayhan Alam')
    // Fill invalid 10-digit birth certificate
    await user.type(screen.getByLabelText(/17-Digit Digital Birth Certificate No/i), '1234567890')
    // Fill guardian
    await user.type(screen.getByLabelText(/Guardian Full Name/i), 'Alamgir Hossain')
    await user.type(screen.getByLabelText(/Guardian Mobile Phone/i), '01712345678')

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Submit Admission Application/i })
    await user.click(submitBtn)

    expect(screen.getByText(/Birth certificate must be exactly 17 digits/i)).toBeInTheDocument()
  })

  it('submits valid admission application and transitions to confirmation receipt view', async () => {
    const user = userEvent.setup()
    renderPortal()

    await user.type(screen.getByLabelText(/Student Full Name \(English\)/i), 'Kazi Naimul Islam')
    await user.type(screen.getByLabelText(/17-Digit Digital Birth Certificate No/i), '20142692518012345')
    await user.type(screen.getByLabelText(/Guardian Full Name/i), 'Kazi Shafiqul Islam')
    await user.type(screen.getByLabelText(/Guardian Mobile Phone/i), '01819556677')
    await user.type(screen.getByLabelText(/Present Address/i), 'Dhanmondi, Dhaka')

    const submitBtn = screen.getByRole('button', { name: /Submit Admission Application/i })
    await user.click(submitBtn)

    // Expect success screen
    expect(screen.getByText(/Application Submitted Successfully!/i)).toBeInTheDocument()
    expect(screen.getByText(/ADM-2026-/i)).toBeInTheDocument()
    expect(screen.getByText('Kazi Naimul Islam')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Download Application Slip \(PDF\)/i })).toBeInTheDocument()
  })

  it('triggers PDF download of admission slip from confirmation receipt', async () => {
    const user = userEvent.setup()
    const pdfSpy = vi.spyOn(pdfModule, 'createAdmissionAdmitCardPdf').mockReturnValue(new Uint8Array([37, 80, 68, 70]))

    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-slip')
    window.URL.revokeObjectURL = vi.fn()

    renderPortal()

    await user.type(screen.getByLabelText(/Student Full Name \(English\)/i), 'Sadia Islam')
    await user.type(screen.getByLabelText(/17-Digit Digital Birth Certificate No/i), '20142692518012345')
    await user.type(screen.getByLabelText(/Guardian Full Name/i), 'Rafiqul Islam')
    await user.type(screen.getByLabelText(/Guardian Mobile Phone/i), '01712345678')
    await user.type(screen.getByLabelText(/Present Address/i), 'Gulshan, Dhaka')

    await user.click(screen.getByRole('button', { name: /Submit Admission Application/i }))

    const downloadBtn = screen.getByRole('button', { name: /Download Application Slip \(PDF\)/i })
    await user.click(downloadBtn)

    expect(pdfSpy).toHaveBeenCalledWith(
      expect.objectContaining({ studentName: 'Sadia Islam' }),
      expect.anything(),
    )
  })
})
