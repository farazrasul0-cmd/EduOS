import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  Book,
  BookLoan,
  NctbStudentDistribution,
  BorrowerType,
} from '@/lib/library'
import {
  generateAccessionNo,
  calculateOverdueDays,
  calculateLibraryFine,
  getNctbCurriculumBooks,
} from '@/lib/library'

const INITIAL_BOOKS: Book[] = [
  {
    id: 'book-1',
    schoolId: 'sch-1',
    accessionNo: 'ACC-FIC-0001',
    isbn: '978-984-502-001-2',
    title: 'Gitanjali',
    titleBn: 'গীতাঞ্জলি',
    author: 'Rabindranath Tagore',
    authorBn: 'রবীন্দ্রনাথ ঠাকুর',
    category: 'fiction',
    shelfLocation: 'Almirah A-1, Shelf 1',
    totalCopies: 5,
    availableCopies: 4,
    publicationYear: '1910',
    language: 'bengali',
  },
  {
    id: 'book-2',
    schoolId: 'sch-1',
    accessionNo: 'ACC-FIC-0002',
    isbn: '978-984-502-002-9',
    title: 'Sanchita',
    titleBn: 'সঞ্চিতা',
    author: 'Kazi Nazrul Islam',
    authorBn: 'কাজী নজরুল ইসলাম',
    category: 'fiction',
    shelfLocation: 'Almirah A-1, Shelf 2',
    totalCopies: 4,
    availableCopies: 4,
    publicationYear: '1928',
    language: 'bengali',
  },
  {
    id: 'book-3',
    schoolId: 'sch-1',
    accessionNo: 'ACC-FIC-0003',
    isbn: '978-984-502-003-6',
    title: 'Shonkhonil Karagar',
    titleBn: 'শঙ্খনীল কারাগার',
    author: 'Humayun Ahmed',
    authorBn: 'হুমায়ূন আহমেদ',
    category: 'fiction',
    shelfLocation: 'Almirah A-2, Shelf 3',
    totalCopies: 6,
    availableCopies: 5,
    publicationYear: '1973',
    language: 'bengali',
  },
  {
    id: 'book-4',
    schoolId: 'sch-1',
    accessionNo: 'ACC-SCI-0004',
    isbn: '978-984-502-004-3',
    title: 'Dipu Number Two',
    titleBn: 'দীপু নাম্বার টু',
    author: 'Muhammad Zafar Iqbal',
    authorBn: 'মুহম্মদ জাফর ইকবাল',
    category: 'science',
    shelfLocation: 'Almirah B-1, Shelf 2',
    totalCopies: 4,
    availableCopies: 3,
    publicationYear: '1984',
    language: 'bengali',
  },
  {
    id: 'book-5',
    schoolId: 'sch-1',
    accessionNo: 'ACC-OLY-0005',
    isbn: '978-984-502-005-0',
    title: 'Gonit Shomoshya O Shomadhan',
    titleBn: 'গণিত অলিম্পিয়াড সমস্যা ও সমাধান',
    author: 'Munir Hasan',
    authorBn: 'মুনির হাসান',
    category: 'olympiad',
    shelfLocation: 'Almirah C-1, Shelf 1',
    totalCopies: 3,
    availableCopies: 2,
    publicationYear: '2020',
    language: 'bengali',
  },
  {
    id: 'book-6',
    schoolId: 'sch-1',
    accessionNo: 'ACC-REF-0006',
    isbn: '978-019-479-900-3',
    title: "Oxford Advanced Learner's Dictionary",
    titleBn: 'অক্সফোর্ড অ্যাডভান্সড লার্নার্স ডিকশনারি',
    author: 'A. S. Hornby',
    authorBn: 'এ. এস. হর্নবি',
    category: 'reference',
    shelfLocation: 'Reference Desk R-1',
    totalCopies: 2,
    availableCopies: 2,
    publicationYear: '2022',
    language: 'english',
  },
]

