import { describe, it, expect } from 'vitest'
import { isGsm7, calculateSmsParts, sendSms } from '../src/lib/sms-gateway'
import { smsTemplates } from '../src/lib/sms-templates'

describe('sms-gateway', () => {
  describe('isGsm7 detection', () => {
    it('identifies standard GSM-7 English text', () => {
      expect(isGsm7('Hello Guardian, student is present today.')).toBe(true)
      expect(isGsm7('Payment received: BDT 2,500. Thank you!')).toBe(true)
    })

    it('identifies Bangla text as Unicode', () => {
      expect(isGsm7('আপনার সন্তান আজ অনুপস্থিত')).toBe(false)
      expect(isGsm7('বাংলা')).toBe(false)
      expect(isGsm7('Fee Tk 500 গ্রহণ করা হয়েছে')).toBe(false)
    })
  })

  describe('calculateSmsParts', () => {
    it('calculates single and multi-part GSM-7 messages (160 / 153 chars)', () => {
      const single = calculateSmsParts('A'.repeat(160))
      expect(single.encoding).toBe('GSM-7')
      expect(single.partsCount).toBe(1)
      expect(single.remainingInPart).toBe(0)

      const multi = calculateSmsParts('A'.repeat(161))
      expect(multi.encoding).toBe('GSM-7')
      expect(multi.partsCount).toBe(2)
      expect(multi.remainingInPart).toBe(153 * 2 - 161)
    })

    it('calculates single and multi-part Unicode (Bangla) messages (70 / 67 chars)', () => {
      const singleBn = calculateSmsParts('ক'.repeat(70))
      expect(singleBn.encoding).toBe('Unicode')
      expect(singleBn.partsCount).toBe(1)
      expect(singleBn.remainingInPart).toBe(0)

      const multiBn = calculateSmsParts('ক'.repeat(71))
      expect(multiBn.encoding).toBe('Unicode')
      expect(multiBn.partsCount).toBe(2)
      expect(multiBn.remainingInPart).toBe(67 * 2 - 71)
    })
  })

  describe('sendSms', () => {
    it('validates mobile number and sends mock SMS', async () => {
      const result = await sendSms('01711223344', 'Test SMS alert from EduOS', { provider: 'mock' })
      expect(result.success).toBe(true)
      expect(result.parts).toBe(1)
      expect(result.messageId).toBeDefined()
    })

    it('rejects invalid mobile number format', async () => {
      const result = await sendSms('01211000000', 'Test message')
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid Bangladesh mobile number format')
    })
  })

  describe('smsTemplates', () => {
    it('formats absent alerts in English and Bangla', () => {
      const en = smsTemplates.absent(
        { student: 'Rahim', className: '7-A', date: '11 Sep', school: 'EduOS Academy' },
        'en',
      )
      expect(en).toContain('Dear Guardian, your child Rahim (7-A) was marked absent on 11 Sep')

      const bn = smsTemplates.absent(
        { student: 'রহিম', className: '৭-ক', date: '১১ সেপ্টেম্বর', school: 'এডুওএস একাডেমি' },
        'bn',
      )
      expect(bn).toContain('সম্মানিত অভিভাবক, আপনার সন্তান রহিম (৭-ক) আজ ১১ সেপ্টেম্বর তারিখে বিদ্যালয়ে অনুপস্থিত')
    })

    it('formats fee receipt alerts in English and Bangla', () => {
      const en = smsTemplates.feeReceipt(
        { student: 'Amina', amount: '2,500', receiptNo: 'REC-1234', school: 'EduOS Academy' },
        'en',
      )
      expect(en).toContain('Payment received: Tk 2,500 for Amina (Receipt: REC-1234)')

      const bn = smsTemplates.feeReceipt(
        { student: 'আমিনা', amount: '২,৫০০', receiptNo: 'REC-1234', school: 'এডুওএস একাডেমি' },
        'bn',
      )
      expect(bn).toContain('ফি পরিশোধ সফল: আমিনা-এর জন্য ৳২,৫০০ গ্রহণ করা হয়েছে')
    })
  })
})
