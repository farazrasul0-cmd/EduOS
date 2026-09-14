import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  CertificateRecord,
  CertificateType,
  EducationBoard,
} from '@/lib/certificates'
import { generateCertificateSerial } from '@/lib/certificates'

const INITIAL_CERTIFICATES: CertificateRecord[] = [
  {
    id: 'CERT-2026-0001',
    serialNo: 'TC-2026-0001',
    certificateType: 'tc',
    studentId: 'STU-1001',
    studentName: 'Amina Begum',
    studentNameBn: 'আমিনা বেগম',
    fatherName: 'Md. Abdur Rahim',
    fatherNameBn: 'মো. আব্দুর রহিম',
    motherName: 'Rokeya Begum',
    motherNameBn: 'রোকেয়া বেগম',
    birthRegNo: '20122692019283719',
    dateOfBirth: '2012-05-14',
    className: 'Class 7',
    section: 'A',
    rollNo: '03',
    gender: 'female',
    issueDate: '2026-09-02',
    status: 'issued',
    admissionDate: '2023-01-10',
    dateOfLeaving: '2026-08-31',
    reasonForLeaving: "Father's employment transfer to Chattogram",
    conduct: 'Excellent',
    promotedToClass: 'Class 7 (Mid-session)',
    duesClearedUpTo: 'August 2026',
    remarks: 'Clearance certificate verified by accounts office.',
  },
  {
    id: 'CERT-2026-0002',
    serialNo: 'TC-2026-0002',
    certificateType: 'tc',
    studentId: 'STU-1002',
    studentName: 'Rafi Al-Hasan',
    studentNameBn: 'রাফি আল-হাসান',
    fatherName: 'Mahbubur Rahman',
    fatherNameBn: 'মাহবুবুর রহমান',
    motherName: 'Farhana Akhtar',
    motherNameBn: 'ফারহানা আক্তার',
    birthRegNo: '20132692019283720',
    dateOfBirth: '2013-08-20',
    className: 'Class 6',
    section: 'B',
    rollNo: '12',
    gender: 'male',
    issueDate: '2026-09-05',
    status: 'issued',
    admissionDate: '2024-01-08',
    dateOfLeaving: '2026-09-01',
    reasonForLeaving: 'Family relocation to Sylhet Division',
    conduct: 'Very Good',
    promotedToClass: 'Class 6 (Mid-session)',
    duesClearedUpTo: 'August 2026',
  },
  {
    id: 'CERT-2026-0003',
    serialNo: 'TST-2026-0001',
    certificateType: 'testimonial',
    studentId: 'STU-0901',
    studentName: 'Sabbir Hossain',
    studentNameBn: 'সাব্বির হোসেন',
    fatherName: 'Md. Shahidul Islam',
    fatherNameBn: 'মো. শহিদুল ইসলাম',
    motherName: 'Nasrin Sultana',
    motherNameBn: 'নাসরিন সুলতানা',
    birthRegNo: '20092692019283711',
    dateOfBirth: '2009-03-12',
    className: 'Class 10 (SSC 2026)',
    section: 'Science-A',
    rollNo: '01',
    gender: 'male',
    issueDate: '2026-08-15',
    status: 'issued',
    boardName: 'Dhaka',
    boardRollNo: '482910',
    boardRegNo: '2118392102',
    session: '2024-2025',
    passingYear: 2026,
    gpaAchieved: 5.0,
    gradeAchieved: 'A+',
    activities: 'Bangladesh Scouts (President Scout Awardee), Captain of School Cricket Team',
  },
  {
    id: 'CERT-2026-0004',
    serialNo: 'TST-2026-0002',
    certificateType: 'testimonial',
    studentId: 'STU-0902',
    studentName: 'Fatima Zahra',
    studentNameBn: 'ফাতিমা জাহরা',
    fatherName: 'Nurul Huda',
    fatherNameBn: 'নুরুল হুদা',
    motherName: 'Shamsun Nahar',
    motherNameBn: 'শামসুন নাহার',
    birthRegNo: '20092692019283712',
    dateOfBirth: '2009-11-25',
    className: 'Class 10 (SSC 2026)',
    section: 'Science-A',
    rollNo: '02',
    gender: 'female',
    issueDate: '2026-08-18',
    status: 'issued',
    boardName: 'Dhaka',
    boardRollNo: '482911',
    boardRegNo: '2118392103',
    session: '2024-2025',
    passingYear: 2026,
    gpaAchieved: 4.89,
    gradeAchieved: 'A',
    activities: 'Secretary of School Debating Club, Champion in Inter-School Math Olympiad',
  },
  {
    id: 'CERT-2026-0005',
    serialNo: 'BON-2026-0001',
    certificateType: 'bonafide',
    studentId: 'STU-1003',
    studentName: 'Tanvir Hasan',
    studentNameBn: 'তানভীর হাসান',
    fatherName: 'Golam Mostafa',
    fatherNameBn: 'গোলাম মোস্তফা',
    motherName: 'Salma Khatun',
    motherNameBn: 'সালমা খাতুন',
    birthRegNo: '20112692019283715',
    dateOfBirth: '2011-07-09',
    className: 'Class 8',
    section: 'A',
    rollNo: '05',
    gender: 'male',
    issueDate: '2026-09-08',
    status: 'issued',
    purpose: 'Bangladesh E-Passport Application & Biometric Enrollment',
    validUntil: '2026-12-31',
  },
  {
    id: 'CERT-2026-0006',
    serialNo: 'BON-2026-0002',
    certificateType: 'bonafide',
    studentId: 'STU-1004',
    studentName: 'Sadia Islam',
    studentNameBn: 'সাদিয়া ইসলাম',
    fatherName: 'Mominul Haque',
    fatherNameBn: 'মমিনুল হক',
    motherName: 'Rasheda Parvin',
    motherNameBn: 'রাশেদা পারভীন',
    birthRegNo: '20102692019283716',
    dateOfBirth: '2010-09-18',
    className: 'Class 9',
    section: 'Humanities',
    rollNo: '08',
    gender: 'female',
    issueDate: '2026-09-10',
    status: 'issued',
    purpose: 'Opening Student Savings Account at Dutch-Bangla Bank (School Banking)',
    validUntil: '2026-12-31',
  },
  {
    id: 'CERT-2026-0007',
    serialNo: 'TC-2026-0003',
    certificateType: 'tc',
    studentId: 'STU-1005',
    studentName: 'Mahir Faisal',
    studentNameBn: 'মাহির ফয়সাল',
    fatherName: 'Enamul Kabir',
    fatherNameBn: 'এনামুল কবির',
    motherName: 'Tahmina Akhtar',
    motherNameBn: 'তাহমিনা আক্তার',
    birthRegNo: '20142692019283725',
    dateOfBirth: '2014-02-14',
    className: 'Class 5',
    section: 'A',
    rollNo: '15',
    gender: 'male',
    issueDate: '2026-09-12',
    status: 'pending',
    admissionDate: '2022-01-10',
    dateOfLeaving: '2026-09-30',
    reasonForLeaving: 'Admission to Cadet Coaching Residential Academy',
    conduct: 'Good',
    promotedToClass: 'Class 5 (Mid-term completed)',
    duesClearedUpTo: 'September 2026',
  },
]

