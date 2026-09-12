import { describe, it, expect } from 'vitest'
import {
  calculateLateFine,
  generateFeeReminderSmsText,
} from '@/lib/fees'
import { createFeeDefaultersPdf } from '@/lib/fee-defaulters-pdf'

describe('Fee Defaulters & Fine Calculation Engine', () => {
  describe('calculateLateFine', () => {
    it('returns not overdue when due date is today or in future', () => {
      const res = calculateLateFine('2026-05-25', 1500, {
        evaluationDate: '2026-05-25',
      })
      expect(res.isOverdue).toBe(false)
      expect(res.daysOverdue).toBe(0)
      expect(res.fineAmount).toBe(0)
      expect(res.totalPayable).toBe(1500)
    })

    it('identifies overdue invoices within grace period with zero fine', () => {
      // 5 days past due date, grace period is 7 days
      const res = calculateLateFine('2026-05-20', 1500, {
        evaluationDate: '2026-05-25',
        gracePeriodDays: 7,
      })
      expect(res.isOverdue).toBe(true)
      expect(res.inGracePeriod).toBe(true)
      expect(res.daysOverdue).toBe(5)
      expect(res.fineAmount).toBe(0)
      expect(res.totalPayable).toBe(1500)
    })

    it('calculates daily late fine beyond grace period correctly', () => {
      // Due 2026-05-10, evaluated 2026-05-25 = 15 days overdue
      // Grace period: 7 days -> 8 days past grace * 5 BDT = 40 BDT fine
      const res = calculateLateFine('2026-05-10', 1500, {
        evaluationDate: '2026-05-25',
        gracePeriodDays: 7,
        finePerDay: 5,
      })
      expect(res.isOverdue).toBe(true)
      expect(res.inGracePeriod).toBe(false)
      expect(res.daysOverdue).toBe(15)
      expect(res.fineAmount).toBe(40)
      expect(res.totalPayable).toBe(1540)
    })

    it('calculates fixed tiered fines when configured', () => {
      // 20 days overdue, 7 days grace = 13 days past grace (<= 15 tier) -> 50 BDT
      const resTier1 = calculateLateFine('2026-05-05', 1000, {
        evaluationDate: '2026-05-25',
        gracePeriodDays: 7,
        fineModel: 'fixed_tiered',
      })
      expect(resTier1.fineAmount).toBe(50)

      // 30 days overdue, 7 days grace = 23 days past grace (16-30 tier) -> 100 BDT
      const resTier2 = calculateLateFine('2026-04-25', 1000, {
        evaluationDate: '2026-05-25',
        gracePeriodDays: 7,
        fineModel: 'fixed_tiered',
      })
      expect(resTier2.fineAmount).toBe(100)
    })

    it('caps late fine at max configured percentage of principal', () => {
      // 200 days overdue at 10 BDT/day = 1930 BDT, but principal is 500 BDT
      // Max cap: 50% of 500 = 250 BDT
      const res = calculateLateFine('2025-11-06', 500, {
        evaluationDate: '2026-05-25',
        finePerDay: 10,
        maxFineCapPercent: 50,
      })
      expect(res.fineAmount).toBe(250)
      expect(res.totalPayable).toBe(750)
    })
  })

  describe('generateFeeReminderSmsText', () => {
    const student = {
      studentName: 'Tanvir Ahmed',
      roll: '7A-01',
      className: 'Class 7',
      principal: 1500,
      fine: 75,
      total: 1575,
      daysOverdue: 22,
      schoolName: 'Riverside Public School',
      contactPhone: '01711000000',
    }

    it('generates English reminder SMS conforming to BTRC standards', () => {
      const sms = generateFeeReminderSmsText(student, 'en')
      expect(sms).toContain('Dear Guardian')
      expect(sms).toContain('Tanvir Ahmed')
      expect(sms).toContain('7A-01')
      expect(sms).toContain('BDT 1575')
      expect(sms).toContain('Late fine: BDT 75')
      expect(sms).toContain('22 days')
      expect(sms).toContain('Riverside Public School')
      expect(sms).toContain('01711000000')
    })

    it('generates Bengali reminder SMS with authentic terminology', () => {
      const sms = generateFeeReminderSmsText(student, 'bn')
      expect(sms).toContain('সম্মানিত অভিভাবক')
      expect(sms).toContain('Tanvir Ahmed')
      expect(sms).toContain('7A-01')
      expect(sms).toContain('৳1575')
      expect(sms).toContain('জরিমানা: ৳75')
      expect(sms).toContain('22 দিন')
      expect(sms).toContain('Riverside Public School')
      expect(sms).toContain('01711000000')
    })
  })

  describe('createFeeDefaultersPdf', () => {
    it('generates a valid A4 Portrait Fee Defaulters Notice PDF binary', () => {
      const pdfBytes = createFeeDefaultersPdf({
        schoolName: 'Riverside Public School',
        eiin: '108234',
        academicYear: '2026',
        date: '2026-05-25',
        defaulters: [
          {
            rollNo: '7A-01',
            studentName: 'Tanvir Ahmed',
            className: 'Class 7',
            dueDate: '2026-05-10',
            daysOverdue: 15,
            principal: 1500,
            fine: 40,
            total: 1540,
            parentPhone: '01711000001',
          },
          {
            rollNo: '7A-02',
            studentName: 'Nusrat Jahan',
            className: 'Class 7',
            dueDate: '2026-05-10',
            daysOverdue: 15,
            principal: 1200,
            fine: 40,
            total: 1240,
            parentPhone: '01811000002',
          },
        ],
      })

      expect(pdfBytes.byteLength).toBeGreaterThan(500)

      const str = new TextDecoder().decode(pdfBytes)
      expect(str.startsWith('%PDF-1.4')).toBe(true)
      expect(str).toContain('/MediaBox [0 0 595 842]')
      expect(str).toContain('FEE DEFAULTERS NOTICE')
      expect(str).toContain('Tanvir Ahmed')
    })
  })
})
