export interface GradeRule {
  min: number
  max?: number
  letter: string
  gpa: number
  remarkEn?: string
  remarkBn?: string
}

// Bangladesh secondary-school grading scale (NCTB / Ministry of Education standard).
export const NCTB_GRADE_RULES: GradeRule[] = [
  { min: 80, max: 100, letter: 'A+', gpa: 5.0, remarkEn: 'Outstanding', remarkBn: 'অসাধারণ' },
  { min: 70, max: 79.99, letter: 'A', gpa: 4.0, remarkEn: 'Excellent', remarkBn: 'চমৎকার' },
  { min: 60, max: 69.99, letter: 'A-', gpa: 3.5, remarkEn: 'Very Good', remarkBn: 'খুব ভালো' },
  { min: 50, max: 59.99, letter: 'B', gpa: 3.0, remarkEn: 'Good', remarkBn: 'ভালো' },
  { min: 40, max: 49.99, letter: 'C', gpa: 2.0, remarkEn: 'Satisfactory', remarkBn: 'সন্তোষজনক' },
  { min: 33, max: 39.99, letter: 'D', gpa: 1.0, remarkEn: 'Pass', remarkBn: 'উত্তীর্ণ' },
  { min: 0, max: 32.99, letter: 'F', gpa: 0.0, remarkEn: 'Fail', remarkBn: 'অকৃতকার্য' },
]

export const GRADE_RULES: { min: number; letter: string; gpa: number }[] = NCTB_GRADE_RULES.map(
  ({ min, letter, gpa }) => ({ min, letter, gpa }),
)

export function gradeForPercentage(percentage: number): { min: number; letter: string; gpa: number } {
  const normalized = Math.max(0, Math.min(100, percentage))
  return GRADE_RULES.find((rule) => normalized >= rule.min) ?? GRADE_RULES[GRADE_RULES.length - 1]
}

export function getNctbGradeRule(percentage: number): GradeRule {
  const normalized = Math.max(0, Math.min(100, percentage))
  return (
    NCTB_GRADE_RULES.find((rule) => normalized >= rule.min) ??
    NCTB_GRADE_RULES[NCTB_GRADE_RULES.length - 1]
  )
}

export function averageGpa(percentages: number[]): number {
  if (!percentages.length) return 0
  return Number(
    (
      percentages.reduce((sum, value) => sum + gradeForPercentage(value).gpa, 0) /
      percentages.length
    ).toFixed(2),
  )
}

export function validMarks(value: string, total: number): boolean {
  if (value.trim() === '') return false
  const marks = Number(value)
  return Number.isFinite(marks) && marks >= 0 && marks <= total
}

export interface NctbSubjectInput {
  subject: string
  marks: number
  total: number
  highestMarks?: number
}

export interface NctbSubjectEvaluation extends NctbSubjectInput {
  percentage: number
  letter: string
  gpa: number
  isPassed: boolean
  remarkEn: string
  remarkBn: string
}

export interface NctbStudentResult {
  subjects: NctbSubjectEvaluation[]
  totalMarks: number
  totalPossibleMarks: number
  averagePercentage: number
  isPassed: boolean
  gpa: number
  overallGrade: string
  remarksEn: string
  remarksBn: string
}

export function calculateNctbSubjectResult(marks: number, total: number): NctbSubjectEvaluation {
  const safeTotal = total > 0 ? total : 100
  const percentage = Math.max(0, Math.min(100, (marks / safeTotal) * 100))
  const rule = getNctbGradeRule(percentage)
  const isPassed = percentage >= 33

  return {
    subject: '',
    marks,
    total: safeTotal,
    percentage: Number(percentage.toFixed(2)),
    letter: rule.letter,
    gpa: rule.gpa,
    isPassed,
    remarkEn: rule.remarkEn ?? '',
    remarkBn: rule.remarkBn ?? '',
  }
}

