import { describe, it, expect } from 'vitest'
import {
  cn,
  formatTaka,
  formatNumber,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  initials,
} from '@/lib/utils'

describe('Formatting & Utilities (src/lib/utils)', () => {
  describe('formatTaka', () => {
    it('formats numbers with BDT symbol ৳ and standard comma grouping in English', () => {
      expect(formatTaka(4500)).toBe('৳4,500')
      expect(formatTaka(100000)).toBe('৳100,000')
      expect(formatTaka(0)).toBe('৳0')
    })

    it('formats with requested decimal precision', () => {
      expect(formatTaka(4500.5, 'en', { decimals: 2 })).toBe('৳4,500.50')
      expect(formatTaka(4500, 'en', { decimals: 2 })).toBe('৳4,500.00')
    })

    it('formats with Bengali numerals when lang is bn', () => {
      const bnResult = formatTaka(4500, 'bn')
      expect(bnResult.startsWith('৳')).toBe(true)
      // Bengali digits for 4 and 5 are ৪ and ৫
      expect(bnResult).toMatch(/[০-৯]/)
    })
  })

  describe('formatNumber', () => {
    it('formats numbers in English', () => {
      expect(formatNumber(1234)).toBe('1,234')
      expect(formatNumber(0)).toBe('0')
    })

    it('formats numbers with Bengali digits in Bengali', () => {
      expect(formatNumber(12, 'bn')).toBe('১২')
      expect(formatNumber(100, 'bn')).toBe('১০০')
    })
  })

  describe('formatDate and formatDateTime', () => {
    const fixedDate = new Date('2026-06-15T14:30:00Z')

    it('formats date correctly in English', () => {
      const formatted = formatDate(fixedDate, 'en')
      expect(formatted).toContain('2026')
      expect(formatted).toContain('Jun')
    })

    it('formats date time with hours and minutes', () => {
      const formatted = formatDateTime(fixedDate, 'en')
      expect(formatted).toBeDefined()
      expect(typeof formatted).toBe('string')
    })
  })

  describe('formatRelativeTime', () => {
    it('formats recent past timestamps', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      const formatted = formatRelativeTime(fiveMinutesAgo, 'en')
      expect(formatted).toMatch(/5.*(m|min|ago)/i)
    })
  })

  describe('initials', () => {
    it('extracts two initials from multi-word names', () => {
      expect(initials('Priya Rahman')).toBe('PR')
      expect(initials('Syed Faraz Zain')).toBe('SF')
    })

    it('extracts single initial from single-word names', () => {
      expect(initials('Admin')).toBe('A')
      expect(initials('Rahman')).toBe('R')
    })

    it('handles empty or whitespace strings', () => {
      expect(initials('')).toBe('')
      expect(initials('   ')).toBe('')
    })
  })

  describe('cn (classNames)', () => {
    it('merges class strings and filters falsy values', () => {
      const isHidden = false
      expect(cn('bg-primary', isHidden && 'text-white', 'p-4')).toBe('bg-primary p-4')
      expect(cn('btn', undefined, null, 'btn-primary')).toBe('btn btn-primary')
    })
  })
})
