import type { SlotJoined } from '@/data/timetable'

export interface RoutineDay {
  key: 'sat' | 'sun' | 'mon' | 'tue' | 'wed' | 'thu'
  dayIndex: number // 1 to 6 in Bangladesh academic sequence
  labelEn: string
  labelBn: string
  shortEn: string
  shortBn: string
}

/**
 * Bangladesh standard academic week runs Saturday to Thursday.
 * Friday is the national weekend holiday.
 */
export const BD_ACADEMIC_DAYS: RoutineDay[] = [
  { key: 'sat', dayIndex: 1, labelEn: 'Saturday', labelBn: 'শনিবার', shortEn: 'Sat', shortBn: 'শনি' },
  { key: 'sun', dayIndex: 2, labelEn: 'Sunday', labelBn: 'রবিবার', shortEn: 'Sun', shortBn: 'রবি' },
  { key: 'mon', dayIndex: 3, labelEn: 'Monday', labelBn: 'সোমবার', shortEn: 'Mon', shortBn: 'সোম' },
  { key: 'tue', dayIndex: 4, labelEn: 'Tuesday', labelBn: 'মঙ্গলবার', shortEn: 'Tue', shortBn: 'মঙ্গল' },
  { key: 'wed', dayIndex: 5, labelEn: 'Wednesday', labelBn: 'বুধবার', shortEn: 'Wed', shortBn: 'বুধ' },
  { key: 'thu', dayIndex: 6, labelEn: 'Thursday', labelBn: 'বৃহস্পতিবার', shortEn: 'Thu', shortBn: 'বৃহ' },
]

export interface TimetableSlotCandidate {
  id?: string | null
  classId: string
  className?: string
  subjectId: string
  subjectName?: string
  teacherId?: string | null
  teacherName?: string | null
  day: number
  period: number
  room?: string | null
}

export interface TimetableClashResult {
  hasClash: boolean
  type: 'teacher' | 'room' | null
  message: string
  conflictingSlot?: {
    className: string
    subjectName: string
    teacherName: string
    room: string
    day: number
    period: number
  }
}

/**
 * Checks whether candidate timetable slot clashes with existing slots.
 * Detects:
 * 1. Teacher double-booking (same teacher in two different classes at the same day & period).
 * 2. Room double-booking (same physical room occupied by two classes at the same day & period).
 */
export function detectTimetableClash(
  existingSlots: SlotJoined[],
  candidate: TimetableSlotCandidate,
): TimetableClashResult {
  const normRoom = candidate.room?.trim().toLowerCase()

  for (const slot of existingSlots) {
    // Skip self when updating an existing slot
    if (candidate.id && slot.id === candidate.id) continue

    // Check same day and period
    if (slot.day_of_week === candidate.day && slot.period === candidate.period) {
      // 1. Teacher conflict check
      if (
        candidate.teacherId &&
        slot.teacher_id &&
        candidate.teacherId === slot.teacher_id &&
        slot.class_id !== candidate.classId
      ) {
        const teacherName = slot.teacher_name || candidate.teacherName || 'Teacher'
        const className = slot.class_name || 'another class'
        return {
          hasClash: true,
          type: 'teacher',
          message: `${teacherName} is already assigned to ${className} on Period P${candidate.period}.`,
          conflictingSlot: {
            className: slot.class_name ?? '',
            subjectName: slot.subject_name ?? '',
            teacherName: slot.teacher_name ?? '',
            room: slot.room ?? '',
            day: slot.day_of_week,
            period: slot.period,
          },
        }
      }

      // 2. Room conflict check
      if (normRoom && slot.room && slot.room.trim().toLowerCase() === normRoom) {
        if (slot.class_id !== candidate.classId) {
          const className = slot.class_name || 'another class'
          return {
            hasClash: true,
            type: 'room',
            message: `Room ${candidate.room} is already booked for ${className} on Period P${candidate.period}.`,
            conflictingSlot: {
              className: slot.class_name ?? '',
              subjectName: slot.subject_name ?? '',
              teacherName: slot.teacher_name ?? '',
              room: slot.room ?? '',
              day: slot.day_of_week,
              period: slot.period,
            },
          }
        }
      }
    }
  }

  return { hasClash: false, type: null, message: '' }
}

export interface ExamRoutineItem {
  id: string
  examName: string
  className: string
  classId?: string
  subjectName: string
  date: string
  dayOfWeek: string
  timeSlot: string
  room: string
  invigilator: string
  totalMarks: number
}

const WEEKDAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const WEEKDAY_NAMES_BN = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার']

/**
 * Returns weekday name for any YYYY-MM-DD date string.
 */
export function getWeekdayName(dateStr: string, lang: 'en' | 'bn' = 'en'): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '—'
  const dayIdx = date.getDay() // 0 = Sunday
  return lang === 'bn' ? WEEKDAY_NAMES_BN[dayIdx] : WEEKDAY_NAMES_EN[dayIdx]
}
