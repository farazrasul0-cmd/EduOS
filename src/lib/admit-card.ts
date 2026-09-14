export type FeeClearanceStatus = 'cleared' | 'withheld' | 'overridden'

export interface ExamSubjectSchedule {
  subjectCode: string
  subjectName: string
  examDate: string
  dayOfWeek: string
  timeSlot: string
  totalMarks: number
  room: string
}

export interface AdmitCardCandidate {
  id: string
  admitCardNo: string
  studentId: string
  studentName: string
  studentNameBn: string
  className: string
  section: string
  rollNo: string
  gender: 'male' | 'female'
  group?: string
  guardianName: string
  guardianPhone: string
  feeDueAmount: number
  clearanceStatus: FeeClearanceStatus
  overrideRemarks?: string
  overriddenBy?: string
  examTitle: string
  academicYear: string
  subjects: ExamSubjectSchedule[]
}

export interface ExamHall {
  id: string
  roomName: string
  building: string
  floor: number
  totalBenches: number
  seatsPerBench: number
  invigilatorName: string
  invigilatorPhone: string
}

export interface BenchAllocation {
  id: string
  hallId: string
  hallName: string
  benchNo: number
  seatPosition: 'Left' | 'Right'
  candidate: AdmitCardCandidate
}

export interface SeatPlanResult {
  allocations: BenchAllocation[]
  totalSeated: number
  hallsUsed: number
  overflowCandidates: AdmitCardCandidate[]
}

/**
 * Generates an official Admit Card token: AC-2026-0042
 */
export function generateAdmitCardNo(
  year: number,
  sequence: number | string,
  classCode?: string,
): string {
  if (classCode) {
    const padRoll = String(sequence).padStart(3, '0')
    return `AC-${year}-${classCode}${padRoll}`
  }
  const padSeq = String(sequence).padStart(4, '0')
  return `AC-${year}-${padSeq}`
}

/**
 * Evaluates whether an examinee can be issued an Admit Card based on fee dues.
 */
export function evaluateFeeClearance(
  feeDue: number,
  isOverridden = false,
): {
  canIssue: boolean
  status: FeeClearanceStatus
  message: string
} {
  if (feeDue <= 0) {
    return {
      canIssue: true,
      status: 'cleared',
      message: 'Fees fully cleared. Eligible for official examination.',
    }
  }

  if (isOverridden) {
    return {
      canIssue: true,
      status: 'overridden',
      message: 'Special clearance authorized by Institutional Authority.',
    }
  }

  return {
    canIssue: false,
    status: 'withheld',
    message: `Admit card withheld due to outstanding dues of BDT ${feeDue.toLocaleString()}.`,
  }
}

/**
 * Generates an anti-cheating zigzag / alternating seating plan.
 * Benches seat 2 students. Left and Right seats are filled from alternating classes
 * so adjacent students never share the same grade or exam question paper.
 */
export function generateZigzagSeatPlan(
  halls: ExamHall[],
  candidates: AdmitCardCandidate[],
): SeatPlanResult {
  const allocations: BenchAllocation[] = []
  const overflowCandidates: AdmitCardCandidate[] = []

  // Group examinees by class
  const classMap = new Map<string, AdmitCardCandidate[]>()
  for (const cand of candidates) {
    const arr = classMap.get(cand.className) ?? []
    arr.push(cand)
    classMap.set(cand.className, arr)
  }

  // Sort candidates inside each class by roll number
  for (const [, list] of classMap.entries()) {
    list.sort((a, b) => Number(a.rollNo || 0) - Number(b.rollNo || 0))
  }

  const classes = Array.from(classMap.keys()).sort()

  // Partition examinees into two streams: Primary stream (Class A, C, ...) and Alternate stream (Class B, D, ...)
  const leftQueue: AdmitCardCandidate[] = []
  const rightQueue: AdmitCardCandidate[] = []

  classes.forEach((cls, idx) => {
    const list = classMap.get(cls) ?? []
    if (idx % 2 === 0) {
      leftQueue.push(...list)
    } else {
      rightQueue.push(...list)
    }
  })

  // If one queue is empty (e.g. only one class taking exams), split it in half
  if (leftQueue.length === 0 && rightQueue.length > 0) {
    const mid = Math.ceil(rightQueue.length / 2)
    leftQueue.push(...rightQueue.splice(0, mid))
  } else if (rightQueue.length === 0 && leftQueue.length > 0) {
    const mid = Math.ceil(leftQueue.length / 2)
    rightQueue.push(...leftQueue.splice(mid))
  }

  let hallsUsedCount = 0

  for (const hall of halls) {
    if (leftQueue.length === 0 && rightQueue.length === 0) break

    let hallHasSeated = false

    for (let b = 1; b <= hall.totalBenches; b++) {
      // Seat Left
      const candLeft = leftQueue.shift() ?? rightQueue.shift()
      if (candLeft) {
        allocations.push({
          id: `BENCH-${hall.id}-${b}-L`,
          hallId: hall.id,
          hallName: hall.roomName,
          benchNo: b,
          seatPosition: 'Left',
          candidate: candLeft,
        })
        hallHasSeated = true
      }

      // Seat Right
      const candRight = rightQueue.shift() ?? leftQueue.shift()
      if (candRight) {
        allocations.push({
          id: `BENCH-${hall.id}-${b}-R`,
          hallId: hall.id,
          hallName: hall.roomName,
          benchNo: b,
          seatPosition: 'Right',
          candidate: candRight,
        })
        hallHasSeated = true
      }

      if (leftQueue.length === 0 && rightQueue.length === 0) break
    }

    if (hallHasSeated) {
      hallsUsedCount++
    }
  }

  // Any remaining examinees that could not fit in the configured halls
  overflowCandidates.push(...leftQueue, ...rightQueue)

  return {
    allocations,
    totalSeated: allocations.length,
    hallsUsed: hallsUsedCount,
    overflowCandidates,
  }
}
