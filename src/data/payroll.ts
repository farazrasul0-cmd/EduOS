import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  StaffSalaryProfile,
  StaffPayslip,
  SalaryStructure,
  SalaryPayStatus,
  PaymentChannel,
  BankAccountDetails,
} from '@/lib/payroll'
import { generatePayslip } from '@/lib/payroll'

const INITIAL_PROFILES: StaffSalaryProfile[] = [
  {
    staffId: 'EMP-1001',
    employeeName: 'Dr. Muhammad Rafiqul Islam',
    employeeNameBn: 'ড. মুহাম্মদ রফিকুল ইসলাম',
    designation: 'Principal / Headmaster',
    designationBn: 'অধ্যক্ষ / প্রধান শিক্ষক',
    department: 'Administration',
    departmentBn: 'প্রশাসন',
    staffType: 'teaching',
    employmentType: 'mpo',
    mpoIndexNo: 'MPO-839201',
    joiningDate: '2015-01-01',
    earnings: {
      basicPay: 50000,
      houseRent: 1000,
      medicalAllowance: 500,
      conveyanceAllowance: 3000,
      festivalBonus: 0,
      specialAllowance: 2000,
    },
    fixedDeductions: {
      incomeTax: 1500,
      advanceSalaryDeduction: 0,
    },
    preferredPaymentChannel: 'bank_transfer',
    bankDetails: {
      bankName: 'Sonali Bank PLC',
      branchName: 'Dhanmondi Branch',
      accountNo: '020349821039',
      routingNo: '200261948',
    },
    mfsNumber: null,
  },
  {
    staffId: 'EMP-1002',
    employeeName: 'Begum Rokeya Akhtar',
    employeeNameBn: 'বেগম রোকেয়া আক্তার',
    designation: 'Senior Teacher (Bengali)',
    designationBn: 'সিনিয়র সহকারী শিক্ষক (বাংলা)',
    department: 'Bengali & Humanities',
    departmentBn: 'বাংলা ও মানবিক',
    staffType: 'teaching',
    employmentType: 'mpo',
    mpoIndexNo: 'MPO-849202',
    joiningDate: '2016-03-15',
    earnings: {
      basicPay: 35000,
      houseRent: 1000,
      medicalAllowance: 500,
      conveyanceAllowance: 1500,
      festivalBonus: 0,
      specialAllowance: 0,
    },
    fixedDeductions: {
      incomeTax: 800,
      advanceSalaryDeduction: 0,
    },
    preferredPaymentChannel: 'bank_transfer',
    bankDetails: {
      bankName: 'Sonali Bank PLC',
      branchName: 'Dhanmondi Branch',
      accountNo: '020349821044',
      routingNo: '200261948',
    },
    mfsNumber: null,
  },
  {
    staffId: 'EMP-1003',
    employeeName: 'Shamsur Rahman',
    employeeNameBn: 'শামসুর রহমান',
    designation: 'Assistant Teacher (Mathematics)',
    designationBn: 'সহকারী শিক্ষক (গণিত)',
    department: 'Science & Math',
    departmentBn: 'বিজ্ঞান ও গণিত',
    staffType: 'teaching',
    employmentType: 'mpo',
    mpoIndexNo: 'MPO-859203',
    joiningDate: '2018-07-01',
    earnings: {
      basicPay: 28000,
      houseRent: 1000,
      medicalAllowance: 500,
      conveyanceAllowance: 1500,
      festivalBonus: 0,
      specialAllowance: 0,
    },
    fixedDeductions: {
      incomeTax: 500,
      advanceSalaryDeduction: 0,
    },
    preferredPaymentChannel: 'bank_transfer',
    bankDetails: {
      bankName: 'Dutch-Bangla Bank Ltd',
      branchName: 'Mirpur Branch',
      accountNo: '1151200482910',
      routingNo: '090271562',
    },
    mfsNumber: null,
  },
  {
    staffId: 'EMP-1004',
    employeeName: 'Tanvir Ahmed',
    employeeNameBn: 'তানভীর আহমেদ',
    designation: 'Assistant Teacher (English)',
    designationBn: 'সহকারী শিক্ষক (ইংরেজি)',
    department: 'Languages',
    departmentBn: 'ভাষা',
    staffType: 'teaching',
    employmentType: 'non_mpo',
    mpoIndexNo: null,
    joiningDate: '2021-02-01',
    earnings: {
      basicPay: 25000,
      houseRent: 5000,
      medicalAllowance: 1500,
      conveyanceAllowance: 2000,
      festivalBonus: 0,
      specialAllowance: 1000,
    },
    fixedDeductions: {
      incomeTax: 0,
      advanceSalaryDeduction: 1000,
    },
    preferredPaymentChannel: 'bkash',
    bankDetails: null,
    mfsNumber: '01711998877',
  },
  {
    staffId: 'EMP-1005',
    employeeName: 'Nusrat Jahan',
    employeeNameBn: 'নুসরাত জাহান',
    designation: 'Assistant Teacher (Science & ICT)',
    designationBn: 'সহকারী শিক্ষক (বিজ্ঞান ও আইসিটি)',
    department: 'Science & Math',
    departmentBn: 'বিজ্ঞান ও গণিত',
    staffType: 'teaching',
    employmentType: 'non_mpo',
    mpoIndexNo: null,
    joiningDate: '2022-01-10',
    earnings: {
      basicPay: 26000,
      houseRent: 5000,
      medicalAllowance: 1500,
      conveyanceAllowance: 2000,
      festivalBonus: 0,
      specialAllowance: 1000,
    },
    fixedDeductions: {
      incomeTax: 0,
      advanceSalaryDeduction: 0,
    },
    preferredPaymentChannel: 'nagad',
    bankDetails: null,
    mfsNumber: '01822334455',
  },
  {
    staffId: 'EMP-1006',
    employeeName: 'Maulana Abdul Hai',
    employeeNameBn: 'মাওলানা আব্দুল হাই',
    designation: 'Senior Teacher (Islamic Studies)',
    designationBn: 'সিনিয়র সহকারী শিক্ষক (ধর্ম ও নৈতিক শিক্ষা)',
    department: 'Humanities',
    departmentBn: 'মানবিক',
    staffType: 'teaching',
    employmentType: 'mpo',
    mpoIndexNo: 'MPO-869204',
    joiningDate: '2017-04-01',
    earnings: {
      basicPay: 32000,
      houseRent: 1000,
      medicalAllowance: 500,
      conveyanceAllowance: 1500,
      festivalBonus: 0,
      specialAllowance: 0,
    },
    fixedDeductions: {
      incomeTax: 500,
      advanceSalaryDeduction: 0,
    },
    preferredPaymentChannel: 'bank_transfer',
    bankDetails: {
      bankName: 'Islami Bank Bangladesh PLC',
      branchName: 'Farmgate Branch',
      accountNo: '2050183920192',
      routingNo: '125272183',
    },
    mfsNumber: null,
  },
  {
    staffId: 'EMP-1007',
    employeeName: 'Kamal Hossain',
    employeeNameBn: 'কামাল হোসেন',
    designation: 'Head Accountant',
    designationBn: 'প্রধান হিসাবরক্ষক',
    department: 'Accounts & Finance',
    departmentBn: 'হিসাব ও অর্থ',
    staffType: 'administrative',
    employmentType: 'non_mpo',
    mpoIndexNo: null,
    joiningDate: '2019-09-01',
    earnings: {
      basicPay: 24000,
      houseRent: 4000,
      medicalAllowance: 1500,
      conveyanceAllowance: 1500,
      festivalBonus: 0,
      specialAllowance: 1000,
    },
    fixedDeductions: {
      incomeTax: 300,
      advanceSalaryDeduction: 0,
    },
    preferredPaymentChannel: 'bank_transfer',
    bankDetails: {
      bankName: 'Sonali Bank PLC',
      branchName: 'Dhanmondi Branch',
      accountNo: '020349821099',
      routingNo: '200261948',
    },
    mfsNumber: null,
  },
  {
    staffId: 'EMP-1008',
    employeeName: 'Sumon Chandra Das',
    employeeNameBn: 'সুমন চন্দ্র দাস',
    designation: 'Office Assistant',
    designationBn: 'অফিস সহকারী',
    department: 'Administration',
    departmentBn: 'প্রশাসন',
    staffType: 'non_teaching',
    employmentType: 'non_mpo',
    mpoIndexNo: null,
    joiningDate: '2023-03-01',
    earnings: {
      basicPay: 18000,
      houseRent: 3000,
      medicalAllowance: 1000,
      conveyanceAllowance: 1000,
      festivalBonus: 0,
      specialAllowance: 0,
    },
    fixedDeductions: {
      incomeTax: 0,
      advanceSalaryDeduction: 0,
    },
    preferredPaymentChannel: 'bkash',
    bankDetails: null,
    mfsNumber: '01911223344',
  },
  {
    staffId: 'EMP-1009',
    employeeName: 'Md. Belal Mia',
    employeeNameBn: 'মো. বেলাল মিঞা',
    designation: 'Lab Attendant & Peon',
    designationBn: 'ল্যাব অ্যাটেনডেন্ট ও পিয়ন',
    department: 'Support Staff',
    departmentBn: 'সহায়ক কর্মী',
    staffType: 'non_teaching',
    employmentType: 'non_mpo',
    mpoIndexNo: null,
    joiningDate: '2020-01-01',
    earnings: {
      basicPay: 15000,
      houseRent: 2500,
      medicalAllowance: 1000,
      conveyanceAllowance: 1000,
      festivalBonus: 0,
      specialAllowance: 0,
    },
    fixedDeductions: {
      incomeTax: 0,
      advanceSalaryDeduction: 500,
    },
    preferredPaymentChannel: 'cash',
    bankDetails: null,
    mfsNumber: null,
  },
]

