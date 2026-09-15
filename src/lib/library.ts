/**
 * Library & NCTB Textbook Management Domain Engine
 * Handles library book cataloging, circulation loans, overdue fines,
 * and annual NCTB Free Textbook Distribution ("বই উৎসব").
 */

export type BookCategory =
  | 'fiction'
  | 'science'
  | 'history'
  | 'biography'
  | 'religion'
  | 'reference'
  | 'olympiad'
  | 'nctb'
  | 'other'

export type BookLanguage = 'bengali' | 'english' | 'arabic'

export type BookStatus = 'available' | 'low_stock' | 'out_of_stock'

export interface Book {
  id: string
  schoolId: string
  accessionNo: string
  isbn?: string
  title: string
  titleBn?: string
  author: string
  authorBn?: string
  category: BookCategory
  shelfLocation: string
  totalCopies: number
  availableCopies: number
  publicationYear?: string
  language: BookLanguage
}

export type BorrowerType = 'student' | 'teacher'

export type LoanStatus = 'issued' | 'returned' | 'overdue' | 'lost'

export interface BookLoan {
  id: string
  bookId: string
  bookTitle: string
  borrowerType: BorrowerType
  borrowerId: string
  borrowerName: string
  borrowerRollOrDesignation: string
  borrowerClass?: string
  borrowerPhone?: string
  issueDate: string // YYYY-MM-DD
  dueDate: string // YYYY-MM-DD
  returnDate?: string // YYYY-MM-DD
  status: LoanStatus
  fineAccrued: number
  finePaid: boolean
  fineWaived?: boolean
}

export interface NctbSubjectBook {
  subjectKey: string
  subjectEn: string
  subjectBn: string
}

export interface NctbStudentDistribution {
  id: string
  academicYear: string
  classId: string
  className: string
  studentId: string
  studentName: string
  studentNameBn?: string
  rollNo: string
  distributedSubjectKeys: string[]
  guardianSigned: boolean
  distributionDate?: string
}

export const BOOK_CATEGORIES: BookCategory[] = [
  'fiction',
  'science',
  'history',
  'biography',
  'religion',
  'reference',
  'olympiad',
  'nctb',
  'other',
]

export const DEFAULT_FINE_PER_DAY = 2 // ৳2 BDT per day

/**
 * Formats a clean, standard library accession number.
 * e.g. ACC-SCI-0042 or ACC-FIC-0100
 */
export function generateAccessionNo(category: BookCategory, seq: number): string {
  const prefixMap: Record<BookCategory, string> = {
    fiction: 'FIC',
    science: 'SCI',
    history: 'HIS',
    biography: 'BIO',
    religion: 'REL',
    reference: 'REF',
    olympiad: 'OLY',
    nctb: 'NCT',
    other: 'GEN',
  }
  const code = prefixMap[category] || 'GEN'
  const padded = String(seq).padStart(4, '0')
  return `ACC-${code}-${padded}`
}

/**
 * Calculates days overdue relative to due date.
 * Returns 0 if not overdue.
 */
export function calculateOverdueDays(dueDate: string, referenceDateStr?: string): number {
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)

  const ref = referenceDateStr ? new Date(referenceDateStr) : new Date()
  ref.setHours(0, 0, 0, 0)

  const diffMs = ref.getTime() - due.getTime()
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return days > 0 ? days : 0
}

/**
 * Computes the accrued late fine for an overdue book.
 * Defaults to ৳2/day overdue.
 */
export function calculateLibraryFine(
  dueDate: string,
  fineRatePerDay = DEFAULT_FINE_PER_DAY,
  referenceDateStr?: string,
): number {
  const overdueDays = calculateOverdueDays(dueDate, referenceDateStr)
  return overdueDays * fineRatePerDay
}

/**
 * Standard Bangladesh NCTB Curriculum Textbook Syllabus by Class.
 */
