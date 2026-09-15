import { describe, it, expect } from 'vitest'
import {
  BD_ACADEMIC_DAYS,
  detectTimetableClash,
  getWeekdayName,
  type TimetableSlotCandidate,
} from '../src/lib/routine-scheduler'
import { createClassRoutinePdf } from '../src/lib/class-routine-pdf'
import { createExamRoutinePdf } from '../src/lib/exam-routine-pdf'
import type { SlotJoined } from '../src/data/timetable'

const mockExistingSlots: SlotJoined[] = [
  {
    id: 'slot-1',
    school_id: 'sch-1',
    class_id: 'c-7',
    class_name: 'Class 7',
    subject_id: 'sub-math',
    subject_name: 'Mathematics',
    teacher_id: 't-rahim',
    teacher_name: 'Abdur Rahim',
    day_of_week: 1, // Saturday
    period: 1,
    start_time: '08:00',
    end_time: '08:40',
    room: 'Room 201',
  },
  {
    id: 'slot-2',
    school_id: 'sch-1',
    class_id: 'c-8',
    class_name: 'Class 8',
    subject_id: 'sub-sci',
    subject_name: 'Science',
    teacher_id: 't-karim',
    teacher_name: 'Karim Ullah',
    day_of_week: 1, // Saturday
    period: 2,
    start_time: '08:45',
    end_time: '09:25',
    room: 'Lab 1',
  },
]

describe('Routine Scheduler & Clash Engine', () => {
  it('detects teacher double-booking clash on the same day and period in another class', () => {
    const candidate: TimetableSlotCandidate = {
      id: null,
      classId: 'c-9', // Class 9 attempting to book Abdur Rahim on Saturday P1
      className: 'Class 9',
      subjectId: 'sub-math',
      subjectName: 'Mathematics',
      teacherId: 't-rahim',
      teacherName: 'Abdur Rahim',
      day: 1,
      period: 1,
      room: 'Room 205',
    }

    const result = detectTimetableClash(mockExistingSlots, candidate)
    expect(result.hasClash).toBe(true)
    expect(result.type).toBe('teacher')
    expect(result.message).toContain('Abdur Rahim is already assigned to Class 7 on Period P1')
  })

  it('detects room double-booking clash on the same day and period', () => {
    const candidate: TimetableSlotCandidate = {
      id: null,
      classId: 'c-9',
      className: 'Class 9',
      subjectId: 'sub-eng',
      subjectName: 'English',
      teacherId: 't-other',
      teacherName: 'Other Teacher',
      day: 1,
      period: 1,
      room: 'Room 201', // Room 201 is already used by Class 7 on Sat P1
    }

    const result = detectTimetableClash(mockExistingSlots, candidate)
    expect(result.hasClash).toBe(true)
    expect(result.type).toBe('room')
    expect(result.message).toContain('Room Room 201 is already booked for Class 7 on Period P1')
  })

  it('allows scheduling when there is no teacher or room clash', () => {
    const candidate: TimetableSlotCandidate = {
      id: null,
      classId: 'c-9',
      className: 'Class 9',
      subjectId: 'sub-bangla',
      subjectName: 'Bangla',
      teacherId: 't-rahim',
      teacherName: 'Abdur Rahim',
      day: 1,
      period: 3, // Period 3 is free for Rahim
      room: 'Room 205',
    }

    const result = detectTimetableClash(mockExistingSlots, candidate)
    expect(result.hasClash).toBe(false)
    expect(result.type).toBeNull()
  })

  it('ignores self when editing an existing slot with matching id', () => {
    const candidate: TimetableSlotCandidate = {
      id: 'slot-1', // Updating slot-1 itself
      classId: 'c-7',
      className: 'Class 7',
      subjectId: 'sub-math',
      subjectName: 'Mathematics',
      teacherId: 't-rahim',
      teacherName: 'Abdur Rahim',
      day: 1,
      period: 1,
      room: 'Room 201',
    }

    const result = detectTimetableClash(mockExistingSlots, candidate)
    expect(result.hasClash).toBe(false)
  })

  it('validates Bangladesh academic week sequence (Saturday to Thursday)', () => {
    expect(BD_ACADEMIC_DAYS).toHaveLength(6)
    expect(BD_ACADEMIC_DAYS[0].key).toBe('sat')
    expect(BD_ACADEMIC_DAYS[0].labelEn).toBe('Saturday')
    expect(BD_ACADEMIC_DAYS[0].labelBn).toBe('শনিবার')
    expect(BD_ACADEMIC_DAYS[5].key).toBe('thu')
    expect(BD_ACADEMIC_DAYS[5].labelEn).toBe('Thursday')
  })

  it('formats weekday names correctly in English and Bengali', () => {
    expect(getWeekdayName('2026-05-23', 'en')).toBe('Saturday')
    expect(getWeekdayName('2026-05-23', 'bn')).toBe('শনিবার')
    expect(getWeekdayName('2026-05-25', 'en')).toBe('Monday')
    expect(getWeekdayName('2026-05-25', 'bn')).toBe('সোমবার')
  })
})

