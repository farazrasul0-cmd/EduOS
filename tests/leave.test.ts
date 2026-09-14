import { describe, it, expect } from 'vitest'
import {
  calculateWorkingDays,
  validateLeaveApplication,
  computeTeacherRemainingQuota,
  mapApprovedLeaveToAttendance,
  generateLeaveApplicationNo,
  type TeacherLeaveQuota,
  type LeaveApplication,
} from '@/lib/leave'
import {
  createLeaveApplicationPdf,
  createLeaveSanctionOrderPdf,
} from '@/lib/leave-pdf'

const mockSchool = {
  schoolName: 'Dhaka Model School & College',
  eiin: '108234',
  address: 'Dhanmondi, Dhaka, Bangladesh',
}

const mockTeacherQuota: TeacherLeaveQuota = {
  staffId: 'STF-101',
  staffName: 'Md. Rafiqul Islam',
  designation: 'Senior Teacher (Mathematics)',
  department: 'Science',
  casualTotal: 20,
  casualUsed: 18, // 2 remaining
  medicalTotal: 30,
  medicalUsed: 5, // 25 remaining
  earnedTotal: 15,
  earnedUsed: 0,
}

const mockStudentApplication: LeaveApplication = {
  id: 'LV-2026-0001',
  applicationNo: 'LV-2026-0001',
  category: 'student',
  applicantId: 'STU-1001',
  applicantName: 'Tanvir Ahmed',
  designationOrClass: 'Class 7 (A), Roll 01',
  leaveType: 'sick',
  startDate: '2026-06-01', // Monday
  endDate: '2026-06-03', // Wednesday
  daysCount: 3,
  reason: 'Viral fever and prescribed medical rest.',
  appliedDate: '2026-05-31',
  status: 'approved',
  approverName: 'Principal M. A. Karim',
  approvalRemarks: 'Approved with medical prescription verified.',
  actionDate: '2026-05-31',
  guardianContact: '01711987654',
}

describe('Leave Management Domain Engine', () => {
  it('calculates working days accurately while excluding Bangladesh Friday weekends', () => {
    // 2026-05-21 (Thursday) to 2026-05-24 (Sunday) spans 4 calendar days.
    // Friday (2026-05-22) is weekend, so working days = 3 (Thu, Sat, Sun).
    const workingDays = calculateWorkingDays('2026-05-21', '2026-05-24', true)
    expect(workingDays).toBe(3)

    // Invalid date range
    expect(calculateWorkingDays('2026-05-25', '2026-05-20')).toBe(0)
  })

  it('validates leave application correctly against dates and reasons', () => {
    // Missing reason
    const res1 = validateLeaveApplication({
      applicantName: 'Tanvir Ahmed',
      startDate: '2026-06-01',
      endDate: '2026-06-03',
      reason: '',
    })
    expect(res1.valid).toBe(false)

    // Valid student application
    const res2 = validateLeaveApplication({
      applicantName: 'Tanvir Ahmed',
      startDate: '2026-06-01',
      endDate: '2026-06-03',
      reason: 'Suffering from seasonal fever',
    })
    expect(res2.valid).toBe(true)
  })

  it('enforces teacher quota constraints for casual and medical leave', () => {
    // mockTeacherQuota has 2 casual leave remaining. Requesting 3 days should fail.
    const resOver = validateLeaveApplication(
      {
        category: 'teacher',
        applicantName: 'Md. Rafiqul Islam',
        leaveType: 'casual',
        startDate: '2026-06-01', // Mon
        endDate: '2026-06-03', // Wed (3 days)
        reason: 'Urgent family work at home district',
      },
      mockTeacherQuota,
    )
    expect(resOver.valid).toBe(false)
    expect(resOver.error).toContain('exceeds remaining quota')

    // Requesting 2 days should pass
    const resPass = validateLeaveApplication(
      {
        category: 'teacher',
        applicantName: 'Md. Rafiqul Islam',
        leaveType: 'casual',
        startDate: '2026-06-01',
        endDate: '2026-06-02',
        reason: 'Urgent family work at home district',
      },
      mockTeacherQuota,
    )
    expect(resPass.valid).toBe(true)
  })

  it('computes remaining teacher quotas accurately', () => {
    const rem = computeTeacherRemainingQuota(mockTeacherQuota)
    expect(rem.casualRemaining).toBe(2)
    expect(rem.medicalRemaining).toBe(25)
    expect(rem.earnedRemaining).toBe(15)
    expect(rem.totalQuota).toBe(65)
    expect(rem.totalUsed).toBe(23)
  })

  it('maps approved student leave into attendance records marked as leave status', () => {
    const attendanceRecords = mapApprovedLeaveToAttendance(mockStudentApplication)
    expect(attendanceRecords.length).toBe(3)
    expect(attendanceRecords[0]).toEqual({
      student_id: 'STU-1001',
      date: '2026-06-01',
      status: 'leave',
    })
    expect(attendanceRecords[2]).toEqual({
      student_id: 'STU-1001',
      date: '2026-06-03',
      status: 'leave',
    })
  })

  it('generates sequential leave application reference numbers', () => {
    expect(generateLeaveApplicationNo(5, 2026)).toBe('LV-2026-0005')
  })
})

describe('Vector PDF Generation for Leave Documents', () => {
  it('generates an official vector A4 Portrait Leave Application Letter PDF', () => {
    const pdfBytes = createLeaveApplicationPdf(mockStudentApplication, mockSchool)
    expect(pdfBytes.length).toBeGreaterThan(600)

    const pdfText = new TextDecoder().decode(pdfBytes)
    expect(pdfText).toContain('%PDF-1.4')
    expect(pdfText).toContain('[0 0 595 842]')
    expect(pdfText).toContain('DHAKA MODEL SCHOOL & COLLEGE')
    expect(pdfText).toContain('OFFICIAL APPLICATION FOR LEAVE')
    expect(pdfText).toContain('Tanvir Ahmed')
    expect(pdfText).toContain('LV-2026-0001')
    expect(pdfText).toContain('%%EOF')
  })

  it('generates an official vector A4 Portrait Leave Sanction Order PDF', () => {
    const pdfBytes = createLeaveSanctionOrderPdf(mockStudentApplication, mockSchool)
    expect(pdfBytes.length).toBeGreaterThan(600)

    const pdfText = new TextDecoder().decode(pdfBytes)
    expect(pdfText).toContain('%PDF-1.4')
    expect(pdfText).toContain('[0 0 595 842]')
    expect(pdfText).toContain('DHAKA MODEL SCHOOL & COLLEGE')
    expect(pdfText).toContain('OFFICIAL LEAVE SANCTION ORDER')
    expect(pdfText).toContain('Tanvir Ahmed')
    expect(pdfText).toContain('SO-LV-2026-0001')
    expect(pdfText).toContain('%%EOF')
  })
})
