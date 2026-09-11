import type { AttendanceStatus } from '@/types/models'

export type AttendanceStatusMap = Record<string, AttendanceStatus>

export function hasAttendanceChanges(
  studentIds: string[],
  saved: ReadonlyMap<string, AttendanceStatus>,
  current: AttendanceStatusMap,
): boolean {
  if (studentIds.some((id) => !saved.has(id))) return studentIds.length > 0
  return studentIds.some((id) => saved.get(id) !== current[id])
}

export function attendanceCounts(statuses: AttendanceStatus[]): Record<AttendanceStatus, number> {
  return statuses.reduce(
    (counts, status) => {
      counts[status] += 1
      return counts
    },
    { present: 0, absent: 0, late: 0, leave: 0 },
  )
}

export function attendanceErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return 'Attendance could not be saved.'
}
