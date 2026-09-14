export type CertificateType = 'tc' | 'testimonial' | 'bonafide'
export type CertificateStatus = 'issued' | 'pending' | 'revoked'

export type EducationBoard =
  | 'Dhaka'
  | 'Rajshahi'
  | 'Cumilla'
  | 'Jashore'
  | 'Chattogram'
  | 'Barishal'
  | 'Sylhet'
  | 'Dinajpur'
  | 'Mymensingh'
  | 'Madrasah'
  | 'Technical'

export const EDUCATION_BOARDS: EducationBoard[] = [
  'Dhaka',
  'Rajshahi',
  'Cumilla',
  'Jashore',
  'Chattogram',
  'Barishal',
  'Sylhet',
  'Dinajpur',
  'Mymensingh',
  'Madrasah',
  'Technical',
]

export interface CertificateRecord {
  id: string
  serialNo: string
  certificateType: CertificateType
  studentId: string
  studentName: string
  studentNameBn: string
  fatherName: string
  fatherNameBn: string
  motherName: string
  motherNameBn: string
  birthRegNo: string
  dateOfBirth: string
  className: string
  section: string
  rollNo: string
  gender: 'male' | 'female' | 'other'
  issueDate: string
  status: CertificateStatus
  remarks?: string

  // Transfer Certificate (TC) specific
  admissionDate?: string
  dateOfLeaving?: string
  reasonForLeaving?: string
  conduct?: 'Excellent' | 'Very Good' | 'Good' | 'Satisfactory'
  promotedToClass?: string
  duesClearedUpTo?: string

  // Testimonial specific
  boardName?: EducationBoard
  boardRollNo?: string
  boardRegNo?: string
  session?: string
  passingYear?: number
  gpaAchieved?: number
  gradeAchieved?: string
  activities?: string

  // Bonafide Certificate specific
  purpose?: string
  validUntil?: string
}

/**
 * Generates an official tracking serial token for a certificate:
 * - TC: TC-2026-0042
 * - Testimonial: TST-2026-0018
 * - Bonafide: BON-2026-0105
 */
export function generateCertificateSerial(
  type: CertificateType,
  year: number,
  seq: number,
): string {
  const prefix = type === 'tc' ? 'TC' : type === 'testimonial' ? 'TST' : 'BON'
  const seqPad = String(seq).padStart(4, '0')
  return `${prefix}-${year}-${seqPad}`
}

/**
 * Returns localized label for certificate type.
 */
export function getCertificateTypeLabel(
  type: CertificateType,
  lang: 'en' | 'bn' = 'en',
): string {
  if (lang === 'bn') {
    switch (type) {
      case 'tc':
        return 'ছাড়পত্র (টিসি)'
      case 'testimonial':
        return 'প্রশংসাপত্র (টেস্টিমোনিয়াল)'
      case 'bonafide':
        return 'অধ্যয়নরত প্রত্যয়নপত্র'
    }
  }
  switch (type) {
    case 'tc':
      return 'Transfer Certificate (TC)'
    case 'testimonial':
      return 'Academic Testimonial'
    case 'bonafide':
      return 'Bonafide Student Certificate'
  }
}
