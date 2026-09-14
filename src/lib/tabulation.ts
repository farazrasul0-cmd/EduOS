import { getNctbGradeRule } from './grading'

export interface TabulationSubjectScore {
  subjectName: string
  caMarks: number
  finalMarks: number
  totalMarks: number
  letter: string
  gpa: number
  isPassed: boolean
}

export interface TabulationStudentRow {
  studentId: string
  studentName: string
  rollNo: string
  subjects: Record<string, TabulationSubjectScore>
  grandTotal: number
  totalPossibleMarks: number
  gpa: number
  overallGrade: string
  isPassed: boolean
  meritPosition: number
}

export interface SubjectCohortStats {
  highestMarks: number
  averageMarks: number
  passCount: number
  failCount: number
}

export interface CohortStatistics {
  totalAppeared: number
  totalPassed: number
  totalFailed: number
  passPercentage: number
  gpa5Count: number
  classAverage: number
  subjectStats: Record<string, SubjectCohortStats>
}

/**
 * Calculates a single subject score combining Continuous Assessment (CA) and Term Final exam.
 */
export function calculateSubjectScore(
  subjectName: string,
  caMarks: number,
  finalMarks: number,
  totalPossible = 100,
): TabulationSubjectScore {
  const safeCa = Math.max(0, caMarks || 0)
  const safeFinal = Math.max(0, finalMarks || 0)
  const totalMarks = Math.min(totalPossible, safeCa + safeFinal)

  const pct = totalPossible > 0 ? (totalMarks / totalPossible) * 100 : 0
  const rule = getNctbGradeRule(pct)
  const isPassed = pct >= 33

  return {
    subjectName,
    caMarks: safeCa,
    finalMarks: safeFinal,
    totalMarks,
    letter: isPassed ? rule.letter : 'F',
    gpa: isPassed ? rule.gpa : 0.0,
    isPassed,
  }
}

export interface RawStudentInput {
  id: string
  name: string
  roll: string
}

export interface StudentSubjectMarksInput {
  ca: number
  final: number
}

/**
 * Builds the complete class Tabulation Sheet rows with merit ranking and NCTB passing rules.
 */
export function buildTabulationRows(
  students: RawStudentInput[],
  marksMap: Record<string, Record<string, StudentSubjectMarksInput>>,
  subjectNames: string[],
): TabulationStudentRow[] {
  const unranked: Omit<TabulationStudentRow, 'meritPosition'>[] = students.map((stu) => {
    const studentMarks = marksMap[stu.id] ?? {}
    const evaluatedSubjects: Record<string, TabulationSubjectScore> = {}

    let grandTotal = 0
    const totalPossibleMarks = subjectNames.length * 100

    subjectNames.forEach((subj) => {
      const entry = studentMarks[subj] ?? { ca: 0, final: 0 }
      const score = calculateSubjectScore(subj, entry.ca, entry.final, 100)
      evaluatedSubjects[subj] = score
      grandTotal += score.totalMarks
    })

    const scoresList = Object.values(evaluatedSubjects)
    const hasFailedSubject = scoresList.some((s) => !s.isPassed)
    const isPassed = scoresList.length > 0 && !hasFailedSubject

    let gpa = 0.0
    let overallGrade = 'F'

    if (isPassed && scoresList.length > 0) {
      const avgGpa = scoresList.reduce((sum, s) => sum + s.gpa, 0) / scoresList.length
      gpa = Number(Math.min(5.0, avgGpa).toFixed(2))

      if (gpa >= 5.0) overallGrade = 'A+'
      else if (gpa >= 4.0) overallGrade = 'A'
      else if (gpa >= 3.5) overallGrade = 'A-'
      else if (gpa >= 3.0) overallGrade = 'B'
      else if (gpa >= 2.0) overallGrade = 'C'
      else overallGrade = 'D'
    }

    return {
      studentId: stu.id,
      studentName: stu.name,
      rollNo: stu.roll,
      subjects: evaluatedSubjects,
      grandTotal,
      totalPossibleMarks,
      gpa,
      overallGrade,
      isPassed,
    }
  })

  // Merit Ranking: Passed > Failed, GPA descending, Grand Total descending
  unranked.sort((a, b) => {
    if (a.isPassed !== b.isPassed) {
      return a.isPassed ? -1 : 1
    }
    if (b.gpa !== a.gpa) {
      return b.gpa - a.gpa
    }
    return b.grandTotal - a.grandTotal
  })

  return unranked.map((row, idx) => ({
    ...row,
    meritPosition: idx + 1,
  }))
}

/**
 * Computes cohort statistical aggregates across all examinees in the tabulation sheet.
 */
export function calculateCohortStatistics(
  rows: TabulationStudentRow[],
  subjectNames: string[],
): CohortStatistics {
  const totalAppeared = rows.length
  if (totalAppeared === 0) {
    return {
      totalAppeared: 0,
      totalPassed: 0,
      totalFailed: 0,
      passPercentage: 0,
      gpa5Count: 0,
      classAverage: 0,
      subjectStats: {},
    }
  }

  const totalPassed = rows.filter((r) => r.isPassed).length
  const totalFailed = totalAppeared - totalPassed
  const passPercentage = Number(((totalPassed / totalAppeared) * 100).toFixed(1))
  const gpa5Count = rows.filter((r) => r.isPassed && r.gpa >= 5.0).length

  const sumGrandTotal = rows.reduce((sum, r) => sum + r.grandTotal, 0)
  const sumTotalPossible = rows.reduce((sum, r) => sum + r.totalPossibleMarks, 0)
  const classAverage =
    sumTotalPossible > 0 ? Number(((sumGrandTotal / sumTotalPossible) * 100).toFixed(1)) : 0

  const subjectStats: Record<string, SubjectCohortStats> = {}

  subjectNames.forEach((subj) => {
    let highest = 0
    let sumMarks = 0
    let passCount = 0
    let failCount = 0

    rows.forEach((r) => {
      const score = r.subjects[subj]
      if (score) {
        if (score.totalMarks > highest) highest = score.totalMarks
        sumMarks += score.totalMarks
        if (score.isPassed) passCount++
        else failCount++
      }
    })

    subjectStats[subj] = {
      highestMarks: highest,
      averageMarks: totalAppeared > 0 ? Number((sumMarks / totalAppeared).toFixed(1)) : 0,
      passCount,
      failCount,
    }
  })

  return {
    totalAppeared,
    totalPassed,
    totalFailed,
    passPercentage,
    gpa5Count,
    classAverage,
    subjectStats,
  }
}
