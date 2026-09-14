import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  LeaveApplication,
  TeacherLeaveQuota,
  LeaveReviewPayload,
  LeaveCategory,
  LeaveStatus,
} from '@/lib/leave'
import { generateLeaveApplicationNo, calculateWorkingDays } from '@/lib/leave'

const INITIAL_TEACHER_QUOTAS: TeacherLeaveQuota[] = [
  {
    staffId: 'STF-101',
    staffName: 'Md. Rafiqul Islam',
    staffNameBn: 'মো. রফিকুল ইসলাম',
    designation: 'Senior Teacher (Mathematics)',
    department: 'Science',
    casualTotal: 20,
    casualUsed: 4,
    medicalTotal: 30,
    medicalUsed: 2,
    earnedTotal: 15,
    earnedUsed: 0,
  },
  {
    staffId: 'STF-102',
    staffName: 'Nasrin Sultana',
    staffNameBn: 'নাসরিন সুলতানা',
    designation: 'Assistant Teacher (English)',
    department: 'Humanities',
    casualTotal: 20,
    casualUsed: 7,
    medicalTotal: 30,
    medicalUsed: 5,
    earnedTotal: 15,
    earnedUsed: 3,
  },
  {
    staffId: 'STF-103',
    staffName: 'Anisur Rahman',
    staffNameBn: 'আনিসুর রহমান',
    designation: 'Lecturer (Physics)',
    department: 'Science',
    casualTotal: 20,
    casualUsed: 2,
    medicalTotal: 30,
    medicalUsed: 0,
    earnedTotal: 15,
    earnedUsed: 0,
  },
  {
    staffId: 'STF-104',
    staffName: 'Farhana Akter',
    staffNameBn: 'ফারহানা আক্তার',
    designation: 'Assistant Teacher (Bangla)',
    department: 'Language',
    casualTotal: 20,
    casualUsed: 12,
    medicalTotal: 30,
    medicalUsed: 8,
    earnedTotal: 15,
    earnedUsed: 4,
  },
]

const INITIAL_LEAVE_APPLICATIONS: LeaveApplication[] = [
  {
    id: 'LV-2026-0001',
    applicationNo: 'LV-2026-0001',
    category: 'student',
    applicantId: 'STU-1001',
    applicantName: 'Tanvir Ahmed',
    applicantNameBn: 'তানভীর আহমেদ',
    designationOrClass: 'Class 7 (A), Roll 01',
    leaveType: 'sick',
    startDate: '2026-05-26',
    endDate: '2026-05-28',
    daysCount: 3,
    reason: 'Viral fever and respiratory infection as diagnosed by doctor.',
    appliedDate: '2026-05-25',
    status: 'approved',
    approverName: 'Principal M. A. Karim',
    approvalRemarks: 'Approved with medical prescription verified.',
    actionDate: '2026-05-25',
    guardianContact: '01711987654',
    attachmentName: 'Doctor_Prescription_Tanvir.pdf',
  },
  {
    id: 'LV-2026-0002',
    applicationNo: 'LV-2026-0002',
    category: 'teacher',
    applicantId: 'STF-101',
    applicantName: 'Md. Rafiqul Islam',
    applicantNameBn: 'মো. রফিকুল ইসলাম',
    designationOrClass: 'Senior Teacher (Mathematics)',
    leaveType: 'casual',
    startDate: '2026-05-27',
    endDate: '2026-05-28',
    daysCount: 2,
    reason: 'Family urgent personal obligation in Rajshahi district.',
    appliedDate: '2026-05-24',
    status: 'approved',
    approverName: 'Principal M. A. Karim',
    approvalRemarks: 'Sanctioned. Classes assigned to Anisur Rahman.',
    actionDate: '2026-05-24',
    substituteStaffName: 'Anisur Rahman',
  },
  {
    id: 'LV-2026-0003',
    applicationNo: 'LV-2026-0003',
    category: 'student',
    applicantId: 'STU-1002',
    applicantName: 'Nusrat Jahan',
    applicantNameBn: 'নুসরাত জাহান',
    designationOrClass: 'Class 7 (A), Roll 02',
    leaveType: 'urgent',
    startDate: '2026-05-29',
    endDate: '2026-05-31',
    daysCount: 2,
    reason: "Elder sister's wedding ceremony in Sylhet.",
    appliedDate: '2026-05-25',
    status: 'pending',
    guardianContact: '01812345678',
  },
  {
    id: 'LV-2026-0004',
    applicationNo: 'LV-2026-0004',
    category: 'teacher',
    applicantId: 'STF-102',
    applicantName: 'Nasrin Sultana',
    applicantNameBn: 'নাসরিন সুলতানা',
    designationOrClass: 'Assistant Teacher (English)',
    leaveType: 'medical',
    startDate: '2026-06-01',
    endDate: '2026-06-04',
    daysCount: 4,
    reason: 'Scheduled eye surgery and post-op rest advised by specialist.',
    appliedDate: '2026-05-26',
    status: 'pending',
    substituteStaffName: 'Farhana Akter',
    attachmentName: 'Hospital_Admission_Slip.pdf',
  },
  {
    id: 'LV-2026-0005',
    applicationNo: 'LV-2026-0005',
    category: 'student',
    applicantId: 'STU-1003',
    applicantName: 'Kamal Hossain',
    applicantNameBn: 'কামাল হোসেন',
    designationOrClass: 'Class 7 (A), Roll 03',
    leaveType: 'sick',
    startDate: '2026-05-18',
    endDate: '2026-05-20',
    daysCount: 3,
    reason: 'Severe stomach flu and medical treatment.',
    appliedDate: '2026-05-17',
    status: 'approved',
    approverName: 'Class Teacher Aminul Islam',
    approvalRemarks: 'Sanctioned. Attendance excused.',
    actionDate: '2026-05-17',
    guardianContact: '01911223344',
  },
]

