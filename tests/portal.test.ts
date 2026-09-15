import { describe, it, expect } from 'vitest'
import {
  computeCollegiateStatus,
  computeTotalDues,
  generateMfsTransactionId,
  simulateMfsPayment,
  type PortalChildSummary,
  type PortalSubjectScore,
  type PortalFeeInvoice,
} from '@/lib/portal'
import { createStudentProgressDossierPdf } from '@/lib/portal-pdf'

const mockSchool = {
  schoolName: 'Dhaka Model High School & College',
  eiin: '108234',
  address: 'Dhanmondi, Dhaka, Bangladesh',
  phone: '+880 1711-000000',
  email: 'info@dhakamodel.edu.bd',
}

const mockChild: PortalChildSummary = {
  id: 'STD-2026-001',
  name: 'Tanvir Ahmed',
  nameBn: 'তানভীর আহমেদ',
  rollNo: '01',
  className: 'Class 7',
  section: 'A',
  gender: 'male',
  guardianName: 'Md. Farhad Ahmed',
  guardianPhone: '01711223344',
  attendanceRate: 88.8,
  presentDays: 142,
  totalWorkingDays: 160,
  collegiateStatus: 'collegiate',
  totalDues: 2500,
  gpa: 4.85,
  overallGrade: 'A+',
  meritPosition: 2,
}

const mockSubjects: PortalSubjectScore[] = [
  { subject: 'Bangla', caMarks: 18, finalMarks: 72, totalMarks: 90, letter: 'A+', gradePoint: 5.0, isPassed: true },
  { subject: 'English', caMarks: 16, finalMarks: 68, totalMarks: 84, letter: 'A+', gradePoint: 5.0, isPassed: true },
  { subject: 'Mathematics', caMarks: 19, finalMarks: 74, totalMarks: 93, letter: 'A+', gradePoint: 5.0, isPassed: true },
]

describe('Parent & Student Portal Domain Engine', () => {
  describe('NCTB Collegiate Standing Rules', () => {
    it('evaluates collegiate standing (>= 75%) correctly', () => {
      const res = computeCollegiateStatus(142, 160)
      expect(res.rate).toBe(88.8)
      expect(res.status).toBe('collegiate')
    })

    it('evaluates non-collegiate standing (60% - 74.9%) correctly', () => {
      const res = computeCollegiateStatus(110, 160)
      expect(res.rate).toBe(68.8)
      expect(res.status).toBe('non_collegiate')
    })

    it('evaluates dis-collegiate standing (< 60%) correctly', () => {
      const res = computeCollegiateStatus(85, 160)
      expect(res.rate).toBe(53.1)
      expect(res.status).toBe('dis_collegiate')
    })

    it('safely handles zero total working days', () => {
      const res = computeCollegiateStatus(0, 0)
      expect(res.rate).toBe(100)
      expect(res.status).toBe('collegiate')
    })
  })

  describe('Fee Dues Computation', () => {
    it('calculates total outstanding fee balance correctly across mixed invoices', () => {
      const invoices: PortalFeeInvoice[] = [
        {
          id: '1',
          title: 'Tuition Fee 1',
          period: 'July',
          amount: 2500,
          paidAmount: 2500,
          dueDate: '2026-07-20',
          status: 'paid',
        },
        {
          id: '2',
          title: 'Tuition Fee 2',
          period: 'August',
          amount: 2500,
          paidAmount: 1000,
          dueDate: '2026-08-20',
          status: 'due',
        },
        {
          id: '3',
          title: 'Tuition Fee 3',
          period: 'September',
          amount: 2500,
          paidAmount: 0,
          dueDate: '2026-09-20',
          status: 'overdue',
        },
      ]

      expect(computeTotalDues(invoices)).toBe(1500 + 2500)
    })

    it('returns zero dues when all invoices are fully cleared', () => {
      const invoices: PortalFeeInvoice[] = [
        {
          id: '1',
          title: 'Tuition Fee 1',
          period: 'July',
          amount: 2500,
          paidAmount: 2500,
          dueDate: '2026-07-20',
          status: 'paid',
        },
      ]
      expect(computeTotalDues(invoices)).toBe(0)
    })
  })

  describe('MFS Payment Simulation', () => {
    it('generates unique transaction IDs with respective channel prefixes', () => {
      const bkashTrx = generateMfsTransactionId('bkash')
      const nagadTrx = generateMfsTransactionId('nagad')
      const rocketTrx = generateMfsTransactionId('rocket')

      expect(bkashTrx).toMatch(/^TRX-BK-[A-Z0-9]+$/)
      expect(nagadTrx).toMatch(/^TRX-NG-[A-Z0-9]+$/)
      expect(rocketTrx).toMatch(/^TRX-RK-[A-Z0-9]+$/)
    })

    it('successfully processes valid payment with 11-digit Bangladeshi mobile number', () => {
      const res = simulateMfsPayment('INV-01', 2500, 'bkash', '01711223344')
      expect(res.success).toBe(true)
      expect(res.method).toBe('bkash')
      expect(res.amount).toBe(2500)
      expect(res.transactionId).toMatch(/^TRX-BK-/)
    })

    it('throws error when mobile number is less than 11 digits', () => {
      expect(() => simulateMfsPayment('INV-01', 2500, 'nagad', '0171122')).toThrow(
        'Please provide a valid 11-digit Bangladeshi mobile number.',
      )
    })
  })

  describe('Vector Student Progress Dossier PDF Generation', () => {
    it('generates valid vector A4 PDF bytes with PDF header and trailer', () => {
      const bytes = createStudentProgressDossierPdf(mockChild, mockSubjects, mockSchool)
      expect(bytes.byteLength).toBeGreaterThan(500)

      const text = new TextDecoder().decode(bytes)
      expect(text.startsWith('%PDF-1.4')).toBe(true)
      expect(text.includes('%%EOF')).toBe(true)
      expect(text.includes('DHAKA MODEL HIGH SCHOOL')).toBe(true)
      expect(text.includes('Tanvir Ahmed')).toBe(true)
      expect(text.includes('COLLEGIATE (NCTB ELIGIBLE)')).toBe(true)
    })
  })
})
