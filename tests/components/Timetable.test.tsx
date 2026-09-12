import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Timetable from '@/pages/Timetable'
import i18n from '@/i18n'
import type { SlotJoined } from '@/data/timetable'

const mockClasses = [
  { id: 'c-7', school_id: 'sch-1', name: 'Class 7', grade: '7', teacher_id: 't-1' },
  { id: 'c-8', school_id: 'sch-1', name: 'Class 8', grade: '8', teacher_id: 't-2' },
]

const mockSubjects = [
  { id: 'sub-math', school_id: 'sch-1', name: 'Mathematics', code: 'MTH-101' },
  { id: 'sub-sci', school_id: 'sch-1', name: 'Science', code: 'SCI-101' },
]

const mockTeachers = [
  { id: 't-rahim', full_name: 'Abdur Rahim' },
  { id: 't-karim', full_name: 'Karim Ullah' },
]

const mockSlots: SlotJoined[] = [
  {
    id: 'slot-1',
    school_id: 'sch-1',
    class_id: 'c-7',
    class_name: 'Class 7',
    subject_id: 'sub-math',
    subject_name: 'Mathematics',
    teacher_id: 't-rahim',
    teacher_name: 'Abdur Rahim',
    day_of_week: 1, // Saturday
    period: 1,
    start_time: '08:00',
    end_time: '08:40',
    room: 'Room 201',
  },
  {
    id: 'slot-2',
    school_id: 'sch-1',
    class_id: 'c-8',
    class_name: 'Class 8',
    subject_id: 'sub-sci',
    subject_name: 'Science',
    teacher_id: 't-karim',
    teacher_name: 'Karim Ullah',
    day_of_week: 2, // Sunday
    period: 2,
    start_time: '08:45',
    end_time: '09:25',
    room: 'Lab 1',
  },
]

const mockSaveSlot = vi.fn(async () => {})
const mockDeleteSlot = vi.fn(async () => {})
const mockCreateClassRoutinePdf = vi.fn(() => new Uint8Array([37, 80, 68, 70]))

vi.mock('@/auth/context', () => ({
  useAuth: () => ({
    user: { id: 'u-1' },
    profile: { id: 'u-1', school_id: 'sch-1', role: 'admin' },
  }),
}))

vi.mock('@/data/timetable', () => ({
  useTimetable: () => ({
    data: mockSlots,
    isPending: false,
    isError: false,
  }),
  useTimetableTeachers: () => ({
    data: mockTeachers,
    isPending: false,
  }),
  useSaveTimetableSlot: () => ({
    mutateAsync: mockSaveSlot,
    isPending: false,
  }),
  useDeleteTimetableSlot: () => ({
    mutateAsync: mockDeleteSlot,
    isPending: false,
  }),
}))

vi.mock('@/data/students', () => ({
  useClasses: () => ({
    data: mockClasses,
    isPending: false,
  }),
}))

vi.mock('@/data/assignments', () => ({
  useSubjects: () => ({
    data: mockSubjects,
    isPending: false,
  }),
}))

vi.mock('@/lib/class-routine-pdf', () => ({
  createClassRoutinePdf: (...args: unknown[]) => mockCreateClassRoutinePdf(...args),
}))

describe('Timetable Component (Phase 9: Academic Routine Scheduler)', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    vi.clearAllMocks()
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    window.URL.revokeObjectURL = vi.fn()
  })

  it('renders timetable page with Bangladesh Saturday-Thursday academic week', () => {
    render(<Timetable />)

    expect(screen.getByRole('heading', { name: 'Timetable' })).toBeInTheDocument()
    // Verify Bangladesh Saturday-Thursday days are present in the routine header
    expect(screen.getByText('Saturday')).toBeInTheDocument()
    expect(screen.getByText('Sunday')).toBeInTheDocument()
    expect(screen.getByText('Monday')).toBeInTheDocument()
    expect(screen.getByText('Tuesday')).toBeInTheDocument()
    expect(screen.getByText('Wednesday')).toBeInTheDocument()
    expect(screen.getByText('Thursday')).toBeInTheDocument()

    // Friday holiday indicator
    expect(screen.getByText('Friday · Weekly Holiday')).toBeInTheDocument()

    // Slots rendered
    expect(screen.getAllByText('Mathematics').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Science').length).toBeGreaterThanOrEqual(1)
  })

  it('filters timetable slots when a specific class is selected', async () => {
    const user = userEvent.setup()
    render(<Timetable />)

    const classSelector = screen.getByLabelText('Filter by class')
    expect(classSelector).toBeInTheDocument()

    // Select Class 7
    await user.selectOptions(classSelector, 'c-7')

    // Abdur Rahim (Class 7) should still be present, while Karim Ullah (Class 8) slot is filtered out
    expect(screen.getByText(/Abdur Rahim/i)).toBeInTheDocument()
    expect(screen.queryByText(/Karim Ullah/i)).not.toBeInTheDocument()
  })

  it('detects and displays real-time clash warning in the slot editor modal', async () => {
    const user = userEvent.setup()
    render(<Timetable />)

    const editBtn = screen.getByRole('button', { name: /Edit timetable/i })
    await user.click(editBtn)

    // Form inputs
    const classSelect = screen.getByRole('combobox', { name: 'Class' })
    const subjectSelect = screen.getByRole('combobox', { name: 'Subject' })
    const teacherSelect = screen.getByRole('combobox', { name: 'Teacher' })
    const daySelect = screen.getByRole('combobox', { name: 'Day' })
    const periodSelect = screen.getByRole('combobox', { name: 'Period' })

    // Book Class 8 with Abdur Rahim on Saturday (day 1), Period 1 (where he already teaches Class 7)
    await user.selectOptions(classSelect, 'c-8')
    await user.selectOptions(subjectSelect, 'sub-math')
    await user.selectOptions(teacherSelect, 't-rahim')
    await user.selectOptions(daySelect, '1')
    await user.selectOptions(periodSelect, '1')

    // Clash warning banner should immediately appear
    await waitFor(() => {
      expect(
        screen.getByText(/Abdur Rahim is already assigned to Class 7 on Period P1/i),
      ).toBeInTheDocument()
    })
  })

  it('triggers A4 Landscape Class Routine PDF download', async () => {
    const user = userEvent.setup()
    render(<Timetable />)

    const downloadPdfBtn = screen.getByRole('button', { name: /Download routine \(PDF\)/i })
    await user.click(downloadPdfBtn)

    expect(mockCreateClassRoutinePdf).toHaveBeenCalledTimes(1)
    expect(mockCreateClassRoutinePdf).toHaveBeenCalledWith(
      expect.objectContaining({
        eiin: '108234',
        academicYear: '2026',
        slots: expect.arrayContaining([
          expect.objectContaining({
            dayOfWeek: 1,
            period: 1,
            subjectName: 'Mathematics',
          }),
        ]),
      }),
    )
    expect(window.URL.createObjectURL).toHaveBeenCalled()
  })

  it('exports timetable routine to CSV format', async () => {
    const user = userEvent.setup()
    render(<Timetable />)

    const exportCsvBtn = screen.getByRole('button', { name: /Export routine \(CSV\)/i })
    await user.click(exportCsvBtn)

    expect(window.URL.createObjectURL).toHaveBeenCalled()
    expect(window.URL.revokeObjectURL).toHaveBeenCalled()
  })
})
