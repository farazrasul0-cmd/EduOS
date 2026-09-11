import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { OfflineBanner } from '@/components/layout/OfflineBanner'
import i18n from '@/i18n'

describe('OfflineBanner Component', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    vi.useFakeTimers()
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      configurable: true,
      writable: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing when browser is online initially', () => {
    const { container } = render(<OfflineBanner />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows offline warning banner when offline event is fired', () => {
    render(<OfflineBanner />)

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })

    const banner = screen.getByRole('status')
    expect(banner).toBeInTheDocument()
    expect(banner).toHaveTextContent(/You are currently offline/i)
  })

  it('shows restored banner when connection comes back online, then hides after delay', () => {
    render(<OfflineBanner />)

    // First go offline
    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    expect(screen.getByText(/You are currently offline/i)).toBeInTheDocument()

    // Then come back online
    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    expect(screen.getByText(/Internet connection restored/i)).toBeInTheDocument()

    // Fast-forward 3.5s
    act(() => {
      vi.advanceTimersByTime(3500)
    })

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('renders immediately when navigator.onLine is false at mount', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      configurable: true,
      writable: true,
    })

    render(<OfflineBanner />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/You are currently offline/i)).toBeInTheDocument()
  })
})
