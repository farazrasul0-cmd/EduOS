import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ParentMessages from '@/pages/ParentMessages'
import i18n from '@/i18n'

const mockSendMessage = vi.fn()
const mockMarkRead = vi.fn()
const mockCreateThread = vi.fn()

const mockThreads = [
  {
    id: 'th-1',
    school_id: 'sch-1',
    guardian_id: 'g-1',
    student_id: 's-1',
    guardian_name: 'Farhana Ahmed',
    student_name: 'Tanvir Ahmed',
    student_roll: '7A-01',
    last_body: 'Is there school tomorrow?',
    unread_count: 1,
    last_message_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'th-2',
    school_id: 'sch-1',
    guardian_id: 'g-2',
    student_id: 's-2',
    guardian_name: 'Rafiqul Islam',
    student_name: 'Nusrat Jahan',
    student_roll: '7A-02',
    last_body: 'Fee paid via bKash',
    unread_count: 0,
    last_message_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
]

const mockMessages = [
  {
    id: 'msg-1',
    school_id: 'sch-1',
    thread_id: 'th-1',
    sender_id: 'g-1',
    body: 'Assalamu alaikum teacher, is there school tomorrow?',
    created_at: new Date().toISOString(),
    read_at: null,
  },
  {
    id: 'msg-2',
    school_id: 'sch-1',
    thread_id: 'th-1',
    sender_id: 'u-current',
    body: 'Wa alaikum assalam. Yes, classes run as scheduled.',
    created_at: new Date().toISOString(),
    read_at: null,
  },
]

vi.mock('@/auth/context', () => ({
  useAuth: () => ({
    user: { id: 'u-current', email: 'teacher@school.edu.bd' },
    profile: { id: 'u-current', school_id: 'sch-1', full_name: 'Nazmul Huda' },
    session: null,
    loading: false,
    refreshProfile: vi.fn(),
    signOut: vi.fn(),
  }),
}))

vi.mock('@/data/messages', () => ({
  useThreads: () => ({
    data: mockThreads,
    isPending: false,
  }),
  useMessages: () => ({
    data: mockMessages,
    isPending: false,
  }),
  useStudentStats: () => ({
    data: {
      attendancePct: 92,
      avgScorePct: 84,
      feesStatus: 'paid',
    },
    isPending: false,
  }),
  useSendMessage: () => ({
    mutate: mockSendMessage,
    isPending: false,
  }),
  useMarkThreadRead: () => ({
    mutate: mockMarkRead,
    isPending: false,
  }),
  useMessageRecipients: () => ({
    data: [
      {
        guardian_id: 'g-1',
        guardian_name: 'Farhana Ahmed',
        student_id: 's-1',
        student_name: 'Tanvir Ahmed',
      },
    ],
    isPending: false,
  }),
  useCreateThread: () => ({
    mutateAsync: mockCreateThread,
    isPending: false,
  }),
}))

describe('ParentMessages component & Mobile Experience', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    vi.clearAllMocks()
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  it('renders threads list with guardian names', () => {
    render(<ParentMessages />)
    expect(screen.getAllByText('Farhana Ahmed').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Rafiqul Islam')).toBeInTheDocument()
  })

  it('filters thread list by search keyword', async () => {
    const user = userEvent.setup()
    render(<ParentMessages />)

    const searchInput = screen.getByPlaceholderText(/Search parents/i)
    await user.type(searchInput, 'Rafiqul')

    expect(screen.getByText('Rafiqul Islam')).toBeInTheDocument()
    expect(screen.queryByText("Tanvir Ahmed's parent")).not.toBeInTheDocument()
    expect(screen.getByText("Nusrat Jahan's parent")).toBeInTheDocument()
  })

  it('displays message thread and allows sending a message', async () => {
    const user = userEvent.setup()
    render(<ParentMessages />)

    expect(screen.getByText('Assalamu alaikum teacher, is there school tomorrow?')).toBeInTheDocument()
    expect(screen.getByText('Wa alaikum assalam. Yes, classes run as scheduled.')).toBeInTheDocument()

    const replyInput = screen.getByPlaceholderText(/Write a reply/i)
    await user.type(replyInput, 'Please bring the art supplies')

    const sendBtn = screen.getByRole('button', { name: /^send$/i })
    await user.click(sendBtn)

    expect(mockSendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        school_id: 'sch-1',
        thread_id: 'th-1',
        sender_id: 'u-current',
        body: 'Please bring the art supplies',
      }),
      expect.anything(),
    )
  })

  it('toggles mobile student info banner when info icon is clicked', async () => {
    const user = userEvent.setup()
    render(<ParentMessages />)

    const infoBtn = screen.getByRole('button', { name: /student information/i })
    expect(infoBtn).toBeInTheDocument()

    // Initially mobile stats banner is hidden
    expect(screen.queryByText(/Attendance/i)).toBeInTheDocument() // Desktop sidebar has it

    await user.click(infoBtn)
    // The button aria-label flips to hide
    expect(screen.getByRole('button', { name: /hide student information/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /hide student information/i }))
    expect(screen.getByRole('button', { name: /student information/i })).toBeInTheDocument()
  })

  it('provides accessible back button to return to thread list on mobile view', async () => {
    const user = userEvent.setup()
    render(<ParentMessages />)

    // Select the second thread
    const secondThread = screen.getByText('Rafiqul Islam')
    await user.click(secondThread)

    // Back button should be present in conversation header
    const backBtn = screen.getByRole('button', { name: /back to conversations/i })
    expect(backBtn).toBeInTheDocument()

    // Clicking back resets selection
    await user.click(backBtn)
  })
})