const INITIAL_LOANS: BookLoan[] = [
  {
    id: 'loan-1',
    bookId: 'book-4',
    bookTitle: 'Dipu Number Two',
    borrowerType: 'student',
    borrowerId: 'stu-1',
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
  {
    id: 'loan-2',
    bookId: 'book-1',
    bookTitle: 'Gitanjali',
    borrowerType: 'student',
    borrowerId: 'stu-2',
    borrowerName: 'Sadia Sultana',
    borrowerRollOrDesignation: '02',
    borrowerClass: 'Class 7-A',
    borrowerPhone: '01819556677',
    issueDate: '2026-09-05',
    dueDate: '2026-09-19',
    status: 'issued',
    fineAccrued: 0,
    finePaid: false,
  },
  {
    id: 'loan-3',
    bookId: 'book-5',
    bookTitle: 'Gonit Shomoshya O Shomadhan',
    borrowerType: 'student',
    borrowerId: 'stu-3',
    borrowerName: 'Sourav Roy',
    borrowerRollOrDesignation: '03',
    borrowerClass: 'Class 8-A',
    borrowerPhone: '01912334455',
    issueDate: '2026-08-10',
    dueDate: '2026-08-24',
    status: 'overdue',
    fineAccrued: 42,
    finePaid: false,
  },
  {
    id: 'loan-4',
    bookId: 'book-3',
    bookTitle: 'Shonkhonil Karagar',
    borrowerType: 'teacher',
    borrowerId: 'tch-1',
    borrowerName: 'Shamim Reza',
    borrowerRollOrDesignation: 'Senior Teacher (Bangla)',
    borrowerPhone: '01715998811',
    issueDate: '2026-08-01',
    dueDate: '2026-09-01',
    returnDate: '2026-08-28',
    status: 'returned',
    fineAccrued: 0,
    finePaid: true,
  },
]

const INITIAL_DISTRIBUTIONS: NctbStudentDistribution[] = [
  {
    id: 'dist-1',
    academicYear: '2026',
    classId: 'c-6',
    className: 'Class 6-A',
    studentId: 's-601',
    studentName: 'Zubair Al Mahfuz',
    studentNameBn: 'জুবায়ের আল মাহফুজ',
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
    distributionDate: '2026-01-01',
  },
  {
    id: 'dist-2',
    academicYear: '2026',
    classId: 'c-6',
    className: 'Class 6-A',
    studentId: 's-602',
    studentName: 'Sumaiya Akter',
    studentNameBn: 'সুমাইয়া আক্তার',
    rollNo: '02',
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
    distributionDate: '2026-01-01',
  },
  {
    id: 'dist-3',
    academicYear: '2026',
    classId: 'c-6',
    className: 'Class 6-A',
    studentId: 's-603',
    studentName: 'Fatima Nawar',
    studentNameBn: 'ফাতিমা নাওয়ার',
    rollNo: '03',
    distributedSubjectKeys: [
      'bangla_lit',
      'english',
      'math',
      'science',
    ],
    guardianSigned: false,
    distributionDate: '2026-01-02',
  },
  {
    id: 'dist-4',
    academicYear: '2026',
    classId: 'c-7',
    className: 'Class 7-A',
    studentId: 's-701',
    studentName: 'Tanvir Ahmed',
    studentNameBn: 'তানভীর আহমেদ',
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
    distributionDate: '2026-01-01',
  },
  {
    id: 'dist-5',
    academicYear: '2026',
    classId: 'c-7',
    className: 'Class 7-A',
    studentId: 's-702',
    studentName: 'Sadia Sultana',
    studentNameBn: 'সাদিয়া সুলতানা',
    rollNo: '02',
    distributedSubjectKeys: [
      'bangla_lit',
      'english',
      'math',
    ],
    guardianSigned: false,
    distributionDate: '2026-01-03',
  },
]

let booksStore: Book[] = [...INITIAL_BOOKS]
let loansStore: BookLoan[] = [...INITIAL_LOANS]
let nctbStore: NctbStudentDistribution[] = [...INITIAL_DISTRIBUTIONS]

export function resetLibraryStore() {
  booksStore = [...INITIAL_BOOKS]
  loansStore = [...INITIAL_LOANS]
  nctbStore = [...INITIAL_DISTRIBUTIONS]
}

// -------------------------------------------------------------
// Book Catalog Queries & Mutations
// -------------------------------------------------------------
export function useBooks() {
  return useQuery({
    queryKey: ['library_books'],
    queryFn: async (): Promise<Book[]> => {
      return [...booksStore]
    },
    initialData: () => [...booksStore],
  })
}

export function useAddBook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      input: Omit<Book, 'id' | 'accessionNo' | 'availableCopies'>,
    ): Promise<Book> => {
      const nextSeq = booksStore.length + 1
      const accession = generateAccessionNo(input.category, nextSeq)
      const newBook: Book = {
        ...input,
        id: `book-${Date.now()}`,
        accessionNo: accession,
        availableCopies: input.totalCopies,
      }
      booksStore = [newBook, ...booksStore]
      return newBook
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['library_books'] })
    },
  })
}

// -------------------------------------------------------------
// Circulation & Loans Queries & Mutations
// -------------------------------------------------------------
export function useBookLoans() {
  return useQuery({
    queryKey: ['library_loans'],
    queryFn: async (): Promise<BookLoan[]> => {
      // Recalculate fines on fresh read
      return loansStore.map((loan) => {
        if (loan.status === 'issued') {
          const days = calculateOverdueDays(loan.dueDate)
          if (days > 0) {
            return {
              ...loan,
              status: 'overdue',
              fineAccrued: calculateLibraryFine(loan.dueDate),
            }
          }
        }
        return loan
      })
    },
    initialData: () => [...loansStore],
  })
}

