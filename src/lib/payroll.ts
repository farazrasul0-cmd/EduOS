export type StaffType = 'teaching' | 'non_teaching' | 'administrative'
export type EmploymentType = 'mpo' | 'non_mpo' | 'contractual'
export type SalaryPayStatus = 'draft' | 'approved' | 'disbursed' | 'void'
export type PaymentChannel = 'bank_transfer' | 'bkash' | 'nagad' | 'cash'

export interface SalaryStructure {
  basicPay: number
  houseRent: number
  medicalAllowance: number
  conveyanceAllowance: number
  festivalBonus: number
  specialAllowance: number
}

export interface SalaryDeductions {
  providentFund: number
  welfareTrust: number
  retirementFund: number
  incomeTax: number
  unpaidLeaveDeduction: number
  advanceSalaryDeduction: number
}

export interface BankAccountDetails {
  bankName: string
  branchName: string
  accountNo: string
  routingNo: string
}

export interface StaffSalaryProfile {
  staffId: string
  employeeName: string
  employeeNameBn: string
  designation: string
  designationBn: string
  department: string
  departmentBn: string
  staffType: StaffType
  employmentType: EmploymentType
  mpoIndexNo: string | null
  joiningDate: string
  earnings: SalaryStructure
  fixedDeductions: {
    incomeTax: number
    advanceSalaryDeduction: number
  }
  preferredPaymentChannel: PaymentChannel
  bankDetails: BankAccountDetails | null
  mfsNumber: string | null
}

export interface StaffPayslip {
  id: string
  staffId: string
  employeeName: string
  employeeNameBn: string
  designation: string
  designationBn: string
  department: string
  departmentBn: string
  staffType: StaffType
  employmentType: EmploymentType
  mpoIndexNo: string | null
  month: number // 1 - 12
  year: number // e.g. 2026
  workingDays: number
  unpaidLeaveDays: number
  earnings: SalaryStructure
  grossEarnings: number
  deductions: SalaryDeductions
  totalDeductions: number
  netPayable: number
  status: SalaryPayStatus
  disbursementDate: string | null
  paymentChannel: PaymentChannel
  paymentReference: string | null
  bankDetails: BankAccountDetails | null
  mfsNumber: string | null
}

/**
 * Calculates statutory deductions under Bangladesh education standards:
 * - MPO (Monthly Pay Order):
 *   - Provident Fund (GPF): 10% of basic pay
 *   - Welfare Trust (কল্যাণ ট্রাস্ট): 4% of basic pay
 *   - Retirement Benefit Board (অবসর সুবিধা): 6% of basic pay
 * - Non-MPO (Institutional):
 *   - Institutional Provident Fund: 10% of basic pay
 *   - Welfare Trust: 0
 *   - Retirement Benefit Board: 0
 * - Contractual:
 *   - No mandatory GPF or Retirement deductions unless configured
 */
export function calculateMpoDeductions(
  basicPay: number,
  employmentType: EmploymentType,
): {
  providentFund: number
  welfareTrust: number
  retirementFund: number
} {
  if (employmentType === 'mpo') {
    return {
      providentFund: Math.round(basicPay * 0.1),
      welfareTrust: Math.round(basicPay * 0.04),
      retirementFund: Math.round(basicPay * 0.06),
    }
  }

  if (employmentType === 'non_mpo') {
    return {
      providentFund: Math.round(basicPay * 0.1),
      welfareTrust: 0,
      retirementFund: 0,
    }
  }

  return {
    providentFund: 0,
    welfareTrust: 0,
    retirementFund: 0,
  }
}

/**
 * Calculates salary deduction for unpaid leave / absence:
 * Formula: (Basic Pay / Total Days in Month) * Unpaid Leave Days
 */
export function calculateUnpaidLeaveDeduction(
  basicPay: number,
  unpaidLeaveDays: number,
  totalDaysInMonth: number = 30,
): number {
  if (unpaidLeaveDays <= 0 || basicPay <= 0 || totalDaysInMonth <= 0) return 0
  return Math.round((basicPay / totalDaysInMonth) * unpaidLeaveDays)
}

