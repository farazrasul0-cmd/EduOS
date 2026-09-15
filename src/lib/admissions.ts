export type AdmissionStatus =
  | 'submitted'
  | 'under_review'
  | 'shortlisted'
  | 'admitted'
  | 'rejected'

export type Gender = 'male' | 'female' | 'other'
export type Religion = 'islam' | 'hinduism' | 'buddhism' | 'christianity' | 'other'

export const ADMISSION_CLASSES = [
  'Playgroup',
  'Nursery',
  'KG',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
] as const

export interface AdmissionApplicant {
  id: string
  schoolId: string
  applicationNo: string
  studentName: string
  studentNameBn?: string
  gender: Gender
  dob: string
  religion: Religion
  bloodGroup?: string
  appliedClass: string
  academicYear: string
  previousSchool?: string
  previousGpa?: string
  guardianName: string
  guardianPhone: string
  guardianEmail?: string
  guardianOccupation?: string
  presentAddress: string
  birthCertificateNo: string
  status: AdmissionStatus
  examRollNo?: string
  examDate?: string
  examVenue?: string
  admissionFee: number
  appliedAt: string
}

/**
 * Generates an authentic, structured application token (e.g. ADM-2026-0105).
 */
export function generateApplicationNo(
  year: string | number = new Date().getFullYear(),
  sequence: number = 1,
): string {
  const seqPad = String(sequence).padStart(4, '0')
  return `ADM-${year}-${seqPad}`
}

/**
 * Generates an admission test roll number (e.g. EXM-7015).
 */
export function generateExamRollNo(
  classIdentifier: string | number = '6',
  sequence: number = 1,
): string {
  const cleanClass = String(classIdentifier).replace(/[^0-9]/g, '') || '1'
  const seqPad = String(sequence).padStart(3, '0')
  return `EXM-${cleanClass}${seqPad}`
}

/**
 * Validates 17-digit Bangladesh Digital Birth Registration Certificate Number.
 * Bangladesh Government BTRC/BRIS standard requires exactly 17 numeric digits.
 */
export function validateBirthCertificate(no?: string | null): boolean {
  if (!no) return false
  const clean = no.trim()
  return /^\d{17}$/.test(clean)
}

/**
 * Validates Bangladeshi mobile phone numbers (+8801XXXXXXXXX or 01XXXXXXXXX).
 */
export function validateBangladeshPhone(phone?: string | null): boolean {
  if (!phone) return false
  const clean = phone.trim().replace(/[\s-]/g, '')
  return /^(?:\+?88)?01[3-9]\d{8}$/.test(clean)
}

/**
 * Generates BTRC-compliant bilingual SMS messages for admissions milestones.
 */
export function generateAdmissionSmsText(
  applicant: AdmissionApplicant,
  schoolName: string,
  status: AdmissionStatus,
  lang: 'en' | 'bn' = 'en',
): string {
  const school = schoolName.slice(0, 24)
  const student = applicant.studentName.slice(0, 20)

  if (lang === 'bn') {
    switch (status) {
      case 'submitted':
        return `${school}: ${student}-এর ${applicant.appliedClass}-এ ভর্তির আবেদন (${applicant.applicationNo}) সফলভাবে গৃহীত হয়েছে। আপডেট জানতে ভিজিট করুন: eduos.app/apply`
      case 'shortlisted':
        return `${school}: ${student} ভর্তি পরীক্ষার জন্য নির্বাচিত হয়েছে! রোল: ${applicant.examRollNo || 'N/A'}, তারিখ: ${applicant.examDate || '2026-11-20'}, কেন্দ্র: ${applicant.examVenue || 'Main Campus'}। প্রবেশপত্র সঙ্গে আনুন।`
      case 'admitted':
        return `${school}: অভিনন্দন! ${student} ${applicant.appliedClass}-এ ভর্তির জন্য চূড়ান্তভাবে মনোনীত হয়েছে। ভর্তি ফি ৳${applicant.admissionFee.toLocaleString('en-IN')} পরিশোধের ভাউচার সংগ্রহ করুন।`
      case 'rejected':
        return `${school}: দুঃখিত, আসন স্বল্পতার কারণে ${student}-এর ${applicant.appliedClass}-এ আবেদনটি এই সেশনের জন্য বিবেচনা করা সম্ভব হচ্ছে না। শুভকামনা।`
      default:
        return `${school}: আপনার আবেদন (${applicant.applicationNo}) প্রক্রিয়াধীন রয়েছে।`
    }
  }

  // English
  switch (status) {
    case 'submitted':
      return `${school}: Application ${applicant.applicationNo} for ${student} (${applicant.appliedClass}) has been received. Track updates at eduos.app/apply.`
    case 'shortlisted':
      return `${school}: ${student} is shortlisted for admission test! Roll: ${applicant.examRollNo || 'N/A'}, Date: ${applicant.examDate || '2026-11-20'}, Venue: ${applicant.examVenue || 'Main Campus'}. Bring printed admit card.`
    case 'admitted':
      return `${school}: Congratulations! ${student} is selected for admission into ${applicant.appliedClass}. Admission fee: BDT ${applicant.admissionFee.toLocaleString('en-US')}. Please collect fee voucher.`
    case 'rejected':
      return `${school}: Regretfully, due to limited seats, application ${applicant.applicationNo} for ${student} could not be accommodated for this session.`
    default:
      return `${school}: Application ${applicant.applicationNo} is currently under review.`
  }
}
