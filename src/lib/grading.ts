export interface GradeRule { min: number; letter: string; gpa: number }

// Bangladesh secondary-school grading scale.
export const GRADE_RULES: GradeRule[] = [
  { min: 80, letter: 'A+', gpa: 5 },
  { min: 70, letter: 'A', gpa: 4 },
  { min: 60, letter: 'A-', gpa: 3.5 },
  { min: 50, letter: 'B', gpa: 3 },
  { min: 40, letter: 'C', gpa: 2 },
  { min: 33, letter: 'D', gpa: 1 },
  { min: 0, letter: 'F', gpa: 0 },
]

export function gradeForPercentage(percentage: number): GradeRule {
  const normalized = Math.max(0, Math.min(100, percentage))
  return GRADE_RULES.find((rule) => normalized >= rule.min) ?? GRADE_RULES[GRADE_RULES.length - 1]
}

export function averageGpa(percentages: number[]): number {
  if (!percentages.length) return 0
  return Number((percentages.reduce((sum, value) => sum + gradeForPercentage(value).gpa, 0) / percentages.length).toFixed(2))
}

export function validMarks(value: string, total: number): boolean {
  if (value.trim() === '') return false
  const marks = Number(value)
  return Number.isFinite(marks) && marks >= 0 && marks <= total
}
