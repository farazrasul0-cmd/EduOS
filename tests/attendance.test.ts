import { describe, it, expect } from 'vitest'
import { attendanceCounts, attendanceErrorMessage, hasAttendanceChanges } from '../src/lib/attendance'

describe('attendance logic', () => {
  it('duplicate attendance save is detected as unchanged', () => {
    const saved = new Map([['student-1', 'present' as const], ['student-2', 'absent' as const]])
    expect(hasAttendanceChanges(['student-1', 'student-2'], saved, { 'student-1': 'present', 'student-2': 'absent' })).toBe(false)
  })

  it('a status edit or missing saved row requires a save', () => {
    const saved = new Map([['student-1', 'present' as const]])
    expect(hasAttendanceChanges(['student-1'], saved, { 'student-1': 'late' })).toBe(true)
    expect(hasAttendanceChanges(['student-1', 'student-2'], saved, { 'student-1': 'present', 'student-2': 'present' })).toBe(true)
  })

  it('all attendance statuses, including leave, are counted', () => {
    expect(attendanceCounts(['present', 'absent', 'late', 'leave', 'present'])).toEqual({
      present: 2,
      absent: 1,
      late: 1,
      leave: 1,
    })
  })

  it('database errors retain a useful message', () => {
    expect(attendanceErrorMessage({ message: 'permission denied' })).toBe('permission denied')
    expect(attendanceErrorMessage(null)).toBe('Attendance could not be saved.')
  })
})
