import { describe, it, expect } from 'vitest'
import {
  getAttendanceCollegiateStatus,
  generateAbsentSmsText,
  createMonthlyAttendancePdf,
} from '@/lib/attendance'

describe('Attendance Automation & Collegiate Engine', () => {
  describe('getAttendanceCollegiateStatus', () => {
    it('classifies collegiate status according to Bangladesh education board thresholds', () => {
      // >= 75%: Collegiate (Regular)
      expect(getAttendanceCollegiateStatus(95)).toBe('collegiate')
      expect(getAttendanceCollegiateStatus(75.0)).toBe('collegiate')

      // 60% - 74.9%: Non-Collegiate (Penalty fine required)
      expect(getAttendanceCollegiateStatus(74.9)).toBe('non_collegiate')
      expect(getAttendanceCollegiateStatus(60.0)).toBe('non_collegiate')

      // < 60%: Dis-Collegiate (Barred from board exams)
      expect(getAttendanceCollegiateStatus(59.9)).toBe('dis_collegiate')
      expect(getAttendanceCollegiateStatus(40)).toBe('dis_collegiate')
      expect(getAttendanceCollegiateStatus(0)).toBe('dis_collegiate')
    })
  })

  describe('generateAbsentSmsText', () => {
    it('generates standard English absence alert with student details', () => {
      const sms = generateAbsentSmsText(
        { name: 'Tanvir Ahmed', roll: '01', className: '7-A' },
        'Riverside Public School',
        '2026-05-25',
        'en',
        '01711000000',
      )

      expect(sms).toContain('Dear Guardian')
      expect(sms).toContain('Tanvir Ahmed')
      expect(sms).toContain('Roll: 01, Class: 7-A')
      expect(sms).toContain('marked ABSENT today 2026-05-25')
      expect(sms).toContain('Riverside Public School')
      expect(sms).toContain('Contact: 01711000000')
    })

    it('generates standard Bengali absence alert with Bengali phrasing', () => {
      const sms = generateAbsentSmsText(
        { name: 'তানভীর আহমেদ', roll: '০১', className: '৭-এ' },
        'রিভারসাইড পাবলিক স্কুল',
        '২৫-০৫-২০২৬',
        'bn',
        '০১৭১১০০০০০০',
      )

      expect(sms).toContain('সম্মানিত অভিভাবক')
      expect(sms).toContain('তানভীর আহমেদ')
      expect(sms).toContain('রোল: ০১, শ্রেণী: ৭-এ')
      expect(sms).toContain('অনুপস্থিত')
      expect(sms).toContain('রিভারসাইড পাবলিক স্কুল')
      expect(sms).toContain('যোগাযোগ: ০১৭১১০০০০০০')
    })
  })

  describe('createMonthlyAttendancePdf', () => {
    it('generates an official A4 Landscape Monthly Attendance Register PDF', () => {
      const pdfBytes = createMonthlyAttendancePdf({
        schoolName: 'Ideal School and College',
        schoolAddress: 'Motijheel, Dhaka',
        eiin: '108275',
        className: 'Class 7',
        sectionName: 'A',
        monthName: 'May',
        year: 2026,
        totalWorkingDays: 24,
        daysInMonth: 31,
        rows: [
          {
            studentName: 'Tanvir Ahmed',
            rollNo: '01',
            dailyStatus: { 1: 'P', 2: 'P', 3: 'P', 4: 'A', 5: 'P' },
            presentCount: 22,
            absentCount: 2,
            attendanceRate: 91.7,
            collegiateStatus: 'collegiate',
          },
          {
            studentName: 'Kamal Hossain',
            rollNo: '02',
            dailyStatus: { 1: 'A', 2: 'A', 3: 'P', 4: 'A', 5: 'A' },
            presentCount: 14,
            absentCount: 10,
            attendanceRate: 58.3,
            collegiateStatus: 'dis_collegiate',
          },
        ],
      })

      const text = new TextDecoder().decode(pdfBytes)
      expect(text.startsWith('%PDF-1.4')).toBe(true)
      expect(text).toContain('Ideal School and College')
      expect(text).toContain('EIIN: 108275')
      expect(text).toContain('MONTHLY ATTENDANCE REGISTER')
      expect(text).toContain('/MediaBox [0 0 842 595]') // Landscape dimensions
      expect(text).toContain('Tanvir Ahmed')
      expect(text).toContain('Kamal Hossain')
      expect(text).toContain('Collegiate')
      expect(text).toContain('Dis-Coll')
      expect(text.endsWith('%%EOF')).toBe(true)
    })
  })
})
