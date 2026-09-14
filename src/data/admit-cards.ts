import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  AdmitCardCandidate,
  ExamHall,
  ExamSubjectSchedule,
  BenchAllocation,
} from '@/lib/admit-card'
import { generateAdmitCardNo, generateZigzagSeatPlan } from '@/lib/admit-card'

export interface ExamSession {
  id: string
  title: string
  academicYear: string
  term: string
  startDate: string
  endDate: string
}

const INITIAL_SESSIONS: ExamSession[] = [
  {
    id: 'SESSION-2026-HY',
    title: 'Half-Yearly Examination 2026',
    academicYear: '2026',
    term: 'Half-Yearly',
    startDate: '2026-06-15',
    endDate: '2026-06-28',
  },
  {
    id: 'SESSION-2026-ANNUAL',
    title: 'Annual Final Examination 2026',
    academicYear: '2026',
    term: 'Annual',
    startDate: '2026-11-20',
    endDate: '2026-12-05',
  },
]

const DEFAULT_SUBJECTS: ExamSubjectSchedule[] = [
  {
    subjectCode: '101',
    subjectName: 'Bangla 1st Paper',
    examDate: '2026-06-15',
    dayOfWeek: 'Monday',
    timeSlot: '10:00 AM - 1:00 PM',
    totalMarks: 100,
    room: 'Room 101',
  },
  {
    subjectCode: '102',
    subjectName: 'Bangla 2nd Paper',
    examDate: '2026-06-17',
    dayOfWeek: 'Wednesday',
    timeSlot: '10:00 AM - 1:00 PM',
    totalMarks: 100,
    room: 'Room 101',
  },
  {
    subjectCode: '107',
    subjectName: 'English 1st Paper',
    examDate: '2026-06-20',
    dayOfWeek: 'Saturday',
    timeSlot: '10:00 AM - 1:00 PM',
    totalMarks: 100,
    room: 'Room 101',
  },
  {
    subjectCode: '109',
    subjectName: 'Mathematics',
    examDate: '2026-06-23',
    dayOfWeek: 'Tuesday',
    timeSlot: '10:00 AM - 1:00 PM',
    totalMarks: 100,
    room: 'Room 101',
  },
  {
    subjectCode: '127',
    subjectName: 'General Science',
    examDate: '2026-06-25',
    dayOfWeek: 'Thursday',
    timeSlot: '10:00 AM - 1:00 PM',
    totalMarks: 100,
    room: 'Room 101',
  },
  {
    subjectCode: '150',
    subjectName: 'Bangladesh & Global Studies',
    examDate: '2026-06-28',
    dayOfWeek: 'Sunday',
    timeSlot: '10:00 AM - 1:00 PM',
    totalMarks: 100,
    room: 'Room 101',
  },
]

const INITIAL_HALLS: ExamHall[] = [
  {
    id: 'HALL-101',
    roomName: 'Room 101 (Main Building)',
    building: 'Academic Bhaban',
    floor: 1,
    totalBenches: 15,
    seatsPerBench: 2,
    invigilatorName: 'Md. Nazmul Huda (Senior Teacher, English)',
    invigilatorPhone: '01711223344',
  },
  {
    id: 'HALL-102',
    roomName: 'Room 102 (Main Building)',
    building: 'Academic Bhaban',
    floor: 1,
    totalBenches: 15,
    seatsPerBench: 2,
    invigilatorName: 'Fatema Khatun (Assistant Teacher, Math)',
    invigilatorPhone: '01711223355',
  },
  {
    id: 'HALL-201',
    roomName: 'Room 201 (Science Lab Block)',
    building: 'Science Bhaban',
    floor: 2,
    totalBenches: 20,
    seatsPerBench: 2,
    invigilatorName: 'Kabir Ahmed (Lecturer, Physics)',
    invigilatorPhone: '01711223366',
  },
]

