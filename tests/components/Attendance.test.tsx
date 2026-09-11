import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Attendance from '@/pages/Attendance'
import i18n from '@/i18n'

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
  {
    id: 's-3',
    school_id: 'sch-1',
    full_name: 'Kamal Hossain',
    roll_no: '7A-03',
    class_id: 'c-1',
    class_name: 'Class 7',
    parent_name: 'Belal Hossain',
    parent_phone: '01911000003',
  },
]

const mockAttendance = [
  { student_id: 's-1', status: 'present' as const, date: '2026-05-25' },
  { student_id: 's-2', status: 'absent' as const, date: '2026-05-25' },
  { student_id: 's-3', status: 'present' as const, date: '2026-05-25' },
]

const mockMonthlyAttendance = [
  // s-1: 18 present, 2 absent -> 90% (Collegiate)
  ...Array.from({ length: 18 }, (_, i) => ({
    student_id: 's-1',
    date: `2026-05-${String(i + 1).padStart(2, '0')}`,
    status: 'present' as const,
  })),
  ...Array.from({ length: 2 }, (_, i) => ({
    student_id: 's-1',
    date: `2026-05-${String(i + 19).padStart(2, '0')}`,
    status: 'absent' as const,
  })),

  // s-2: 13 present, 6 absent, 1 late -> 65% (Non-Collegiate)
  ...Array.from({ length: 13 }, (_, i) => ({
    student_id: 's-2',
    date: `2026-05-${String(i + 1).padStart(2, '0')}`,
    status: 'present' as const,
  })),
  ...Array.from({ length: 6 }, (_, i) => ({
    student_id: 's-2',
    date: `2026-05-${String(i + 14).padStart(2, '0')}`,
    status: 'absent' as const,
  })),
  {
    student_id: 's-2',
    date: '2026-05-20',
    status: 'late' as const,
  },

  // s-3: 10 present, 8 absent, 2 late -> 50% (Dis-Collegiate)
  ...Array.from({ length: 10 }, (_, i) => ({
    student_id: 's-3',
    date: `2026-05-${String(i + 1).padStart(2, '0')}`,
    status: 'present' as const,
  })),
  ...Array.from({ length: 8 }, (_, i) => ({
    student_id: 's-3',
    date: `2026-05-${String(i + 11).padStart(2, '0')}`,
    status: 'absent' as const,
  })),
  ...Array.from({ length: 2 }, (_, i) => ({
    student_id: 's-3',
    date: `2026-05-${String(i + 19).padStart(2, '0')}`,
    status: 'late' as const,
  })),
]

const mutateSaveAttendance = vi.fn()

vi.mock('@/data/students', () => ({
  useStudents: () => ({
    data: mockStudents,
    isPending: false,
    isError: false,
  }),
}))

vi.mock('@/data/attendance', () => ({
  useAttendance: () => ({
    data: mockAttendance,
    isPending: false,
    isError: false,
  }),
  useAttendanceOverview: () => ({
    data: [
      {
        date: '2026-05-25',
        present: 2,
        absent: 1,
        late: 0,
        leave: 0,
        total: 3,
      },
    ],
    isPending: false,
  }),
  useMonthlyAttendance: () => ({
    data: mockMonthlyAttendance,
    isPending: false,
    isError: false,
  }),
  useSaveAttendance: () => ({
    mutate: mutateSaveAttendance,
    reset: vi.fn(),
    isPending: false,
    isError: false,
  }),
}))

vi.mock('@/lib/sms-gateway', () => ({
  calculateSmsParts: vi.fn(() => ({
    encoding: 'GSM-7' as const,
    chars: 45,
    parts: 1,
    maxCharsPerPart: 160,
  })),
  sendSms: vi.fn(async () => ({
    success: true,
    messageId: 'sms-mock-123',
    recipientCount: 1,
    estimatedCostBdt: 0.35,
    btrcCompliant: true,
  })),
}))