/**
 * Sums all components of gross earnings.
 */
export function computeGrossEarnings(structure: SalaryStructure): number {
  return (
    (structure.basicPay || 0) +
    (structure.houseRent || 0) +
    (structure.medicalAllowance || 0) +
    (structure.conveyanceAllowance || 0) +
    (structure.festivalBonus || 0) +
    (structure.specialAllowance || 0)
  )
}

/**
 * Sums all deductions.
 */
export function computeTotalDeductions(deductions: SalaryDeductions): number {
  return (
    (deductions.providentFund || 0) +
    (deductions.welfareTrust || 0) +
    (deductions.retirementFund || 0) +
    (deductions.incomeTax || 0) +
    (deductions.unpaidLeaveDeduction || 0) +
    (deductions.advanceSalaryDeduction || 0)
  )
}

/**
 * Net payable salary = Gross Earnings - Total Deductions (clamped to >= 0).
 */
export function computeNetPayable(
  grossEarnings: number,
  totalDeductions: number,
): number {
  return Math.max(0, grossEarnings - totalDeductions)
}

/**
 * Generates a full payslip record from an employee profile for a given month and year.
 */
export function generatePayslip(
  profile: StaffSalaryProfile,
  month: number,
  year: number,
  options?: {
    unpaidLeaveDays?: number
    festivalBonus?: number
    workingDays?: number
  },
): StaffPayslip {
  const unpaidLeaveDays = options?.unpaidLeaveDays ?? 0
  const festivalBonus = options?.festivalBonus ?? profile.earnings.festivalBonus
  const workingDays = options?.workingDays ?? 26

  const earnings: SalaryStructure = {
    ...profile.earnings,
    festivalBonus,
  }
  const grossEarnings = computeGrossEarnings(earnings)

  const statutory = calculateMpoDeductions(profile.earnings.basicPay, profile.employmentType)
  const unpaidLeaveDeduction = calculateUnpaidLeaveDeduction(
    profile.earnings.basicPay,
    unpaidLeaveDays,
  )

  const deductions: SalaryDeductions = {
    providentFund: statutory.providentFund,
    welfareTrust: statutory.welfareTrust,
    retirementFund: statutory.retirementFund,
    incomeTax: profile.fixedDeductions.incomeTax,
    unpaidLeaveDeduction,
    advanceSalaryDeduction: profile.fixedDeductions.advanceSalaryDeduction,
  }

  const totalDeductions = computeTotalDeductions(deductions)
  const netPayable = computeNetPayable(grossEarnings, totalDeductions)

  const monthPad = String(month).padStart(2, '0')
  const payslipId = `PAY-${year}-${monthPad}-${profile.staffId.replace('EMP-', '')}`

  return {
    id: payslipId,
    staffId: profile.staffId,
    employeeName: profile.employeeName,
    employeeNameBn: profile.employeeNameBn,
    designation: profile.designation,
    designationBn: profile.designationBn,
    department: profile.department,
    departmentBn: profile.departmentBn,
    staffType: profile.staffType,
    employmentType: profile.employmentType,
    mpoIndexNo: profile.mpoIndexNo,
    month,
    year,
    workingDays,
    unpaidLeaveDays,
    earnings,
    grossEarnings,
    deductions,
    totalDeductions,
    netPayable,
    status: 'draft',
    disbursementDate: null,
    paymentChannel: profile.preferredPaymentChannel,
    paymentReference: null,
    bankDetails: profile.bankDetails,
    mfsNumber: profile.mfsNumber,
  }
}

/**
 * Converts a positive number to English words with "Taka Only".
 */