let certificatesStore: CertificateRecord[] = [...INITIAL_CERTIFICATES]

export function resetCertificatesStore(): void {
  certificatesStore = [...INITIAL_CERTIFICATES]
}

export const CERTIFICATE_KEYS = {
  all: ['certificates'] as const,
  list: () => [...CERTIFICATE_KEYS.all, 'list'] as const,
}

export function useCertificates() {
  return useQuery<CertificateRecord[]>({
    queryKey: CERTIFICATE_KEYS.list(),
    queryFn: async () => [...certificatesStore],
    initialData: () => [...certificatesStore],
    staleTime: 60 * 1000,
  })
}

export interface IssueCertificatePayload {
  certificateType: CertificateType
  studentId: string
  studentName: string
  studentNameBn?: string
  fatherName: string
  fatherNameBn?: string
  motherName: string
  motherNameBn?: string
  birthRegNo: string
  dateOfBirth: string
  className: string
  section: string
  rollNo: string
  gender: 'male' | 'female' | 'other'
  issueDate?: string

  // TC fields
  admissionDate?: string
  dateOfLeaving?: string
  reasonForLeaving?: string
  conduct?: 'Excellent' | 'Very Good' | 'Good' | 'Satisfactory'
  promotedToClass?: string
  duesClearedUpTo?: string

  // Testimonial fields
  boardName?: EducationBoard
  boardRollNo?: string
  boardRegNo?: string
  session?: string
  passingYear?: number
  gpaAchieved?: number
  gradeAchieved?: string
  activities?: string

  // Bonafide fields
  purpose?: string
  validUntil?: string
}

export function useIssueCertificate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: IssueCertificatePayload) => {
      const year = new Date().getFullYear()
      const typeCount = certificatesStore.filter(
        (c) => c.certificateType === payload.certificateType,
      ).length
      const serialNo = generateCertificateSerial(
        payload.certificateType,
        year,
        typeCount + 1,
      )

      const id = `CERT-${year}-${String(certificatesStore.length + 1).padStart(4, '0')}`

      const newRecord: CertificateRecord = {
        ...payload,
        id,
        serialNo,
        studentNameBn: payload.studentNameBn || payload.studentName,
        fatherNameBn: payload.fatherNameBn || payload.fatherName,
        motherNameBn: payload.motherNameBn || payload.motherName,
        issueDate: payload.issueDate || new Date().toISOString().slice(0, 10),
        status: 'issued',
      }

      certificatesStore = [newRecord, ...certificatesStore]
      return newRecord
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CERTIFICATE_KEYS.all })
    },
  })
}

export function useRevokeCertificate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const idx = certificatesStore.findIndex((c) => c.id === id)
      if (idx === -1) throw new Error('Certificate not found')

      certificatesStore[idx] = {
        ...certificatesStore[idx],
        status: 'revoked',
      }
      return certificatesStore[idx]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CERTIFICATE_KEYS.all })
    },
  })
}
