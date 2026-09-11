import assert from 'node:assert/strict'
import test from 'node:test'
import { attendanceCounts, attendanceErrorMessage, hasAttendanceChanges } from '../src/lib/attendance.ts'

test('duplicate attendance save is detected as unchanged', () => {
  const saved = new Map([['student-1', 'present' as const], ['student-2', 'absent' as const]])
  assert.equal(hasAttendanceChanges(['student-1', 'student-2'], saved, { 'student-1': 'present', 'student-2': 'absent' }), false)
})

test('a status edit or missing saved row requires a save', () => {
  const saved = new Map([['student-1', 'present' as const]])
  assert.equal(hasAttendanceChanges(['student-1'], saved, { 'student-1': 'late' }), true)
  assert.equal(hasAttendanceChanges(['student-1', 'student-2'], saved, { 'student-1': 'present', 'student-2': 'present' }), true)
})

test('all attendance statuses, including leave, are counted', () => {
  assert.deepEqual(attendanceCounts(['present', 'absent', 'late', 'leave', 'present']), {
    present: 2,
    absent: 1,
    late: 1,
    leave: 1,
  })
})

test('database errors retain a useful message', () => {
  assert.equal(attendanceErrorMessage({ message: 'permission denied' }), 'permission denied')
  assert.equal(attendanceErrorMessage(null), 'Attendance could not be saved.')
})
