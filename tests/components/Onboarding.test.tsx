import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Onboarding from '@/pages/Onboarding'
import i18n from '@/i18n'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockRefreshProfile = vi.fn(async () => {})
const mockSignOut = vi.fn(async () => {})

vi.mock('@/auth/context', () => ({
  useAuth: () => ({
    user: { id: 'user-test-123', email: 'principal@sunrise.edu.bd' },
    profile: null,
    loading: false,
    refreshProfile: mockRefreshProfile,
    signOut: mockSignOut,
  }),
}))

const mockRpc = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: (...args: unknown[]) => mockFrom(...args),
  },
}))

describe('Onboarding Component & Setup Wizard', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    vi.clearAllMocks()
    mockRpc.mockResolvedValue({ data: 'new-school-uuid-456', error: null })
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    })
  })

  it('renders onboarding header, demo school banner, and initial step', () => {
    render(<Onboarding />)

    expect(screen.getByRole('heading', { name: /Set up your school/i })).toBeInTheDocument()
    expect(screen.getByText(/Explore the demo school/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Join demo school/i })).toBeInTheDocument()

    // Step 1 title
    expect(screen.getByRole('heading', { name: /Institute Identity/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/e\.g\. Sunrise Academy/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/e\.g\. 108234/i)).toBeInTheDocument()
  })

  it('joins demo school on one-click button press', async () => {
    const user = userEvent.setup()
    render(<Onboarding />)

    const joinDemoBtn = screen.getByRole('button', { name: /Join demo school/i })
    await user.click(joinDemoBtn)

    expect(mockRpc).toHaveBeenCalledWith('join_demo_school')
    await waitFor(() => {
      expect(mockRefreshProfile).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  it('blocks step 1 progression when school name or EIIN is invalid', async () => {
    const user = userEvent.setup()
    render(<Onboarding />)

    const nextBtn = screen.getByRole('button', { name: /Next step/i })
    await user.click(nextBtn)

    // Name is required
    expect(screen.getByText(/School name is required/i)).toBeInTheDocument()

    // Enter name, but invalid EIIN (e.g. 5 digits)
    const nameInput = screen.getByPlaceholderText(/e\.g\. Sunrise Academy/i)
    await user.type(nameInput, 'Sunrise Model High School')

    const eiinInput = screen.getByPlaceholderText(/e\.g\. 108234/i)
    await user.type(eiinInput, '12345') // 5 digits
    await user.click(nextBtn)

    expect(screen.getByText(/EIIN must be exactly 6 numeric digits/i)).toBeInTheDocument()
  })

  it('progresses through full 4-step wizard and launches institution dashboard', async () => {
    const user = userEvent.setup()
    render(<Onboarding />)

    // --- STEP 1: Institute Identity ---
    const nameInput = screen.getByPlaceholderText(/e\.g\. Sunrise Academy/i)
    await user.type(nameInput, 'Sunrise Model High School')

    const eiinInput = screen.getByPlaceholderText(/e\.g\. 108234/i)
    await user.type(eiinInput, '108234') // Valid 6 digits

    const nextBtn = screen.getByRole('button', { name: /Next step/i })
    await user.click(nextBtn)

    // --- STEP 2: Shifts & Medium ---
    expect(screen.getByRole('heading', { name: /Shifts & Medium/i })).toBeInTheDocument()
    expect(screen.getByText('Morning Shift')).toBeInTheDocument()
    expect(screen.getByText('Day Shift')).toBeInTheDocument()

    // Select Morning Shift
    await user.click(screen.getByText('Morning Shift'))
    await user.click(screen.getByRole('button', { name: /Next step/i }))

    // --- STEP 3: Academic Structure & Fees ---
    expect(screen.getByRole('heading', { name: /Academic Structure & Fees/i })).toBeInTheDocument()
    expect(screen.getByText('Class 6')).toBeInTheDocument()
    expect(screen.getByText('Class 10')).toBeInTheDocument()
    expect(screen.getByText(/Monthly Tuition Fee/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Next step/i }))

    // --- STEP 4: Review & Launch ---
    expect(screen.getByRole('heading', { name: /Review & Launch/i })).toBeInTheDocument()
    expect(screen.getAllByText('Sunrise Model High School').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('108234')).toBeInTheDocument()
    expect(screen.getAllByText(/Morning Shift/i).length).toBeGreaterThanOrEqual(1)

    const launchBtn = screen.getByRole('button', { name: /Launch Institution Dashboard/i })
    await user.click(launchBtn)

    // Verifies creation RPC
    expect(mockRpc).toHaveBeenCalledWith('create_school_for_current_user', {
      school_name: 'Sunrise Model High School',
    })

    await waitFor(() => {
      expect(mockRefreshProfile).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  it('allows navigating backward using Back button', async () => {
    const user = userEvent.setup()
    render(<Onboarding />)

    const nameInput = screen.getByPlaceholderText(/e\.g\. Sunrise Academy/i)
    await user.type(nameInput, 'Greenfield Academy')
    const eiinInput = screen.getByPlaceholderText(/e\.g\. 108234/i)
    await user.type(eiinInput, '109988')

    await user.click(screen.getByRole('button', { name: /Next step/i }))
    expect(screen.getByRole('heading', { name: /Shifts & Medium/i })).toBeInTheDocument()

    // Click Back
    const backBtn = screen.getByRole('button', { name: /Back/i })
    await user.click(backBtn)

    expect(screen.getByRole('heading', { name: /Institute Identity/i })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Greenfield Academy')).toBeInTheDocument()
  })
})