export function getNctbCurriculumBooks(className: string): NctbSubjectBook[] {
  const normalized = className.toLowerCase().trim()

  if (normalized.includes('1') || normalized.includes('2')) {
    return [
      { subjectKey: 'bangla', subjectEn: 'Amar Bangla Boi', subjectBn: 'আমার বাংলা বই' },
      { subjectKey: 'english', subjectEn: 'English for Today', subjectBn: 'ইংলিশ ফর টুডে' },
      { subjectKey: 'math', subjectEn: 'Elementary Mathematics', subjectBn: 'প্রাথমিক গণিত' },
    ]
  }

  if (normalized.includes('3') || normalized.includes('4') || normalized.includes('5')) {
    return [
      { subjectKey: 'bangla', subjectEn: 'Amar Bangla Boi', subjectBn: 'আমার বাংলা বই' },
      { subjectKey: 'english', subjectEn: 'English for Today', subjectBn: 'ইংলিশ ফর টুডে' },
      { subjectKey: 'math', subjectEn: 'Elementary Mathematics', subjectBn: 'প্রাথমিক গণিত' },
      { subjectKey: 'science', subjectEn: 'Primary Science', subjectBn: 'প্রাথমিক বিজ্ঞান' },
      { subjectKey: 'bgs', subjectEn: 'Bangladesh and Global Studies', subjectBn: 'বাংলাদেশ ও বিশ্বপরিচয়' },
      { subjectKey: 'religion', subjectEn: 'Religious & Moral Studies', subjectBn: 'ধর্ম ও নৈতিক শিক্ষা' },
    ]
  }

  // Class 6 to 10 (Secondary)
  return [
    { subjectKey: 'bangla_lit', subjectEn: 'Bangla Sahitya / Charupath', subjectBn: 'বাংলা সাহিত্য / চারুপাঠ' },
    { subjectKey: 'bangla_gram', subjectEn: 'Bangla Grammar & Composition', subjectBn: 'বাংলা ব্যাকরণ ও নির্মিতি' },
    { subjectKey: 'english', subjectEn: 'English for Today', subjectBn: 'English for Today' },
    { subjectKey: 'english_gram', subjectEn: 'English Grammar & Composition', subjectBn: 'English Grammar' },
    { subjectKey: 'math', subjectEn: 'Mathematics', subjectBn: 'গণিত' },
    { subjectKey: 'science', subjectEn: 'General Science', subjectBn: 'বিজ্ঞান' },
    { subjectKey: 'bgs', subjectEn: 'Bangladesh & Global Studies', subjectBn: 'বাংলাদেশ ও বিশ্বপরিচয়' },
    { subjectKey: 'ict', subjectEn: 'Information & Comm. Technology', subjectBn: 'তথ্য ও যোগাযোগ প্রযুক্তি' },
    { subjectKey: 'religion', subjectEn: 'Islam & Moral Education', subjectBn: 'ইসলাম ও নৈতিক শিক্ষা' },
  ]
}

/**
 * Computes distribution statistics for NCTB textbooks across students.
 */
export function computeDistributionProgress(
  distributions: NctbStudentDistribution[],
  className?: string,
): {
  totalStudents: number
  fullyDistributed: number
  partiallyDistributed: number
  pending: number
  percentDistributed: number
} {
  const filtered = className && className !== 'all'
    ? distributions.filter((d) => d.className === className)
    : distributions

  const totalStudents = filtered.length
  if (totalStudents === 0) {
    return { totalStudents: 0, fullyDistributed: 0, partiallyDistributed: 0, pending: 0, percentDistributed: 0 }
  }

  let fullyDistributed = 0
  let partiallyDistributed = 0
  let pending = 0

  for (const item of filtered) {
    const curriculum = getNctbCurriculumBooks(item.className)
    const requiredCount = curriculum.length
    const distributedCount = item.distributedSubjectKeys.length

    if (distributedCount >= requiredCount && requiredCount > 0) {
      fullyDistributed++
    } else if (distributedCount > 0) {
      partiallyDistributed++
    } else {
      pending++
    }
  }

  const percentDistributed = Math.round((fullyDistributed / totalStudents) * 100)

  return {
    totalStudents,
    fullyDistributed,
    partiallyDistributed,
    pending,
    percentDistributed,
  }
}
