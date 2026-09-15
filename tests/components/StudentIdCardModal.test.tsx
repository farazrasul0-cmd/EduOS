import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StudentIdCardModal } from '@/components/StudentIdCardModal'
import type { StudentIdCardData } from '@/lib/student-id-card'
import * as pdfModule from '@/lib/student-id-card-pdf'
import i18n from '@/i18n'

const mockStudents: StudentIdCardData[] = [
  {
    id: 'stu-1',
    studentId: 'STU-2026-0001',
    studentName: 'Abrar Fahim',
    rollNo: '01',
    className: 'Class 8-A',
    bloodGroup: 'B+',
    dob: '2012-03-15',
    guardianName: 'Dr. M. Fahim',
    guardianPhone: '+880 1711-112233',
    schoolName: 'Ideal School and College',
    schoolAddress: 'Motijheel, Dhaka',
    eiin: '108234',
    academicYear: '2026',
    validUntil: '31-12-2026',
  },
  {
    id: 'stu-2',
    studentId: 'STU-2026-0002',
    studentName: 'Nusrat Jahan',
    rollNo: '02',
    className: 'Class 8-A',
    bloodGroup: 'O+',
    dob: '2012-07-22',
    guardianName: 'Engr. K. Jahan',
    guardianPhone: '+880 1819-445566',
    schoolName: 'Ideal School and College',
    schoolAddress: 'Motijheel, Dhaka',
    eiin: '108234',
    academicYear: '2026',
    validUntil: '31-12-2026',
  },
]

describe('StudentIdCardModal Component (Phase 10: Student ID Card Generator)', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    vi.clearAllMocks()
  })

  it('renders modal with CR80 front card preview and student information', () => {
    render(
      <StudentIdCardModal
        open={true}
        onClose={vi.fn()}
        students={[mockStudents[0]]}
        schoolName="Ideal School and College"
        eiin="108234"
      />,
    )

    expect(screen.getByTestId('id-card-front')).toBeInTheDocument()
    expect(screen.getByText('Abrar Fahim')).toBeInTheDocument()
    expect(screen.getByText('STU-2026-0001')).toBeInTheDocument()
    expect(screen.getByText(/EIIN: 108234/i)).toBeInTheDocument()
    expect(screen.getByText(/Blood Group: B\+/i)).toBeInTheDocument()
    expect(screen.getByText(/Valid Until: 31-12-2026/i)).toBeInTheDocument()
  })

  it('flips between front and back card views on click or toggle button', async () => {
    const user = userEvent.setup()
    render(
      <StudentIdCardModal
        open={true}
        onClose={vi.fn()}
        students={[mockStudents[0]]}
      />,
    )

    // Initial state: Front is shown
    expect(screen.getByTestId('id-card-front')).toBeInTheDocument()
    expect(screen.queryByTestId('id-card-back')).not.toBeInTheDocument()

    // Click "View Back" toggle button
    const flipButton = screen.getByRole('button', { name: /View Back/i })
    await user.click(flipButton)

    // Back is now displayed
    expect(screen.getByTestId('id-card-back')).toBeInTheDocument()
    expect(screen.queryByTestId('id-card-front')).not.toBeInTheDocument()
    expect(screen.getByText('Dr. M. Fahim')).toBeInTheDocument()
    expect(screen.getByText('+880 1711-112233')).toBeInTheDocument()
    expect(screen.getByLabelText('Student verification QR code')).toBeInTheDocument()

    // Flip back to Front
    const flipBackBtn = screen.getByRole('button', { name: /View Front/i })
    await user.click(flipBackBtn)
    expect(screen.getByTestId('id-card-front')).toBeInTheDocument()
  })

  it('navigates between students in batch mode with pagination indicator', async () => {
    const user = userEvent.setup()
    render(
      <StudentIdCardModal
        open={true}
        onClose={vi.fn()}
        students={mockStudents}
      />,
    )

    // Initially Student 1 (Abrar Fahim)
    expect(screen.getByText('Abrar Fahim')).toBeInTheDocument()
    expect(screen.getByText('1 / 2')).toBeInTheDocument()

    // Click next student
    const nextBtn = screen.getByRole('button', { name: 'Next student' })
    await user.click(nextBtn)

    // Now Student 2 (Nusrat Jahan)
    expect(screen.getByText('Nusrat Jahan')).toBeInTheDocument()
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
  })

  it('triggers single student ID card PDF download', async () => {
    const user = userEvent.setup()
    const spy = vi.spyOn(pdfModule, 'createSingleStudentIdCardPdf').mockReturnValue(new Uint8Array([37, 80, 68, 70]))

    // Mock URL.createObjectURL
    const createObjectUrlMock = vi.fn().mockReturnValue('blob:mock-url')
    const revokeObjectUrlMock = vi.fn()
    window.URL.createObjectURL = createObjectUrlMock
    window.URL.revokeObjectURL = revokeObjectUrlMock

    render(
      <StudentIdCardModal
        open={true}
        onClose={vi.fn()}
        students={[mockStudents[0]]}
      />,
    )

    const downloadBtn = screen.getByRole('button', { name: /Download ID Card \(PDF\)/i })
    await user.click(downloadBtn)

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        studentName: 'Abrar Fahim',
        studentId: 'STU-2026-0001',
      }),
    )
  })

  it('triggers batch A4 sheet PDF download for all selected students', async () => {
    const user = userEvent.setup()
    const spy = vi.spyOn(pdfModule, 'createBatchStudentIdCardsPdf').mockReturnValue(new Uint8Array([37, 80, 68, 70]))

    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-batch-url')
    window.URL.revokeObjectURL = vi.fn()

    render(
      <StudentIdCardModal
        open={true}
        onClose={vi.fn()}
        students={mockStudents}
      />,
    )

    const batchBtn = screen.getByRole('button', { name: /Download A4 Sheet/i })
    await user.click(batchBtn)

    expect(spy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ studentName: 'Abrar Fahim' }),
        expect.objectContaining({ studentName: 'Nusrat Jahan' }),
      ]),
      expect.objectContaining({ side: 'front' }),
    )
  })
})
