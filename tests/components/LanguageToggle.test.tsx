import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageToggle } from '@/components/layout/LanguageToggle'
import i18n from '@/i18n'

describe('LanguageToggle component', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('renders language switch buttons', () => {
    render(<LanguageToggle />)
    expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'বাংলা' })).toBeInTheDocument()
  })

  it('highlights English by default and switches to Bangla on click', async () => {
    const user = userEvent.setup()
    render(<LanguageToggle />)

    const enButton = screen.getByRole('button', { name: 'English' })
    const bnButton = screen.getByRole('button', { name: 'বাংলা' })

    expect(enButton).toHaveAttribute('aria-pressed', 'true')
    expect(bnButton).toHaveAttribute('aria-pressed', 'false')

    await user.click(bnButton)

    expect(i18n.resolvedLanguage).toBe('bn')
    expect(bnButton).toHaveAttribute('aria-pressed', 'true')
    expect(enButton).toHaveAttribute('aria-pressed', 'false')
  })
})
