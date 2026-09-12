/**
 * Bangladesh School Accreditation & Onboarding Engine.
 * Covers BANBEIS 6-digit EIIN validation, Education Board affiliation,
 * school shifts, medium, and initial academic structure setup.
 */

export interface BangladeshBoard {
  id: string
  nameEn: string
  nameBn: string
}

export const BANGLADESH_BOARDS: readonly BangladeshBoard[] = [
  { id: 'dhaka', nameEn: 'Dhaka Education Board', nameBn: 'ঢাকা শিক্ষা বোর্ড' },
  { id: 'chattogram', nameEn: 'Chattogram Education Board', nameBn: 'চট্টগ্রাম শিক্ষা বোর্ড' },
  { id: 'rajshahi', nameEn: 'Rajshahi Education Board', nameBn: 'রাজশাহী শিক্ষা বোর্ড' },
  { id: 'cumilla', nameEn: 'Cumilla Education Board', nameBn: 'কুমিল্লা শিক্ষা বোর্ড' },
  { id: 'sylhet', nameEn: 'Sylhet Education Board', nameBn: 'সিলেট শিক্ষা বোর্ড' },
  { id: 'barishal', nameEn: 'Barishal Education Board', nameBn: 'বরিশাল শিক্ষা বোর্ড' },
  { id: 'jashore', nameEn: 'Jashore Education Board', nameBn: 'যশোর শিক্ষা বোর্ড' },
  { id: 'dinajpur', nameEn: 'Dinajpur Education Board', nameBn: 'দিনাজপুর শিক্ষা বোর্ড' },
  { id: 'mymensingh', nameEn: 'Mymensingh Education Board', nameBn: 'ময়মনসিংহ শিক্ষা বোর্ড' },
  { id: 'madrasah', nameEn: 'Bangladesh Madrasah Education Board', nameBn: 'বাংলাদেশ মাদ্রাসা শিক্ষা বোর্ড' },
  { id: 'technical', nameEn: 'Bangladesh Technical Education Board', nameBn: 'বাংলাদেশ কারিগরি শিক্ষা বোর্ড' },
] as const

export type InstituteType = 'secondary' | 'higher_secondary' | 'school_and_college' | 'primary_secondary' | 'madrasah'

export interface InstituteTypeOption {
  id: InstituteType
  nameEn: string
  nameBn: string
  descriptionEn: string
  descriptionBn: string
  defaultClasses: string[]
}

export const INSTITUTE_TYPES: readonly InstituteTypeOption[] = [
  {
    id: 'secondary',
    nameEn: 'Secondary School',
    nameBn: 'মাধ্যমিক বিদ্যালয়',
    descriptionEn: 'Class 6 to Class 10 (SSC Preparation)',
    descriptionBn: '৬ষ্ঠ থেকে ১০ম শ্রেণি (এসএসসি প্রস্তুতি)',
    defaultClasses: ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'],
  },
  {
    id: 'school_and_college',
    nameEn: 'School & College',
    nameBn: 'স্কুল অ্যান্ড কলেজ',
    descriptionEn: 'Class 6 to Class 12 (SSC & HSC)',
    descriptionBn: '৬ষ্ঠ থেকে ১২শ শ্রেণি (এসএসসি ও এইচএসসি)',
    defaultClasses: ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'],
  },
  {
    id: 'higher_secondary',
    nameEn: 'Higher Secondary College',
    nameBn: 'উচ্চ মাধ্যমিক কলেজ',
    descriptionEn: 'Class 11 to Class 12 (HSC Preparation)',
    descriptionBn: '১১শ থেকে ১২শ শ্রেণি (এইচএসসি প্রস্তুতি)',
    defaultClasses: ['Class 11', 'Class 12'],
  },
  {
    id: 'primary_secondary',
    nameEn: 'Primary & Secondary School',
    nameBn: 'প্রাথমিক ও মাধ্যমিক বিদ্যালয়',
    descriptionEn: 'Class 1 to Class 10',
    descriptionBn: '১ম থেকে ১০ম শ্রেণি',
    defaultClasses: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'],
  },
  {
    id: 'madrasah',
    nameEn: 'Madrasah (Dakhil & Alim)',
    nameBn: 'মাদ্রাসা (দাখিল ও আলিম)',
    descriptionEn: 'Dakhil (6-10) & Alim (11-12)',
    descriptionBn: 'দাখিল (৬ষ্ঠ-১০ম) ও আলিম (১১শ-১২শ)',
    defaultClasses: ['Dakhil 6', 'Dakhil 7', 'Dakhil 8', 'Dakhil 9', 'Dakhil 10', 'Alim 1st Year', 'Alim 2nd Year'],
  },
] as const

export type SchoolShift = 'single' | 'morning' | 'day' | 'dual'

export interface ShiftOption {
  id: SchoolShift
  nameEn: string
  nameBn: string
  descriptionEn: string
  descriptionBn: string
}