// Initialize starting payslips for Month 9 (September), 2026
function createInitialPayslips(): StaffPayslip[] {
  return INITIAL_PROFILES.map((profile, idx) => {
    // Give slight variation to demo unpaid leave and statuses
    const unpaidLeaveDays = idx === 3 ? 1 : 0
    const slip = generatePayslip(profile, 9, 2026, { unpaidLeaveDays })

    if (idx < 3) {
      // First 3 are disbursed via bank
      slip.status = 'disbursed'
      slip.disbursementDate = '2026-09-05'
      slip.paymentReference = `BEFTN-SB-9482${idx}`
    } else if (idx < 6) {
      // Next 3 are approved
      slip.status = 'approved'
    } else {
      slip.status = 'draft'
    }

    return slip
  })
}

// In-memory persistent stores
let profilesStore: StaffSalaryProfile[] = [...INITIAL_PROFILES]
let payslipsStore: StaffPayslip[] = createInitialPayslips()

export function resetPayrollStore(): void {
  profilesStore = [...INITIAL_PROFILES]
  payslipsStore = createInitialPayslips()
}

export const PAYROLL_KEYS = {
  all: ['payroll'] as const,
  profiles: () => [...PAYROLL_KEYS.all, 'profiles'] as const,
  monthly: (month: number, year: number) =>
    [...PAYROLL_KEYS.all, 'monthly', month, year] as const,
}