export function useIssueBook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      bookId: string
      borrowerType: BorrowerType
      borrowerId: string
      borrowerName: string
      borrowerRollOrDesignation: string
      borrowerClass?: string
      borrowerPhone?: string
      loanDays?: number
    }): Promise<BookLoan> => {
      const targetBook = booksStore.find((b) => b.id === payload.bookId)
      if (!targetBook) throw new Error('Book not found')
      if (targetBook.availableCopies <= 0) throw new Error('No copies available')

      const loanDays = payload.loanDays ?? (payload.borrowerType === 'teacher' ? 30 : 14)
      const now = new Date()
      const due = new Date(now)
      due.setDate(now.getDate() + loanDays)

      const issueDate = now.toISOString().slice(0, 10)
      const dueDate = due.toISOString().slice(0, 10)

      const newLoan: BookLoan = {
        id: `loan-${Date.now()}`,
        bookId: targetBook.id,
        bookTitle: targetBook.title,
        borrowerType: payload.borrowerType,
        borrowerId: payload.borrowerId,
        borrowerName: payload.borrowerName,
        borrowerRollOrDesignation: payload.borrowerRollOrDesignation,
        borrowerClass: payload.borrowerClass,
        borrowerPhone: payload.borrowerPhone,
        issueDate,
        dueDate,
        status: 'issued',
        fineAccrued: 0,
        finePaid: false,
      }

      // Decrement copy
      booksStore = booksStore.map((b) =>
        b.id === targetBook.id ? { ...b, availableCopies: Math.max(0, b.availableCopies - 1) } : b,
      )
      loansStore = [newLoan, ...loansStore]

      return newLoan
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['library_loans'] })
      void qc.invalidateQueries({ queryKey: ['library_books'] })
    },
  })
}

export function useReturnBook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { loanId: string; finePaid?: boolean; waiveFine?: boolean }) => {
      const loan = loansStore.find((l) => l.id === payload.loanId)
      if (!loan) throw new Error('Loan not found')

      const returnDate = new Date().toISOString().slice(0, 10)

      loansStore = loansStore.map((l) => {
        if (l.id !== payload.loanId) return l
        return {
          ...l,
          status: 'returned',
          returnDate,
          finePaid: payload.waiveFine ? true : payload.finePaid ?? l.finePaid,
          fineWaived: payload.waiveFine ?? false,
        }
      })

      // Restore book copy
      booksStore = booksStore.map((b) =>
        b.id === loan.bookId ? { ...b, availableCopies: Math.min(b.totalCopies, b.availableCopies + 1) } : b,
      )
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['library_loans'] })
      void qc.invalidateQueries({ queryKey: ['library_books'] })
    },
  })
}

export function useRenewBook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (loanId: string) => {
      const loan = loansStore.find((l) => l.id === loanId)
      if (!loan) throw new Error('Loan not found')

      const currentDue = new Date(loan.dueDate)
      currentDue.setDate(currentDue.getDate() + 14)
      const newDue = currentDue.toISOString().slice(0, 10)

      loansStore = loansStore.map((l) =>
        l.id === loanId ? { ...l, dueDate: newDue, status: 'issued', fineAccrued: 0 } : l,
      )
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['library_loans'] })
    },
  })
}

export function useSettleFine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { loanId: string; waive?: boolean }) => {
      loansStore = loansStore.map((l) => {
        if (l.id !== payload.loanId) return l
        return {
          ...l,
          finePaid: true,
          fineWaived: payload.waive ?? false,
        }
      })
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['library_loans'] })
    },
  })
}

// -------------------------------------------------------------
// NCTB Free Textbook Distribution Queries & Mutations
// -------------------------------------------------------------
export function useNctbDistributions() {
  return useQuery({
    queryKey: ['nctb_distributions'],
    queryFn: async (): Promise<NctbStudentDistribution[]> => {
      return [...nctbStore]
    },
    initialData: () => [...nctbStore],
  })
}

export function useToggleNctbSubject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { distributionId: string; subjectKey: string }) => {
      nctbStore = nctbStore.map((item) => {
        if (item.id !== payload.distributionId) return item
        const exists = item.distributedSubjectKeys.includes(payload.subjectKey)
        const updatedKeys = exists
          ? item.distributedSubjectKeys.filter((k) => k !== payload.subjectKey)
          : [...item.distributedSubjectKeys, payload.subjectKey]

        return {
          ...item,
          distributedSubjectKeys: updatedKeys,
          distributionDate: new Date().toISOString().slice(0, 10),
        }
      })
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['nctb_distributions'] })
    },
  })
}

export function useDistributeAllToClass() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (className: string) => {
      const curriculum = getNctbCurriculumBooks(className)
      const allKeys = curriculum.map((c) => c.subjectKey)
      const today = new Date().toISOString().slice(0, 10)

      nctbStore = nctbStore.map((item) => {
        if (item.className !== className) return item
        return {
          ...item,
          distributedSubjectKeys: [...allKeys],
          guardianSigned: true,
          distributionDate: today,
        }
      })
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['nctb_distributions'] })
    },
  })
}