describe('Class Routine PDF Generator', () => {
  it('generates a valid vector A4 Landscape PDF with EIIN and class headers', () => {
    const pdfBytes = createClassRoutinePdf({
      schoolName: 'Agrani Model High School',
      eiin: '108234',
      className: 'Class 7',
      sectionName: 'Padma',
      academicYear: '2026',
      shift: 'Day Shift',
      effectiveDate: '2026-05-25',
      slots: [
        {
          dayOfWeek: 1,
          period: 1,
          subjectName: 'Math',
          teacherName: 'Rahim',
          room: '201',
        },
        {
          dayOfWeek: 1,
          period: 2,
          subjectName: 'Science',
          teacherName: 'Karim',
          room: 'Lab 1',
        },
      ],
    })

    expect(pdfBytes.byteLength).toBeGreaterThan(500)
    const text = new TextDecoder().decode(pdfBytes)
    expect(text.startsWith('%PDF-1.4')).toBe(true)
    expect(text.includes('AGRANI MODEL HIGH SCHOOL')).toBe(true)
    expect(text.includes('108234')).toBe(true)
    expect(text.includes('Class: Class 7 (Padma)')).toBe(true)
    expect(text.includes('ACADEMIC CLASS ROUTINE & TIMETABLE MATRIX')).toBe(true)
    expect(text.includes('%%EOF')).toBe(true)
  })
})

describe('Exam Routine PDF Generator', () => {
  it('generates a valid vector A4 Portrait PDF with examinee code of conduct and exam schedule rows', () => {
    const pdfBytes = createExamRoutinePdf({
      schoolName: 'Agrani Model High School',
      eiin: '108234',
      academicYear: '2026',
      examTitle: 'Half-Yearly Examination 2026',
      className: 'Class 7',
      shift: 'Day Shift',
      items: [
        {
          date: '2026-06-15',
          dayOfWeek: 'Monday',
          timeSlot: '10:00 AM - 1:00 PM',
          subjectName: 'Mathematics',
          paperCode: 'MTH-101',
          totalMarks: 100,
          room: 'Hall A',
          invigilator: 'Abdur Rahim',
        },
        {
          date: '2026-06-17',
          dayOfWeek: 'Wednesday',
          timeSlot: '10:00 AM - 1:00 PM',
          subjectName: 'English 1st Paper',
          paperCode: 'ENG-101',
          totalMarks: 100,
          room: 'Hall A',
          invigilator: 'Nasreen Akter',
        },
      ],
    })

    expect(pdfBytes.byteLength).toBeGreaterThan(600)
    const text = new TextDecoder().decode(pdfBytes)
    expect(text.startsWith('%PDF-1.4')).toBe(true)
    expect(text.includes('AGRANI MODEL HIGH SCHOOL')).toBe(true)
    expect(text.includes('108234')).toBe(true)
    expect(text.includes('Half-Yearly Examination 2026')).toBe(true)
    expect(text.includes('SPECIAL INSTRUCTIONS FOR EXAMINEES')).toBe(true)
    expect(text.includes('Mathematics')).toBe(true)
    expect(text.includes('%%EOF')).toBe(true)
  })
})
