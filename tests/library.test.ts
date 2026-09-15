import { describe, it, expect } from 'vitest'
import {
  generateAccessionNo,
  calculateOverdueDays,
  calculateLibraryFine,
  getNctbCurriculumBooks,
  computeDistributionProgress,
  type NctbStudentDistribution,
  type BookLoan,
} from '@/lib/library'
import {
  createBookDistributionReportPdf,
  createLibraryOverdueNoticePdf,
} from '@/lib/library-pdf'

describe('Library Domain Engine (Phase 12)', () => {
  it('generates standardized accession numbers with correct category prefixes and padding', () => {
    expect(generateAccessionNo('fiction', 1)).toBe('ACC-FIC-0001')
    expect(generateAccessionNo('science', 42)).toBe('ACC-SCI-0042')
    expect(generateAccessionNo('olympiad', 105)).toBe('ACC-OLY-0105')
    expect(generateAccessionNo('reference', 8)).toBe('ACC-REF-0008')
    expect(generateAccessionNo('nctb', 999)).toBe('ACC-NCT-0999')
  })

  it('calculates overdue days accurately based on reference dates', () => {
    // Past due: 10 days overdue
    const overdue = calculateOverdueDays('2026-09-01', '2026-09-11')
    expect(overdue).toBe(10)

    // Today / Same day: 0
    const today = calculateOverdueDays('2026-09-11', '2026-09-11')
    expect(today).toBe(0)

    // Future due date: 0
    const future = calculateOverdueDays('2026-09-20', '2026-09-11')
    expect(future).toBe(0)
  })

  it('calculates late fines correctly using default BDT 2/day rate and custom rates', () => {
    // 5 days overdue at ৳2/day = ৳10
    const fineDefault = calculateLibraryFine('2026-09-05', 2, '2026-09-10')
    expect(fineDefault).toBe(10)

    // 14 days overdue at ৳5/day = ৳70
    const fineCustom = calculateLibraryFine('2026-09-01', 5, '2026-09-15')
    expect(fineCustom).toBe(70)

    // Not overdue = ৳0
    const notOverdue = calculateLibraryFine('2026-09-20', 2, '2026-09-10')
    expect(notOverdue).toBe(0)
  })

  it('provides official NCTB syllabus subjects tailored to primary and secondary grades', () => {
    const primary = getNctbCurriculumBooks('Class 1')
    expect(primary.length).toBe(3)
    expect(primary.some((b) => b.subjectKey === 'bangla')).toBe(true)

    const midPrimary = getNctbCurriculumBooks('Class 4')
    expect(midPrimary.length).toBe(6)
    expect(midPrimary.some((b) => b.subjectKey === 'bgs')).toBe(true)

    const secondary = getNctbCurriculumBooks('Class 7-A')
    expect(secondary.length).toBe(9)
    expect(secondary.some((b) => b.subjectKey === 'ict')).toBe(true)
  })

  it('computes NCTB textbook distribution progress and percentage correctly', () => {
    const mockDistributions: NctbStudentDistribution[] = [
      {
        id: 'd-1',
        academicYear: '2026',
        classId: 'c-6',
        className: 'Class 6-A',
        studentId: 's-1',
        studentName: 'Zubair Al Mahfuz',
        rollNo: '01',
        distributedSubjectKeys: [
          'bangla_lit',
          'bangla_gram',
          'english',
          'english_gram',
          'math',
          'science',
          'bgs',
          'ict',
          'religion',
        ],
        guardianSigned: true,
      },
      {
        id: 'd-2',
        academicYear: '2026',
        classId: 'c-6',
        className: 'Class 6-A',
        studentId: 's-2',
        studentName: 'Sumaiya Akter',
        rollNo: '02',
        distributedSubjectKeys: ['bangla_lit', 'english'],
        guardianSigned: false,
      },
      {
        id: 'd-3',
        academicYear: '2026',
        classId: 'c-6',
        className: 'Class 6-A',
        studentId: 's-3',
        studentName: 'Fatima Nawar',
        rollNo: '03',
        distributedSubjectKeys: [],
        guardianSigned: false,
      },
    ]

    const stats = computeDistributionProgress(mockDistributions, 'Class 6-A')
    expect(stats.totalStudents).toBe(3)
    expect(stats.fullyDistributed).toBe(1)
    expect(stats.partiallyDistributed).toBe(1)
    expect(stats.pending).toBe(1)
    expect(stats.percentDistributed).toBe(33)
  })

  it('generates a valid vector PDF for the UEO Free Textbook Distribution Register', () => {
    const mockDistributions: NctbStudentDistribution[] = [
      {
        id: 'd-1',
        academicYear: '2026',
        classId: 'c-6',
        className: 'Class 6-A',
        studentId: 's-1',
        studentName: 'Zubair Al Mahfuz',
        rollNo: '01',
        distributedSubjectKeys: ['bangla_lit', 'english', 'math'],
        guardianSigned: true,
      },
    ]

    const pdfBytes = createBookDistributionReportPdf(mockDistributions, 'Class 6-A', {
      schoolName: 'Riverside Public School',
      eiin: '108234',
      address: 'Dhaka, Bangladesh',
    })

    expect(pdfBytes.length).toBeGreaterThan(300)

    const text = new TextDecoder().decode(pdfBytes)
    expect(text).toContain('%PDF-1.4')
    expect(text).toContain('NCTB FREE TEXTBOOK DISTRIBUTION REGISTER')
    expect(text).toContain('Zubair Al Mahfuz')
    expect(text).toContain('%%EOF')
  })

  it('generates a valid vector PDF for the Library Overdue Notice', () => {
    const mockLoans: BookLoan[] = [
      {
        id: 'l-1',
        bookId: 'b-1',
        bookTitle: 'Dipu Number Two',
        borrowerType: 'student',
        borrowerId: 's-1',
        borrowerName: 'Tanvir Ahmed',
        borrowerRollOrDesignation: '01',
        borrowerClass: 'Class 7-A',
        borrowerPhone: '01711223344',
        issueDate: '2026-08-15',
        dueDate: '2026-08-29',
        status: 'overdue',
        fineAccrued: 32,
        finePaid: false,
      },
    ]

    const pdfBytes = createLibraryOverdueNoticePdf(mockLoans, {
      schoolName: 'Riverside Public School',
      eiin: '108234',
      address: 'Dhaka, Bangladesh',
    })

    expect(pdfBytes.length).toBeGreaterThan(300)

    const text = new TextDecoder().decode(pdfBytes)
    expect(text).toContain('%PDF-1.4')
    expect(text).toContain('LIBRARY OVERDUE NOTICE')
    expect(text).toContain('Tanvir Ahmed')
    expect(text).toContain('Dipu Number Two')
    expect(text).toContain('%%EOF')
  })
})