/**
 * Evaluates a student's full examination record under NCTB guidelines.
 * Strict NCTB rule: A score below 33% (Grade F) in ANY compulsory subject
 * results in an overall GPA of 0.00 and Failed status.
 */
export function calculateNctbStudentResult(subjects: NctbSubjectInput[]): NctbStudentResult {
  if (!subjects.length) {
    return {
      subjects: [],
      totalMarks: 0,
      totalPossibleMarks: 0,
      averagePercentage: 0,
      isPassed: false,
      gpa: 0,
      overallGrade: 'F',
      remarksEn: 'No examination records',
      remarksBn: 'কোনো পরীক্ষার তথ্য নেই',
    }
  }

  const evaluations: NctbSubjectEvaluation[] = subjects.map((sub) => {
    const evalResult = calculateNctbSubjectResult(sub.marks, sub.total)
    return {
      ...evalResult,
      subject: sub.subject,
      highestMarks: sub.highestMarks,
    }
  })

  const totalMarks = evaluations.reduce((sum, s) => sum + s.marks, 0)
  const totalPossibleMarks = evaluations.reduce((sum, s) => sum + s.total, 0)
  const averagePercentage =
    totalPossibleMarks > 0 ? Number(((totalMarks / totalPossibleMarks) * 100).toFixed(2)) : 0

  const hasFailedSubject = evaluations.some((s) => !s.isPassed)
  const isPassed = !hasFailedSubject

  let gpa = 0
  let overallGrade = 'F'
  let remarksEn = 'Fail'
  let remarksBn = 'অকৃতকার্য'

  if (isPassed) {
    const rawGpa = evaluations.reduce((sum, s) => sum + s.gpa, 0) / evaluations.length
    gpa = Number(Math.min(5.0, rawGpa).toFixed(2))

    if (gpa >= 5.0) {
      overallGrade = 'A+'
      remarksEn = 'Outstanding'
      remarksBn = 'অসাধারণ'
    } else if (gpa >= 4.0) {
      overallGrade = 'A'
      remarksEn = 'Excellent'
      remarksBn = 'চমৎকার'
    } else if (gpa >= 3.5) {
      overallGrade = 'A-'
      remarksEn = 'Very Good'
      remarksBn = 'খুব ভালো'
    } else if (gpa >= 3.0) {
      overallGrade = 'B'
      remarksEn = 'Good'
      remarksBn = 'ভালো'
    } else if (gpa >= 2.0) {
      overallGrade = 'C'
      remarksEn = 'Satisfactory'
      remarksBn = 'সন্তোষজনক'
    } else {
      overallGrade = 'D'
      remarksEn = 'Pass'
      remarksBn = 'উত্তীর্ণ'
    }
  }

  return {
    subjects: evaluations,
    totalMarks,
    totalPossibleMarks,
    averagePercentage,
    isPassed,
    gpa,
    overallGrade,
    remarksEn,
    remarksBn,
  }
}

export interface StudentMeritCandidate {
  studentId: string
  isPassed: boolean
  gpa: number
  totalMarks: number
}

/**
 * Calculates academic merit ranking across a cohort of students.
 * Ranking hierarchy:
 * 1. Passed students are ranked ahead of failed students.
 * 2. Higher GPA ranks higher.
 * 3. Tie-breaker: Higher total marks obtained ranks higher.
 */
export function calculateMeritPositions<T extends StudentMeritCandidate>(
  candidates: T[],
): (T & { meritPosition: number })[] {
  const sorted = [...candidates].sort((a, b) => {
    // 1. Pass status
    if (a.isPassed !== b.isPassed) {
      return a.isPassed ? -1 : 1
    }
    // 2. GPA descending
    if (b.gpa !== a.gpa) {
      return b.gpa - a.gpa
    }
    // 3. Total marks descending (tie-breaker)
    return b.totalMarks - a.totalMarks
  })

  return sorted.map((item, index) => ({
    ...item,
    meritPosition: index + 1,
  }))
}
