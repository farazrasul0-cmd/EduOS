export type LeaveCategory = 'teacher' | 'student'

export type TeacherLeaveType = 'casual' | 'medical' | 'maternity' | 'earned' | 'duty'
export type StudentLeaveType = 'sick' | 'urgent' | 'religious' | 'bereavement'
export type LeaveType = TeacherLeaveType | StudentLeaveType

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface TeacherLeaveQuota {
  staffId: string
  staffName: string
  staffNameBn?: string
  designation: string
  department: string
  casualTotal: number // e.g., 20
  casualUsed: number
  medicalTotal: number // e.g., 30
  medicalUsed: number
  earnedTotal: number // e.g., 15
  earnedUsed: number
}

export interface LeaveApplication {
  id: string
  applicationNo: string // e.g., "LV-2026-0001"
  category: LeaveCategory
  applicantId: string
  applicantName: string
  applicantNameBn?: string
  designationOrClass: string // e.g., "Senior Teacher (Mathematics)" or "Class 7 (A), Roll 04"
  leaveType: LeaveType
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  daysCount: number
  reason: string
  appliedDate: string
  status: LeaveStatus
  approverName?: string
  approvalRemarks?: string
  actionDate?: string
  substituteStaffName?: string // For teachers
  guardianContact?: string // For students
  attachmentName?: string // e.g. "Medical_Prescription.pdf"
}

export interface LeaveReviewPayload {
  applicationId: string
  status: 'approved' | 'rejected'
  approverName: string
  approvalRemarks?: string
}

/**
 * Calculates working days between two YYYY-MM-DD dates inclusive.
 * In Bangladesh educational institutions, Friday (day 5) is the primary weekly holiday.
 */
export function calculateWorkingDays(startDate: string, endDate: string, skipFridays = true): number {
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return 0
  }

  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    const dayOfWeek = cur.getDay() // 0 = Sunday, 5 = Friday, 6 = Saturday
    if (!skipFridays || dayOfWeek !== 5) {
      count++
    }
    cur.setDate(cur.getDate() + 1)
  }

  return count
}

/**
 * Validates a leave application request against dates, quotas, and rules.
 */
export function validateLeaveApplication(
  app: Partial<LeaveApplication>,
  quota?: TeacherLeaveQuota,
): { valid: boolean; error?: string } {
  if (!app.applicantName || !app.applicantName.trim()) {
    return { valid: false, error: 'Applicant name is required.' }
  }
  if (!app.startDate || !app.endDate) {
    return { valid: false, error: 'Start date and end date are required.' }
  }
  if (app.startDate > app.endDate) {
    return { valid: false, error: 'Start date cannot be after end date.' }
  }

  const days = calculateWorkingDays(app.startDate, app.endDate)
  if (days <= 0) {
    return { valid: false, error: 'Leave duration must be at least 1 working day.' }
  }

  if (!app.reason || app.reason.trim().length < 5) {
    return { valid: false, error: 'Reason for leave must be at least 5 characters.' }
  }

  if (app.category === 'teacher' && quota) {
    if (app.leaveType === 'casual') {
      const remainingCasual = quota.casualTotal - quota.casualUsed
      if (days > remainingCasual) {
        return {
          valid: false,
          error: `Requested casual leave (${days} days) exceeds remaining quota (${remainingCasual} days).`,
        }
      }
    } else if (app.leaveType === 'medical') {
      const remainingMedical = quota.medicalTotal - quota.medicalUsed
      if (days > remainingMedical) {
        return {
          valid: false,
          error: `Requested medical leave (${days} days) exceeds remaining quota (${remainingMedical} days).`,
        }
      }
    } else if (app.leaveType === 'earned') {
      const remainingEarned = quota.earnedTotal - quota.earnedUsed
      if (days > remainingEarned) {
        return {
          valid: false,
          error: `Requested earned leave (${days} days) exceeds remaining quota (${remainingEarned} days).`,
        }
      }
    }
  }

  return { valid: true }
}

/**
 * Computes remaining balances for a teacher's quota.
 */
export function computeTeacherRemainingQuota(quota: TeacherLeaveQuota) {
  return {
    casualRemaining: Math.max(0, quota.casualTotal - quota.casualUsed),
    medicalRemaining: Math.max(0, quota.medicalTotal - quota.medicalUsed),
    earnedRemaining: Math.max(0, quota.earnedTotal - quota.earnedUsed),
    totalQuota: quota.casualTotal + quota.medicalTotal + quota.earnedTotal,
    totalUsed: quota.casualUsed + quota.medicalUsed + quota.earnedUsed,
  }
}

/**
 * Maps an approved student leave application to a list of attendance date entries.
 * Sets status to 'leave' (L - Excused), preserving collegiate attendance standing.
 */
export function mapApprovedLeaveToAttendance(
  app: LeaveApplication,
): Array<{ student_id: string; date: string; status: 'leave' }> {
  if (app.status !== 'approved' || app.category !== 'student') {
    return []
  }

  const records: Array<{ student_id: string; date: string; status: 'leave' }> = []
  const start = new Date(app.startDate)
  const end = new Date(app.endDate)

  const cur = new Date(start)
  while (cur <= end) {
    if (cur.getDay() !== 5) {
      // Exclude Friday weekend
      records.push({
        student_id: app.applicantId,
        date: cur.toISOString().slice(0, 10),
        status: 'leave',
      })
    }
    cur.setDate(cur.getDate() + 1)
  }

  return records
}

/**
 * Generates an institutional leave application reference token.
 */
export function generateLeaveApplicationNo(sequenceNumber: number, year = 2026): string {
  return `LV-${year}-${String(sequenceNumber).padStart(4, '0')}`
}
