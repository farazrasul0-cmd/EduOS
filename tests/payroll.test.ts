import { describe, it, expect } from 'vitest'
import {
  calculateMpoDeductions,
  calculateUnpaidLeaveDeduction,
  computeGrossEarnings,
  computeTotalDeductions,
  computeNetPayable,
  generatePayslip,
  numberToWordsTaka,
  numberToWordsBangla,
  type StaffSalaryProfile,
} from '@/lib/payroll'
import {
  createPayslipPdf,
  createPayrollSummaryPdf,
} from '@/lib/payroll-pdf'

const mockProfileMpo: StaffSalaryProfile = {
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
}

const mockProfileNonMpo: StaffSalaryProfile = {
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
}

describe('Payroll Domain Calculations', () => {
  it('calculates statutory MPO deductions (10% GPF, 4% Welfare, 6% Retirement)', () => {
    const deductions = calculateMpoDeductions(50000, 'mpo')
    expect(deductions.providentFund).toBe(5000)
    expect(deductions.welfareTrust).toBe(2000)
    expect(deductions.retirementFund).toBe(3000)
  })

  it('calculates Non-MPO deductions with only institutional PF (10%) and 0 statutory welfare/retirement', () => {
    const deductions = calculateMpoDeductions(25000, 'non_mpo')
    expect(deductions.providentFund).toBe(2500)
    expect(deductions.welfareTrust).toBe(0)
    expect(deductions.retirementFund).toBe(0)
  })

  it('calculates unpaid leave deduction accurately based on days absent', () => {
    const penalty = calculateUnpaidLeaveDeduction(30000, 2, 30)
    expect(penalty).toBe(2000)

    const zeroPenalty = calculateUnpaidLeaveDeduction(30000, 0, 30)
    expect(zeroPenalty).toBe(0)
  })

  it('computes gross earnings, total deductions, and net payable properly', () => {
    const earnings = {
      basicPay: 40000,
      houseRent: 2000,
      medicalAllowance: 1000,
      conveyanceAllowance: 1500,
      festivalBonus: 10000,
      specialAllowance: 500,
    }
    const gross = computeGrossEarnings(earnings)
    expect(gross).toBe(55000)

    const deductions = {
      providentFund: 4000,
      welfareTrust: 1600,
      retirementFund: 2400,
      incomeTax: 1000,
      unpaidLeaveDeduction: 0,
      advanceSalaryDeduction: 1000,
    }
    const totalDed = computeTotalDeductions(deductions)
    expect(totalDed).toBe(10000)

    const net = computeNetPayable(gross, totalDed)
    expect(net).toBe(45000)
  })

  it('generates a full payslip record with computed net pay and valid ID token', () => {
    const slip = generatePayslip(mockProfileMpo, 9, 2026, { unpaidLeaveDays: 1 })
    expect(slip.id).toBe('PAY-2026-09-1001')
    expect(slip.staffId).toBe('EMP-1001')
    expect(slip.grossEarnings).toBe(56500) // 50000+1000+500+3000+0+2000
    // Statutory for MPO: PF=5000, Welfare=2000, Retirement=3000
    // Tax=1500, Advance=0
    // Unpaid leave = Math.round(50000 / 30 * 1) = 1667
    // Total deductions = 5000 + 2000 + 3000 + 1500 + 1667 = 13167
    expect(slip.totalDeductions).toBe(13167)
    expect(slip.netPayable).toBe(56500 - 13167)
    expect(slip.status).toBe('draft')
  })
})

describe('Number to Words Converters (Bangladeshi Taka)', () => {
  it('converts amounts to English Taka in words', () => {
    expect(numberToWordsTaka(0)).toBe('Zero Taka Only')
    expect(numberToWordsTaka(50000)).toBe('Fifty Thousand Taka Only')
    expect(numberToWordsTaka(38500)).toBe('Thirty-Eight Thousand Five Hundred Taka Only')
  })

  it('converts amounts to Bangla words with টাকা মাত্র', () => {
    expect(numberToWordsBangla(0)).toBe('শূন্য টাকা মাত্র')
    expect(numberToWordsBangla(50000)).toBe('পঞ্চাশ হাজার টাকা মাত্র')
    expect(numberToWordsBangla(25000)).toBe('পঁচিশ হাজার টাকা মাত্র')
  })
})

describe('Vector PDF Generation Engines', () => {
  const schoolDetails = {
    schoolName: 'Ideal High School & College',
    eiin: '108234',
    address: 'Dhanmondi, Dhaka',
    phone: '+880 1711-000000',
  }

  it('generates valid vector A4 Portrait Monthly Payslip PDF', () => {
    const slip = generatePayslip(mockProfileMpo, 9, 2026)
    slip.status = 'disbursed'
    slip.disbursementDate = '2026-09-05'
    slip.paymentReference = 'BEFTN-9482103'

    const pdfBytes = createPayslipPdf(slip, schoolDetails)
    expect(pdfBytes.length).toBeGreaterThan(600)

    const pdfText = new TextDecoder().decode(pdfBytes)
    expect(pdfText).toContain('%PDF-1.4')
    expect(pdfText).toContain('IDEAL HIGH SCHOOL')
    expect(pdfText).toContain('MONTHLY SALARY PAY SLIP')
    expect(pdfText).toContain('Dr. Muhammad Rafiqul Islam')
    expect(pdfText).toContain('DISBURSED')
    expect(pdfText).toContain('%%EOF')
  })

  it('generates valid vector A4 Landscape Monthly Salary Statement PDF', () => {
    const slip1 = generatePayslip(mockProfileMpo, 9, 2026)
    const slip2 = generatePayslip(mockProfileNonMpo, 9, 2026)

    const pdfBytes = createPayrollSummaryPdf([slip1, slip2], 9, 2026, schoolDetails)
    expect(pdfBytes.length).toBeGreaterThan(600)

    const pdfText = new TextDecoder().decode(pdfBytes)
    expect(pdfText).toContain('%PDF-1.4')
    expect(pdfText).toContain('[0 0 842 595]') // Landscape MediaBox
    expect(pdfText).toContain('STAFF SALARY STATEMENT')
    expect(pdfText).toContain('EMP-1001')
    expect(pdfText).toContain('EMP-1004')
    expect(pdfText).toContain('%%EOF')
  })
})