vi.mock('@/lib/attendance', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/attendance')>()
  return {
    ...original,
    createMonthlyAttendancePdf: vi.fn(async () => new Uint8Array([37, 80, 68, 70])),
  }
})

describe('Attendance Component', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    vi.clearAllMocks()
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    window.URL.revokeObjectURL = vi.fn()
  })

  it('renders daily roll call with student list and action buttons', () => {
    render(<Attendance />)

    expect(screen.getByRole('heading', { name: 'Attendance' })).toBeInTheDocument()
    expect(screen.getByText('Tanvir Ahmed')).toBeInTheDocument()
    expect(screen.getByText('Nusrat Jahan')).toBeInTheDocument()
    expect(screen.getByText('Kamal Hossain')).toBeInTheDocument()

    expect(screen.getByRole('button', { name: /Mark all present/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Save attendance/i })).toBeInTheDocument()
  })

  it('switches to Monthly Register tab and displays collegiate classification badges', async () => {
    const user = userEvent.setup()
    render(<Attendance />)

    const monthlyTab = screen.getByRole('button', { name: /Monthly register/i })
    await user.click(monthlyTab)

    expect(screen.getByText(/Monthly Attendance Register/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Download monthly register \(PDF\)/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Export monthly register \(CSV\)/i })).toBeInTheDocument()

    // Check collegiate status badges
    expect(screen.getByText(/Collegiate \(>=75%\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Non-collegiate \(60-74%\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Dis-collegiate \(<60%\)/i)).toBeInTheDocument()
  })

  it('switches to Defaulters tab and shows only students with attendance rate < 75%', async () => {
    const user = userEvent.setup()
    render(<Attendance />)

    const defaultersTab = screen.getByRole('button', { name: /Attendance risk/i })
    await user.click(defaultersTab)

    // Nusrat Jahan (65%) and Kamal Hossain (50%) are < 75%
    expect(screen.getByText('Nusrat Jahan')).toBeInTheDocument()
    expect(screen.getByText('Kamal Hossain')).toBeInTheDocument()

    // Status tags
    expect(screen.getByText('Non-Collegiate')).toBeInTheDocument()
    expect(screen.getByText('Dis-Collegiate')).toBeInTheDocument()

    // Warning SMS triggers
    expect(screen.getAllByRole('button', { name: /Send Attendance Warning SMS/i })).toHaveLength(2)

    // Tanvir Ahmed has 90% and should NOT be in the defaulters list
    const studentNamesInDefaulters = screen.queryAllByText('Tanvir Ahmed')
    expect(studentNamesInDefaulters).toHaveLength(0)
  })

  it('opens BTRC SMS confirmation modal when saving with absent students and notify parents checked', async () => {
    const user = userEvent.setup()
    render(<Attendance />)

    // Click Absent for student 1 to make a change
    const absentButtons = screen.getAllByRole('button', { name: /Absent/i })
    await user.click(absentButtons[0])

    const saveBtn = screen.getByRole('button', { name: /Save attendance/i })
    expect(saveBtn).toBeEnabled()
    await user.click(saveBtn)

    // SMS Modal should be visible
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/Send absence SMS alerts/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Tanvir Ahmed/i).length).toBeGreaterThanOrEqual(2)

    // Click confirm send & save
    const confirmBtn = screen.getByRole('button', { name: /Send .* SMS alerts/i })
    await user.click(confirmBtn)

    expect(mutateSaveAttendance).toHaveBeenCalledWith(
      expect.objectContaining({
        notifyParents: true,
      }),
      expect.any(Object),
    )
  })

  it('triggers Monthly Register PDF export when download button is clicked', async () => {
    const user = userEvent.setup()
    render(<Attendance />)

    const monthlyTab = screen.getByRole('button', { name: /Monthly register/i })
    await user.click(monthlyTab)

    const downloadPdfBtn = screen.getByRole('button', { name: /Download monthly register \(PDF\)/i })
    await user.click(downloadPdfBtn)

    await waitFor(() => {
      expect(window.URL.createObjectURL).toHaveBeenCalled()
    })
  })
})