export function numberToWordsTaka(amount: number): string {
  if (amount <= 0) return 'Zero Taka Only'

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ]
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ]

  function helper(n: number): string {
    if (n === 0) return ''
    if (n < 20) return ones[n] + ' '
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? '-' + ones[n % 10] : '') + ' '
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred ' + helper(n % 100)
    if (n < 100000) return helper(Math.floor(n / 1000)) + 'Thousand ' + helper(n % 1000)
    if (n < 10000000) return helper(Math.floor(n / 100000)) + 'Lakh ' + helper(n % 100000)
    return helper(Math.floor(n / 10000000)) + 'Crore ' + helper(n % 10000000)
  }

  const rounded = Math.round(amount)
  const result = helper(rounded).trim().replace(/\s+/g, ' ')
  return `${result} Taka Only`
}

/**
 * Converts a positive number to standard Bangla words with "টাকা মাত্র".
 */
export function numberToWordsBangla(amount: number): string {
  if (amount <= 0) return 'শূন্য টাকা মাত্র'

  const BN_1_TO_99 = [
    '', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়', 'দশ',
    'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ', 'বিশ',
    'একুশ', 'বাইশ', 'তেইশ', 'চব্বিশ', 'পঁচিশ', 'ছাব্বিশ', 'সাতাশ', 'আঠাশ', 'উনত্রিশ', 'ত্রিশ',
    'একত্রিশ', 'বত্রিশ', 'তেত্রিশ', 'চৌত্রিশ', 'পঁয়ত্রিশ', 'ছত্রিশ', 'সাঁইত্রিশ', 'আটত্রিশ', 'উনচল্লিশ', 'চল্লিশ',
    'একচল্লিশ', 'বিয়াল্লিশ', 'তেতাল্লিশ', 'চুয়াল্লিশ', 'পঁয়তাল্লিশ', 'ছেচল্লিশ', 'সাতচল্লিশ', 'আটচল্লিশ', 'উনপঞ্চাশ', 'পঞ্চাশ',
    'একান্ন', 'বায়ান্ন', 'তিপ্পান্ন', 'চুয়ান্ন', 'পঞ্চান্ন', 'ছাপ্পান্ন', 'সাতান্ন', 'আটান্ন', 'উনষাট', 'ষাট',
    'একষট্টি', 'বাষট্টি', 'তেষট্টি', 'চৌষট্টি', 'পঁয়ষট্টি', 'ছেষট্টি', 'সাতষট্টি', 'আটষট্টি', 'উনসত্তর', 'সত্তর',
    'একাত্তর', 'বাহাত্তর', 'তিয়াত্তর', 'চুয়াত্তর', 'পঁচাত্তর', 'ছিয়াত্তর', 'সাতাত্তর', 'আটাত্তর', 'উনআশি', 'আশি',
    'একাশি', 'বিরাশি', 'তিরাশি', 'চুরাশি', 'পঁচাশি', 'ছিয়াশি', 'সাতাশি', 'আটাশি', 'উননব্বই', 'নব্বই',
    'একানব্বই', 'বিরানব্বই', 'তিরানব্বই', 'চুরানব্বই', 'পঁচানব্বই', 'ছিয়ানব্বই', 'সাতানব্বই', 'আটানব্বই', 'নিরানব্বই',
  ]

  function helper(n: number): string {
    if (n === 0) return ''
    if (n < 100) return BN_1_TO_99[n] || ''
    if (n < 1000) {
      const h = Math.floor(n / 100)
      const r = n % 100
      return `${BN_1_TO_99[h]} শত ${helper(r)}`.trim()
    }
    if (n < 100000) {
      const th = Math.floor(n / 1000)
      const r = n % 1000
      return `${helper(th)} হাজার ${helper(r)}`.trim()
    }
    if (n < 10000000) {
      const lk = Math.floor(n / 100000)
      const r = n % 100000
      return `${helper(lk)} লক্ষ ${helper(r)}`.trim()
    }
    const cr = Math.floor(n / 10000000)
    const r = n % 10000000
    return `${helper(cr)} কোটি ${helper(r)}`.trim()
  }

  const rounded = Math.round(amount)
  const result = helper(rounded).trim().replace(/\s+/g, ' ')
  return `${result} টাকা মাত্র`
}