const INITIAL_CANDIDATES: AdmitCardCandidate[] = [
  {
    id: 'CAND-01',
    admitCardNo: generateAdmitCardNo(2026, 1),
    studentId: 'STU-1001',
    studentName: 'Amina Begum',
    studentNameBn: 'আমিনা বেগম',
    className: 'Class 7',
    section: 'A',
    rollNo: '01',
    gender: 'female',
    guardianName: 'Md. Abdur Rahim',
    guardianPhone: '01711000001',
    feeDueAmount: 0,
    clearanceStatus: 'cleared',
    examTitle: 'Half-Yearly Examination 2026',
    academicYear: '2026',
    subjects: DEFAULT_SUBJECTS,
  },
  {
    id: 'CAND-02',
    admitCardNo: generateAdmitCardNo(2026, 2),
    studentId: 'STU-1002',
    studentName: 'Sabbir Hossain',
    studentNameBn: 'সাব্বির হোসেন',
    className: 'Class 10',
    section: 'Science-A',
    rollNo: '01',
    gender: 'male',
    group: 'Science',
    guardianName: 'Md. Shahidul Islam',
    guardianPhone: '01711000002',
    feeDueAmount: 0,
    clearanceStatus: 'cleared',
    examTitle: 'Half-Yearly Examination 2026',
    academicYear: '2026',
    subjects: DEFAULT_SUBJECTS,
  },
  {
    id: 'CAND-03',
    admitCardNo: generateAdmitCardNo(2026, 3),
    studentId: 'STU-1003',
    studentName: 'Tanvir Hasan',
    studentNameBn: 'তানভীর হাসান',
    className: 'Class 8',
    section: 'A',
    rollNo: '05',
    gender: 'male',
    guardianName: 'Golam Mostafa',
    guardianPhone: '01711000003',
    feeDueAmount: 2500,
    clearanceStatus: 'withheld',
    examTitle: 'Half-Yearly Examination 2026',
    academicYear: '2026',
    subjects: DEFAULT_SUBJECTS,
  },
  {
    id: 'CAND-04',
    admitCardNo: generateAdmitCardNo(2026, 4),
    studentId: 'STU-1004',
    studentName: 'Fatima Zahra',
    studentNameBn: 'ফাতিমা জাহরা',
    className: 'Class 10',
    section: 'Science-A',
    rollNo: '02',
    gender: 'female',
    group: 'Science',
    guardianName: 'Nurul Huda',
    guardianPhone: '01711000004',
    feeDueAmount: 0,
    clearanceStatus: 'cleared',
    examTitle: 'Half-Yearly Examination 2026',
    academicYear: '2026',
    subjects: DEFAULT_SUBJECTS,
  },
  {
    id: 'CAND-05',
    admitCardNo: generateAdmitCardNo(2026, 5),
    studentId: 'STU-1005',
    studentName: 'Mahir Faisal',
    studentNameBn: 'মাহির ফয়সাল',
    className: 'Class 9',
    section: 'A',
    rollNo: '04',
    gender: 'male',
    group: 'Business Studies',
    guardianName: 'Kamal Hossain',
    guardianPhone: '01711000005',
    feeDueAmount: 1800,
    clearanceStatus: 'overridden',
    overrideRemarks: 'Fee payment installment authorized by Principal',
    overriddenBy: 'Prof. Anisur Rahman',
    examTitle: 'Half-Yearly Examination 2026',
    academicYear: '2026',
    subjects: DEFAULT_SUBJECTS,
  },
  {
    id: 'CAND-06',
    admitCardNo: generateAdmitCardNo(2026, 6),
    studentId: 'STU-1006',
    studentName: 'Sumaiya Akter',
    studentNameBn: 'সুমাইয়া আক্তার',
    className: 'Class 9',
    section: 'A',
    rollNo: '08',
    gender: 'female',
    group: 'Humanities',
    guardianName: 'Mominul Haque',
    guardianPhone: '01711000006',
    feeDueAmount: 0,
    clearanceStatus: 'cleared',
    examTitle: 'Half-Yearly Examination 2026',
    academicYear: '2026',
    subjects: DEFAULT_SUBJECTS,
  },
]

// In-Memory Reactive Store
let sessionsState: ExamSession[] = [...INITIAL_SESSIONS]
let candidatesState: AdmitCardCandidate[] = [...INITIAL_CANDIDATES]
let hallsState: ExamHall[] = [...INITIAL_HALLS]
let seatPlanAllocations: BenchAllocation[] = []

export function resetAdmitCardStore() {
  sessionsState = [...INITIAL_SESSIONS]
  candidatesState = [...INITIAL_CANDIDATES]
  hallsState = [...INITIAL_HALLS]
  seatPlanAllocations = []
}

export function useAdmitCardSessions() {
  return useQuery({
    queryKey: ['admit-card-sessions'],
    queryFn: async (): Promise<ExamSession[]> => {
      return [...sessionsState]
    },
    initialData: () => [...sessionsState],
  })
}

export function useAdmitCardCandidates(selectedClass = 'all') {
  return useQuery({
    queryKey: ['admit-card-candidates', selectedClass],
    queryFn: async (): Promise<AdmitCardCandidate[]> => {
      if (selectedClass === 'all') return [...candidatesState]
      return candidatesState.filter((c) => c.className === selectedClass)
    },
    initialData: () =>
      selectedClass === 'all'
        ? [...candidatesState]
        : candidatesState.filter((c) => c.className === selectedClass),
  })
}

export function useExamHalls() {
  return useQuery({
    queryKey: ['exam-halls'],
    queryFn: async (): Promise<ExamHall[]> => {
      return [...hallsState]
    },
    initialData: () => [...hallsState],
  })
}

export function useSeatPlanAllocations() {
  return useQuery({
    queryKey: ['seat-plan-allocations'],
    queryFn: async (): Promise<BenchAllocation[]> => {
      if (seatPlanAllocations.length === 0) {
        // Automatically generate initial seat plan
        const result = generateZigzagSeatPlan(hallsState, candidatesState)
        seatPlanAllocations = result.allocations
      }
      return [...seatPlanAllocations]
    },
    initialData: () => {
      if (seatPlanAllocations.length === 0) {
        const result = generateZigzagSeatPlan(hallsState, candidatesState)
        seatPlanAllocations = result.allocations
      }
      return [...seatPlanAllocations]
    },
  })
}

export interface OverrideClearanceInput {
  candidateId: string
  remarks: string
  authorizedBy: string
}

export function useOverrideFeeClearance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: OverrideClearanceInput) => {
      const idx = candidatesState.findIndex((c) => c.id === input.candidateId)
      if (idx !== -1) {
        candidatesState[idx] = {
          ...candidatesState[idx],
          clearanceStatus: 'overridden',
          overrideRemarks: input.remarks,
          overriddenBy: input.authorizedBy,
        }
      }
      return candidatesState[idx]
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admit-card-candidates'] })
    },
  })
}

export function useGenerateSeatPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const result = generateZigzagSeatPlan(hallsState, candidatesState)
      seatPlanAllocations = result.allocations
      return result
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['seat-plan-allocations'] })
    },
  })
}
