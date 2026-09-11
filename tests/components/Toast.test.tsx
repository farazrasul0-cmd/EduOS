import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider, useToast } from '@/components/ui/Toast'

function TestTrigger() {
  const toast = useToast()
  return (
    <div>
      <button
        type="button"
        onClick={() => toast.success('Student enrolled successfully', 'Created')}
      >
        Trigger Success
      </button>
      <button
        type="button"
        onClick={() => toast.error('Payment failed', 'Error')}
      >
        Trigger Error
      </button>
      <button
        type="button"
        onClick={() => toast.info('System update in progress')}
      >
        Trigger Info
      </button>
      <button
        type="button"
        onClick={() => toast.show({ message: 'Custom temporary message', tone: 'info', duration: 1000 })}
      >
        Trigger Quick
      </button>
    </div>
  )
}

describe('Toast Component & Provider', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('throws error when useToast is used outside of ToastProvider', () => {
    const ComponentWithoutProvider = () => {
      useToast()
      return null
    }

    // Suppress React error boundary log in console during this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<ComponentWithoutProvider />)).toThrow(
      'useToast must be used within a ToastProvider',
    )
    consoleError.mockRestore()
  })

  it('renders success toast with title and message', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(
      <ToastProvider>
        <TestTrigger />
      </ToastProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Trigger Success' }))

    expect(screen.getByText('Created')).toBeInTheDocument()
    expect(screen.getByText('Student enrolled successfully')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders danger toast with role alert', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(
      <ToastProvider>
        <TestTrigger />
      </ToastProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Trigger Error' }))

    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('Payment failed')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('dismisses toast when close button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(
      <ToastProvider>
        <TestTrigger />
      </ToastProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Trigger Info' }))
    expect(screen.getByText('System update in progress')).toBeInTheDocument()

    const closeBtn = screen.getByRole('button', { name: 'Close notification' })
    await user.click(closeBtn)

    expect(screen.queryByText('System update in progress')).not.toBeInTheDocument()
  })

  it('auto-dismisses toast after duration expires', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(
      <ToastProvider>
        <TestTrigger />
      </ToastProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Trigger Quick' }))
    expect(screen.getByText('Custom temporary message')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1100)
    })

    expect(screen.queryByText('Custom temporary message')).not.toBeInTheDocument()
  })
})