export const SCHOOL_SHIFTS: readonly ShiftOption[] = [
  {
    id: 'single',
    nameEn: 'Single Shift',
    nameBn: 'এক শিফট',
    descriptionEn: 'Regular general hours (8:30 AM – 3:30 PM)',
    descriptionBn: 'নিয়মিত সাধারণ সময়সূচি (সকাল ৮:৩০ - বিকাল ৩:৩০)',
  },
  {
    id: 'morning',
    nameEn: 'Morning Shift',
    nameBn: 'প্রভাতী শাখা',
    descriptionEn: 'Early schedule typically for girls or primary (7:00 AM – 11:30 AM)',
    descriptionBn: 'সকাল ৭:০০ - সকাল ১১:৩০ (সাধারণত মেয়ে বা প্রাথমিক)',
  },
  {
    id: 'day',
    nameEn: 'Day Shift',
    nameBn: 'দিবা শাখা',
    descriptionEn: 'Midday schedule typically for boys or secondary (11:45 AM – 4:30 PM)',
    descriptionBn: 'সকাল ১১:৪৫ - বিকাল ৪:৩০ (সাধারণত ছেলে বা মাধ্যমিক)',
  },
  {
    id: 'dual',
    nameEn: 'Dual Shifts (Morning & Day)',
    nameBn: 'দ্বৈত শিফট (প্রভাতী ও দিবা)',
    descriptionEn: 'Separate morning and day shifts for high student volume',
    descriptionBn: 'অধিক শিক্ষার্থীর জন্য প্রভাতী ও দিবা উভয় শিফট',
  },
] as const

export type CurriculumMedium = 'bangla_medium' | 'english_version' | 'combined'

export interface MediumOption {
  id: CurriculumMedium
  nameEn: string
  nameBn: string
}

export const CURRICULUM_MEDIUMS: readonly MediumOption[] = [
  {
    id: 'bangla_medium',
    nameEn: 'Bangla Medium (NCTB)',
    nameBn: 'বাংলা মাধ্যম (জাতীয় শিক্ষাক্রম)',
  },
  {
    id: 'english_version',
    nameEn: 'English Version (NCTB)',
    nameBn: 'ইংরেজি ভার্সন (জাতীয় শিক্ষাক্রম)',
  },
  {
    id: 'combined',
    nameEn: 'Both Bangla Medium & English Version',
    nameBn: 'উভয় মাধ্যম (বাংলা ও ইংরেজি)',
  },
] as const

export interface DefaultFeeHead {
  id: string
  nameEn: string
  nameBn: string
  amount: number
  period: 'monthly' | 'yearly' | 'term'
}

export const DEFAULT_FEE_HEADS: readonly DefaultFeeHead[] = [
  {
    id: 'tuition',
    nameEn: 'Monthly Tuition Fee',
    nameBn: 'মাসিক বেতন',
    amount: 1500,
    period: 'monthly',
  },
  {
    id: 'session',
    nameEn: 'Session & Admission Fee',
    nameBn: 'সেশন ও ভর্তি ফি',
    amount: 3500,
    period: 'yearly',
  },
  {
    id: 'exam',
    nameEn: 'Term Examination Fee',
    nameBn: 'টার্ম পরীক্ষার ফি',
    amount: 800,
    period: 'term',
  },
  {
    id: 'lab',
    nameEn: 'ICT & Lab Fee',
    nameBn: 'আইসিটি ও ল্যাব ফি',
    amount: 500,
    period: 'term',
  },
] as const

/**
 * Validates a BANBEIS-issued Educational Institute Identification Number (EIIN).
 * Must strictly be 6 numeric digits (e.g. "108234").
 */
export function validateEiin(eiin: string): { valid: boolean; errorKey?: string } {
  const trimmed = eiin.trim()
  if (!trimmed) {
    return { valid: false, errorKey: 'onboarding.errors.eiinRequired' }
  }
  if (!/^\d{6}$/.test(trimmed)) {
    return { valid: false, errorKey: 'onboarding.errors.eiinFormat' }
  }
  return { valid: true }
}

export interface OnboardingWizardState {
  // Step 1: Institute Identification
  schoolName: string
  eiin: string
  board: string
  instituteType: InstituteType
  address: string

  // Step 2: Operations & Shifts
  shift: SchoolShift
  medium: CurriculumMedium
  academicYear: string

  // Step 3: Academic Setup
  selectedClasses: string[]
  selectedSections: string[]
  feeHeads: { id: string; name: string; amount: number; period: 'monthly' | 'yearly' | 'term' }[]
}

export const INITIAL_WIZARD_STATE: OnboardingWizardState = {
  schoolName: '',
  eiin: '',
  board: 'dhaka',
  instituteType: 'secondary',
  address: '',
  shift: 'single',
  medium: 'bangla_medium',
  academicYear: '2026',
  selectedClasses: ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'],
  selectedSections: ['A', 'B'],
  feeHeads: [
    { id: 'tuition', name: 'Monthly Tuition Fee', amount: 1500, period: 'monthly' },
    { id: 'session', name: 'Session & Admission Fee', amount: 3500, period: 'yearly' },
    { id: 'exam', name: 'Term Examination Fee', amount: 800, period: 'term' },
    { id: 'lab', name: 'ICT & Lab Fee', amount: 500, period: 'term' },
  ],
}