export function useStaffSalaryProfiles() {
  return useQuery<StaffSalaryProfile[]>({
    queryKey: PAYROLL_KEYS.profiles(),
    queryFn: async () => [...profilesStore],
    initialData: () => [...profilesStore],
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateStaffSalaryProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      staffId: string
      earnings: Partial<SalaryStructure>
      fixedDeductions?: { incomeTax: number; advanceSalaryDeduction: number }
      preferredPaymentChannel?: PaymentChannel
      bankDetails?: BankAccountDetails | null
      mfsNumber?: string | null
    }) => {
      const idx = profilesStore.findIndex((p) => p.staffId === payload.staffId)
      if (idx === -1) throw new Error('Staff profile not found')

      const current = profilesStore[idx]
      const updated: StaffSalaryProfile = {
        ...current,
        earnings: {
          ...current.earnings,
          ...payload.earnings,
        },
        fixedDeductions: payload.fixedDeductions ?? current.fixedDeductions,
        preferredPaymentChannel:
          payload.preferredPaymentChannel ?? current.preferredPaymentChannel,
        bankDetails:
          payload.bankDetails !== undefined
            ? payload.bankDetails
            : current.bankDetails,
        mfsNumber:
          payload.mfsNumber !== undefined ? payload.mfsNumber : current.mfsNumber,
      }

      profilesStore[idx] = updated
      return updated
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYROLL_KEYS.all })
    },
  })
}

