import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AdmissionApplicant, AdmissionStatus } from '@/lib/admissions'
import { generateApplicationNo, generateExamRollNo } from '@/lib/admissions'

// Initial pre-populated applicants representing typical Bangladeshi school applications
const INITIAL_ADMISSIONS: AdmissionApplicant[] = [
  {
    id: 'adm-1',
    schoolId: 'sch-1',
    applicationNo: 'ADM-2026-0001',
    studentName: 'Zubair Al Mahfuz',
    studentNameBn: 'জুবায়ের আল মাহফুজ',
    gender: 'male',
    dob: '2014-04-12',
    religion: 'islam',
    bloodGroup: 'B+',
    appliedClass: 'Class 6',
    academicYear: '2026',
    previousSchool: 'Dhanmondi Govt. Boys High School',
    previousGpa: '4.85',
    guardianName: 'Dr. Mahfuzur Rahman',
    guardianPhone: '+880 1711-223344',
    guardianEmail: 'mahfuz.rahman@gmail.com',
    guardianOccupation: 'Doctor / Physician',
    presentAddress: 'Road 8/A, Dhanmondi R/A, Dhaka-1209',
    birthCertificateNo: '20142692518012345',
    status: 'admitted',
    examRollNo: 'EXM-6001',
    examDate: '2026-11-20',
    examVenue: 'Main Academic Building, Room 302',
    admissionFee: 6500,
    appliedAt: '2026-09-01T10:30:00Z',
  },
  {
    id: 'adm-2',
    schoolId: 'sch-1',
    applicationNo: 'ADM-2026-0002',
    studentName: 'Sumaiya Akter',
    studentNameBn: 'সুমাইয়া আক্তার',
    gender: 'female',
    dob: '2013-09-18',
    religion: 'islam',
    bloodGroup: 'A+',
    appliedClass: 'Class 7',
    academicYear: '2026',
    previousSchool: 'Agrani School & College, Azimpur',
    previousGpa: '5.00',
    guardianName: 'Md. Shahidul Islam',
    guardianPhone: '+880 1819-556677',
    guardianEmail: 'shahidul.islam@yahoo.com',
    guardianOccupation: 'Government Service',
    presentAddress: '45 Azimpur Estate, Dhaka-1205',
    birthCertificateNo: '20132692518067890',
    status: 'shortlisted',
    examRollNo: 'EXM-7002',
    examDate: '2026-11-20',
    examVenue: 'Auditorium Hall-1',
    admissionFee: 6500,
    appliedAt: '2026-09-03T14:15:00Z',
  },
  {
    id: 'adm-3',
    schoolId: 'sch-1',
    applicationNo: 'ADM-2026-0003',
    studentName: 'Sourav Roy',
    studentNameBn: 'সৌরভ রায়',
    gender: 'male',
    dob: '2012-06-25',
    religion: 'hinduism',
    bloodGroup: 'O+',
    appliedClass: 'Class 8',
    academicYear: '2026',
    previousSchool: 'Pogose Laboratory School',
    previousGpa: '4.60',
    guardianName: 'Bikash Chandra Roy',
    guardianPhone: '+880 1912-334455',
    guardianEmail: 'bikash.roy@gmail.com',
    guardianOccupation: 'Businessman',
    presentAddress: '12 Shankhari Bazar, Kotwali, Dhaka',
    birthCertificateNo: '20122692518099887',
    status: 'under_review',
    admissionFee: 7000,
    appliedAt: '2026-09-05T09:00:00Z',
  },
  {
    id: 'adm-4',
    schoolId: 'sch-1',
    applicationNo: 'ADM-2026-0004',
    studentName: 'Fatima Nawar',
    studentNameBn: 'ফাতিমা নাওয়ার',
    gender: 'female',
    dob: '2014-11-02',
    religion: 'islam',
    bloodGroup: 'AB+',
    appliedClass: 'Class 6',
    academicYear: '2026',
    previousSchool: 'Willes Little Flower School',
    previousGpa: '4.90',
    guardianName: 'Engr. Enamul Haque',
    guardianPhone: '+880 1715-998811',
    guardianEmail: 'enamul.haque@gmail.com',
    guardianOccupation: 'Civil Engineer',
    presentAddress: 'Kakrail Officers Colony, Dhaka',
    birthCertificateNo: '20142692518044332',
    status: 'submitted',
    admissionFee: 6500,
    appliedAt: '2026-09-08T11:45:00Z',
  },
]

let admissionsStore: AdmissionApplicant[] = [...INITIAL_ADMISSIONS]

export function resetAdmissionsStore() {
  admissionsStore = [...INITIAL_ADMISSIONS]
}

export function useAdmissions() {
  return useQuery({
    queryKey: ['admissions'],
    queryFn: async (): Promise<AdmissionApplicant[]> => {
      return [...admissionsStore]
    },
    initialData: () => [...admissionsStore],
  })
}

export function useSubmitAdmission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      input: Omit<AdmissionApplicant, 'id' | 'applicationNo' | 'status' | 'appliedAt' | 'admissionFee'>,
    ): Promise<AdmissionApplicant> => {
      const nextSeq = admissionsStore.length + 1
      const appNo = generateApplicationNo(input.academicYear || '2026', nextSeq)
      const newApplicant: AdmissionApplicant = {
        ...input,
        id: `adm-${Date.now()}`,
        applicationNo: appNo,
        status: 'submitted',
        appliedAt: new Date().toISOString(),
        admissionFee: 6500,
      }
      admissionsStore = [newApplicant, ...admissionsStore]
      return newApplicant
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admissions'] })
    },
  })
}

export function useUpdateAdmissionStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      id: string
      status: AdmissionStatus
      examRollNo?: string
      examDate?: string
      examVenue?: string
    }) => {
      admissionsStore = admissionsStore.map((app) => {
        if (app.id !== payload.id) return app
        const roll =
          payload.status === 'shortlisted' && !app.examRollNo
            ? generateExamRollNo(app.appliedClass, admissionsStore.indexOf(app) + 1)
            : payload.examRollNo ?? app.examRollNo

        return {
          ...app,
          status: payload.status,
          examRollNo: roll,
          examDate: payload.examDate ?? app.examDate ?? '2026-11-20',
          examVenue: payload.examVenue ?? app.examVenue ?? 'Main Campus, Room 302',
        }
      })
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admissions'] })
    },
  })
}

export function useEnrollApplicant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (applicantId: string) => {
      const applicant = admissionsStore.find((a) => a.id === applicantId)
      if (!applicant) throw new Error('Applicant not found')
      // Mark applicant status as admitted
      admissionsStore = admissionsStore.map((a) =>
        a.id === applicantId ? { ...a, status: 'admitted' } : a,
      )
      return applicant
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admissions'] })
      void qc.invalidateQueries({ queryKey: ['students'] })
    },
  })
}
