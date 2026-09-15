import { normalizeBdMobile, validateBdMobile } from '@/lib/mfs-validation'

/** Standard GSM 03.38 7-bit default alphabet characters */
const GSM7_BASIC =
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\x1bÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà'
const GSM7_EXTENDED = '|^€{}[]~\\'

export interface SmsCalculation {
  encoding: 'GSM-7' | 'Unicode'
  charCount: number
  partsCount: number
  remainingInPart: number
  maxSinglePart: number
  maxMultiPart: number
}

/**
 * Checks whether text contains only GSM-7 characters.
 * Any Bengali character automatically triggers Unicode (UCS-2) encoding.
 */
export function isGsm7(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (!GSM7_BASIC.includes(ch) && !GSM7_EXTENDED.includes(ch)) {
      return false
    }
  }
  return true
}

/**
 * Calculates character count and SMS segment count according to Bangladesh telecom standards.
 * GSM-7: 160 chars for 1 part; 153 chars per part for multi-part.
 * Unicode (Bangla): 70 chars for 1 part; 67 chars per part for multi-part.
 */
export function calculateSmsParts(text: string): SmsCalculation {
  const gsm = isGsm7(text)
  const charCount = text.length
  const maxSingle = gsm ? 160 : 70
  const maxMulti = gsm ? 153 : 67

  if (charCount === 0) {
    return {
      encoding: gsm ? 'GSM-7' : 'Unicode',
      charCount: 0,
      partsCount: 1,
      remainingInPart: maxSingle,
      maxSinglePart: maxSingle,
      maxMultiPart: maxMulti,
    }
  }

  if (charCount <= maxSingle) {
    return {
      encoding: gsm ? 'GSM-7' : 'Unicode',
      charCount,
      partsCount: 1,
      remainingInPart: maxSingle - charCount,
      maxSinglePart: maxSingle,
      maxMultiPart: maxMulti,
    }
  }

  const partsCount = Math.ceil(charCount / maxMulti)
  const remainingInPart = partsCount * maxMulti - charCount

  return {
    encoding: gsm ? 'GSM-7' : 'Unicode',
    charCount,
    partsCount,
    remainingInPart,
    maxSinglePart: maxSingle,
    maxMultiPart: maxMulti,
  }
}

export interface SmsSendOptions {
  senderId?: string
  apiKey?: string
  provider?: 'bulksmsbd' | 'greenweb' | 'mock'
}

export interface SmsSendResult {
  success: boolean
  messageId?: string
  parts: number
  error?: string
}

/**
 * Transmits an SMS via Bangladesh SMS Gateway (BulkSMSBD / Greenweb)
 * or mock sandbox simulator.
 */
export async function sendSms(
  to: string,
  message: string,
  options: SmsSendOptions = {},
): Promise<SmsSendResult> {
  const cleanPhone = normalizeBdMobile(to)
  if (!validateBdMobile(cleanPhone)) {
    return {
      success: false,
      parts: 0,
      error: 'Invalid Bangladesh mobile number format (expected 01XXXXXXXXX)',
    }
  }

  const calculation = calculateSmsParts(message)
  const apiKey =
    options.apiKey ?? (import.meta.env.VITE_BULKSMSBD_API_KEY as string | undefined)

  // If real API key is configured and not in automated test environment:
  if (apiKey && options.provider !== 'mock' && typeof window !== 'undefined') {
    try {
      const senderId =
        options.senderId ?? (import.meta.env.VITE_BULKSMSBD_SENDER_ID || 'EduOS')
      const params = new URLSearchParams({
        api_key: apiKey,
        type: calculation.encoding === 'Unicode' ? 'unicode' : 'text',
        number: `88${cleanPhone}`,
        senderid: senderId,
        message,
      })

      const res = await fetch(`https://bulksmsbd.net/api/smsapi?${params.toString()}`)
      const json = (await res.json()) as { response_code?: number; success_message?: string; error_message?: string }

      if (json.response_code === 1000 || json.success_message) {
        return {
          success: true,
          messageId: `BD-${Date.now()}`,
          parts: calculation.partsCount,
        }
      }
      return {
        success: false,
        parts: calculation.partsCount,
        error: json.error_message || 'SMS gateway provider error',
      }
    } catch (err) {
      return {
        success: false,
        parts: calculation.partsCount,
        error: err instanceof Error ? err.message : 'Network error communicating with SMS gateway',
      }
    }
  }

  // Simulated gateway execution (for sandbox / tests)
  await new Promise((resolve) => setTimeout(resolve, 200))
  return {
    success: true,
    messageId: `MOCK-${Date.now().toString(36).toUpperCase()}`,
    parts: calculation.partsCount,
  }
}
