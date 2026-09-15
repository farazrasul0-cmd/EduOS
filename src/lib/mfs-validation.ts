import type { PaymentMethod } from '@/types/models'

/**
 * Normalizes a Bangladeshi mobile number to standard 11-digit local format: 01XXXXXXXXX.
 * Strips whitespace, hyphens, and leading +88 / 88 country code.
 */
export function normalizeBdMobile(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, '')
  if (cleaned.startsWith('+8801')) return cleaned.slice(3)
  if (cleaned.startsWith('8801')) return cleaned.slice(2)
  return cleaned
}

/**
 * Validates whether a given string is a valid Bangladeshi mobile number.
 * Supported operator prefixes: 013, 014, 015, 016, 017, 018, 019.
 */
export function validateBdMobile(phone: string): boolean {
  const normalized = normalizeBdMobile(phone)
  return /^01[3-9]\d{8}$/.test(normalized)
}

/**
 * Normalizes a Transaction Reference (TrxID) by trimming and uppercasing.
 */
export function formatTrxId(reference: string): string {
  return reference.trim().toUpperCase()
}

export interface TrxIdValidationResult {
  valid: boolean
  errorKey?: string
}

/**
 * Validates payment transaction reference / TrxID based on payment method.
 * bKash: 10-character alphanumeric uppercase code (e.g. 9J82K39L2A).
 * Nagad: 8-12 character alphanumeric code.
 * Rocket/Upay: 8-16 character alphanumeric code.
 * Bank/Card: minimum 4 characters (cheque/slip or auth code).
 * Cash: non-empty or standard voucher string.
 */
export function validateTrxId(method: PaymentMethod, reference: string): TrxIdValidationResult {
  const formatted = formatTrxId(reference)

  if (!formatted) {
    return { valid: false, errorKey: 'fees.validation.trxIdRequired' }
  }

  switch (method) {
    case 'bkash': {
      const isBkash = /^[A-Z0-9]{10}$/.test(formatted)
      return isBkash
        ? { valid: true }
        : { valid: false, errorKey: 'fees.validation.trxIdInvalidBkash' }
    }
    case 'nagad': {
      const isNagad = /^[A-Z0-9]{8,12}$/.test(formatted)
      return isNagad
        ? { valid: true }
        : { valid: false, errorKey: 'fees.validation.trxIdInvalidNagad' }
    }
    case 'rocket':
    case 'upay': {
      const isMfs = /^[A-Z0-9]{8,16}$/.test(formatted)
      return isMfs
        ? { valid: true }
        : { valid: false, errorKey: 'fees.validation.trxIdInvalid' }
    }
    case 'bank':
    case 'card': {
      const isValid = formatted.length >= 4 && formatted.length <= 40
      return isValid
        ? { valid: true }
        : { valid: false, errorKey: 'fees.validation.trxIdInvalid' }
    }
    case 'cash':
    default:
      return { valid: true }
  }
}