// In-memory persistent caches
let leaveApplicationsCache = [...INITIAL_LEAVE_APPLICATIONS]
let teacherQuotasCache = [...INITIAL_TEACHER_QUOTAS]

export function resetLeaveStore() {
  leaveApplicationsCache = [...INITIAL_LEAVE_APPLICATIONS]
  teacherQuotasCache = [...INITIAL_TEACHER_QUOTAS]
}

export function useLeaveApplications(filters?: {
  category?: LeaveCategory | 'all'
  status?: LeaveStatus | 'all'
}) {
  return useQuery({
    queryKey: ['leave-applications', filters?.category, filters?.status],
    queryFn: async (): Promise<LeaveApplication[]> => {
      let list = [...leaveApplicationsCache]
      if (filters?.category && filters.category !== 'all') {
        list = list.filter((item) => item.category === filters.category)
      }
      if (filters?.status && filters.status !== 'all') {
        list = list.filter((item) => item.status === filters.status)
      }
      return list.sort((a, b) => b.appliedDate.localeCompare(a.appliedDate))
    },
    initialData: () => {
      let list = [...leaveApplicationsCache]
      if (filters?.category && filters.category !== 'all') {
        list = list.filter((item) => item.category === filters.category)
      }
      if (filters?.status && filters.status !== 'all') {
        list = list.filter((item) => item.status === filters.status)
      }
      return list.sort((a, b) => b.appliedDate.localeCompare(a.appliedDate))
    },
  })
}

export function useTeacherLeaveQuotas() {
  return useQuery({
    queryKey: ['teacher-leave-quotas'],
    queryFn: async (): Promise<TeacherLeaveQuota[]> => {
      return [...teacherQuotasCache]
    },
    initialData: () => [...teacherQuotasCache],
  })
}

export interface ApplyLeavePayload {
  category: LeaveCategory
  applicantId: string
  applicantName: string
  applicantNameBn?: string
  designationOrClass: string
  leaveType: LeaveApplication['leaveType']
  startDate: string
  endDate: string
  reason: string
  substituteStaffName?: string
  guardianContact?: string
  attachmentName?: string
}

export function useApplyLeave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: ApplyLeavePayload): Promise<LeaveApplication> => {
      const daysCount = calculateWorkingDays(payload.startDate, payload.endDate)
      const nextSeq = leaveApplicationsCache.length + 1
      const appNo = generateLeaveApplicationNo(nextSeq)

      const newApp: LeaveApplication = {
        id: appNo,
        applicationNo: appNo,
        category: payload.category,
        applicantId: payload.applicantId,
        applicantName: payload.applicantName,
        applicantNameBn: payload.applicantNameBn,
        designationOrClass: payload.designationOrClass,
        leaveType: payload.leaveType,
        startDate: payload.startDate,
        endDate: payload.endDate,
        daysCount,
        reason: payload.reason,
        appliedDate: new Date().toISOString().slice(0, 10),
        status: 'pending',
        substituteStaffName: payload.substituteStaffName,
        guardianContact: payload.guardianContact,
        attachmentName: payload.attachmentName,
      }

      leaveApplicationsCache = [newApp, ...leaveApplicationsCache]
      return newApp
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['leave-applications'] })
    },
  })
}

export function useReviewLeave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: LeaveReviewPayload): Promise<LeaveApplication> => {
      const idx = leaveApplicationsCache.findIndex((a) => a.id === payload.applicationId)
      if (idx === -1) {
        throw new Error('Leave application not found.')
      }

      const existing = leaveApplicationsCache[idx]
      const updated: LeaveApplication = {
        ...existing,
        status: payload.status,
        approverName: payload.approverName,
        approvalRemarks: payload.approvalRemarks,
        actionDate: new Date().toISOString().slice(0, 10),
      }

      leaveApplicationsCache[idx] = updated

      // Deduct teacher quota if approved
      if (payload.status === 'approved' && updated.category === 'teacher') {
        const qIdx = teacherQuotasCache.findIndex((q) => q.staffId === updated.applicantId)
        if (qIdx !== -1) {
          const q = teacherQuotasCache[qIdx]
          if (updated.leaveType === 'casual') {
            teacherQuotasCache[qIdx] = { ...q, casualUsed: q.casualUsed + updated.daysCount }
          } else if (updated.leaveType === 'medical') {
            teacherQuotasCache[qIdx] = { ...q, medicalUsed: q.medicalUsed + updated.daysCount }
          } else if (updated.leaveType === 'earned') {
            teacherQuotasCache[qIdx] = { ...q, earnedUsed: q.earnedUsed + updated.daysCount }
          }
        }
      }

      return updated
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['leave-applications'] })
      void qc.invalidateQueries({ queryKey: ['teacher-leave-quotas'] })
      void qc.invalidateQueries({ queryKey: ['attendance'] })
      void qc.invalidateQueries({ queryKey: ['attendance-overview'] })
    },
  })
}

export function useCancelLeave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (applicationId: string): Promise<void> => {
      const idx = leaveApplicationsCache.findIndex((a) => a.id === applicationId)
      if (idx !== -1) {
        leaveApplicationsCache[idx] = {
          ...leaveApplicationsCache[idx],
          status: 'cancelled',
          actionDate: new Date().toISOString().slice(0, 10),
        }
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['leave-applications'] })
    },
  })
}