export function useMonthlyPayroll(month: number, year: number) {
  return useQuery<StaffPayslip[]>({
    queryKey: PAYROLL_KEYS.monthly(month, year),
    queryFn: async () => {
      return payslipsStore.filter((p) => p.month === month && p.year === year)
    },
    initialData: () => {
      return payslipsStore.filter((p) => p.month === month && p.year === year)
    },
    staleTime: 60 * 1000,
  })
}

export function useGenerateMonthlyPayroll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      month,
      year,
      festivalBonusPercent = 0,
    }: {
      month: number
      year: number
      festivalBonusPercent?: number
    }) => {
      // Remove existing slips for this month/year that are in draft/void state
      payslipsStore = payslipsStore.filter(
        (p) => !(p.month === month && p.year === year && p.status === 'draft'),
      )

      const newSlips: StaffPayslip[] = profilesStore.map((profile) => {
        const bonus =
          festivalBonusPercent > 0
            ? Math.round(profile.earnings.basicPay * (festivalBonusPercent / 100))
            : profile.earnings.festivalBonus

        return generatePayslip(profile, month, year, { festivalBonus: bonus })
      })

      // Add only for profiles that do not already have an approved or disbursed slip
      newSlips.forEach((slip) => {
        const exists = payslipsStore.some(
          (p) =>
            p.staffId === slip.staffId &&
            p.month === month &&
            p.year === year &&
            (p.status === 'approved' || p.status === 'disbursed'),
        )
        if (!exists) {
          payslipsStore.push(slip)
        }
      })

      return payslipsStore.filter((p) => p.month === month && p.year === year)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: PAYROLL_KEYS.monthly(variables.month, variables.year),
      })
    },
  })
}

export function useDisburseSalary() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      payslipId,
      disbursementDate,
      paymentChannel,
      paymentReference,
    }: {
      payslipId: string
      disbursementDate: string
      paymentChannel?: PaymentChannel
      paymentReference?: string
    }) => {
      const idx = payslipsStore.findIndex((p) => p.id === payslipId)
      if (idx === -1) throw new Error('Payslip not found')

      const current = payslipsStore[idx]
      payslipsStore[idx] = {
        ...current,
        status: 'disbursed',
        disbursementDate,
        paymentChannel: paymentChannel ?? current.paymentChannel,
        paymentReference: paymentReference ?? null,
      }

      return payslipsStore[idx]
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({
        queryKey: PAYROLL_KEYS.monthly(updated.month, updated.year),
      })
    },
  })
}

export function useBulkDisburse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      payslipIds,
      disbursementDate,
      paymentReferencePrefix = 'BATCH-DISB',
    }: {
      payslipIds: string[]
      disbursementDate: string
      paymentReferencePrefix?: string
    }) => {
      payslipIds.forEach((id, i) => {
        const idx = payslipsStore.findIndex((p) => p.id === id)
        if (idx !== -1) {
          payslipsStore[idx] = {
            ...payslipsStore[idx],
            status: 'disbursed',
            disbursementDate,
            paymentReference: `${paymentReferencePrefix}-${String(i + 1).padStart(3, '0')}`,
          }
        }
      })
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYROLL_KEYS.all })
    },
  })
}

export function useUpdatePayslipStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      payslipId,
      status,
    }: {
      payslipId: string
      status: SalaryPayStatus
    }) => {
      const idx = payslipsStore.findIndex((p) => p.id === payslipId)
      if (idx === -1) throw new Error('Payslip not found')

      payslipsStore[idx] = {
        ...payslipsStore[idx],
        status,
      }
      return payslipsStore[idx]
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({
        queryKey: PAYROLL_KEYS.monthly(updated.month, updated.year),
      })
    },
  })
}
