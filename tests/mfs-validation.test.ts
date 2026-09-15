import { describe, it, expect } from 'vitest'
import {
  normalizeBdMobile,
  validateBdMobile,
  formatTrxId,
  validateTrxId,
} from '../src/lib/mfs-validation'

describe('mfs-validation', () => {
  describe('normalizeBdMobile & validateBdMobile', () => {
    it('normalizes local, +88, and 88 prefixed phone numbers', () => {
      expect(normalizeBdMobile('01712345678')).toBe('01712345678')
      expect(normalizeBdMobile('+8801812345678')).toBe('01812345678')
      expect(normalizeBdMobile('8801912345678')).toBe('01912345678')
      expect(normalizeBdMobile('0171-234 5678')).toBe('01712345678')
    })

    it('validates standard Bangladesh operator prefixes', () => {
      expect(validateBdMobile('01711223344')).toBe(true) // Grameenphone
      expect(validateBdMobile('01311223344')).toBe(true) // Skitto / GP
      expect(validateBdMobile('01811223344')).toBe(true) // Robi
      expect(validateBdMobile('01611223344')).toBe(true) // Airtel
      expect(validateBdMobile('01911223344')).toBe(true) // Banglalink
      expect(validateBdMobile('01411223344')).toBe(true) // Banglalink
      expect(validateBdMobile('01511223344')).toBe(true) // Teletalk
    })

    it('rejects invalid mobile numbers', () => {
      expect(validateBdMobile('01211223344')).toBe(false) // 012 invalid prefix
      expect(validateBdMobile('017112233')).toBe(false) // too short
      expect(validateBdMobile('0171122334455')).toBe(false) // too long
      expect(validateBdMobile('abcd1234567')).toBe(false) // non-digits
      expect(validateBdMobile('')).toBe(false)
    })
  })

  describe('formatTrxId', () => {
    it('trims and converts to uppercase', () => {
      expect(formatTrxId('  9j82k39l2a  ')).toBe('9J82K39L2A')
      expect(formatTrxId('ngd8920192')).toBe('NGD8920192')
    })
  })

  describe('validateTrxId', () => {
    it('rejects empty references across methods', () => {
      expect(validateTrxId('bkash', '').valid).toBe(false)
      expect(validateTrxId('nagad', '   ').valid).toBe(false)
      expect(validateTrxId('cash', '').valid).toBe(false)
    })

    it('validates bKash 10-character alphanumeric TrxID', () => {
      expect(validateTrxId('bkash', '9J82K39L2A')).toEqual({ valid: true })
      expect(validateTrxId('bkash', 'BK12345678')).toEqual({ valid: true })
      expect(validateTrxId('bkash', '9J82K39L2')).toEqual({
        valid: false,
        errorKey: 'fees.validation.trxIdInvalidBkash',
      })
      expect(validateTrxId('bkash', '9J82K39L2A11')).toEqual({
        valid: false,
        errorKey: 'fees.validation.trxIdInvalidBkash',
      })
      expect(validateTrxId('bkash', '9J82-39L2A')).toEqual({
        valid: false,
        errorKey: 'fees.validation.trxIdInvalidBkash',
      })
    })

    it('validates Nagad 8-12 character alphanumeric TrxID', () => {
      expect(validateTrxId('nagad', 'NGD12345')).toEqual({ valid: true })
      expect(validateTrxId('nagad', '7A8B9C0D1E2F')).toEqual({ valid: true })
      expect(validateTrxId('nagad', 'NG123')).toEqual({
        valid: false,
        errorKey: 'fees.validation.trxIdInvalidNagad',
      })
      expect(validateTrxId('nagad', 'TOOLONGREFERENCE1234')).toEqual({
        valid: false,
        errorKey: 'fees.validation.trxIdInvalidNagad',
      })
    })

    it('validates Rocket and Upay reference ranges', () => {
      expect(validateTrxId('rocket', 'ROK1234567')).toEqual({ valid: true })
      expect(validateTrxId('upay', 'UPAY829102')).toEqual({ valid: true })
      expect(validateTrxId('rocket', '123')).toEqual({
        valid: false,
        errorKey: 'fees.validation.trxIdInvalid',
      })
    })

    it('validates Bank and Card payment references', () => {
      expect(validateTrxId('bank', 'CHQ-2026-9901')).toEqual({ valid: true })
      expect(validateTrxId('card', 'AUTH9821')).toEqual({ valid: true })
      expect(validateTrxId('bank', 'AB')).toEqual({
        valid: false,
        errorKey: 'fees.validation.trxIdInvalid',
      })
    })

    it('allows valid Cash receipts', () => {
      expect(validateTrxId('cash', 'CASH').valid).toBe(true)
      expect(validateTrxId('cash', 'REC-001').valid).toBe(true)
    })
  })
})
