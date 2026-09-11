// Hand-written domain types mirroring supabase/migrations/0001_init.sql.
// These are app-facing shapes used while wiring pages to live data.
// Once the project is linked, `npm run db:types` generates the exact DB types
// into src/types/supabase.ts; prefer those for query results.

export type UserRole = 'owner' | 'admin' | 'teacher' | 'parent' | 'student'
export type AppLanguageCode = 'en' | 'bn'
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave'
export type AssignmentState = 'draft' | 'open' | 'closed'
export type SubmissionStatus = 'in_progress' | 'submitted' | 'graded' | 'missing'
export type ExamState = 'draft' | 'scheduled' | 'published'
export type QuestionType = 'short' | 'mcq' | 'long'
export type InvoiceStatus = 'paid' | 'due' | 'overdue' | 'partial'
export type PaymentMethod = 'bkash' | 'nagad' | 'rocket' | 'upay' | 'card' | 'bank' | 'cash'
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded'
export type EventType = 'exam' | 'ptm' | 'assignment' | 'event' | 'holiday' | 'meeting' | 'class'

export interface School {
  id: string
  name: string
  slug: string | null
  affiliation: string | null
  address: string | null
  currency: string
  academic_year: string | null
}

export interface Profile {
  id: string
  school_id: string | null
  full_name: string
  email: string | null
  phone: string | null
  role: UserRole
  avatar_url: string | null
  language: AppLanguageCode
}

export interface ClassRow {
  id: string
  school_id: string
  name: string
  grade: string | null
  teacher_id: string | null
}

export interface Subject {
  id: string
  school_id: string
  name: string
  code: string | null
}

export interface Student {
  id: string
  school_id: string
  class_id: string | null
  profile_id: string | null
  roll_no: string | null
  full_name: string
  dob: string | null
  avatar_url: string | null
  status: string
}

export interface Guardian {
  id: string
  school_id: string
  profile_id: string | null
  full_name: string
  email: string | null
  phone: string | null
  relationship: string | null
}

export interface AttendanceRecord {
  id: string
  school_id: string
  student_id: string
  class_id: string | null
  date: string
  status: AttendanceStatus
  marked_by: string | null
}

export interface Assignment {
  id: string
  school_id: string
  class_id: string | null
  subject_id: string | null
  title: string
  instructions: string | null
  due_at: string | null
  points: number
  state: AssignmentState
  created_by: string | null
}

export interface Submission {
  id: string
  school_id: string
  assignment_id: string
  student_id: string
  status: SubmissionStatus
  file_url: string | null
  file_name: string | null
  late: boolean
  submitted_at: string | null
  grade: number | null
  feedback: string | null
}

export interface Exam {
  id: string
  school_id: string
  class_id: string | null
  subject_id: string | null
  name: string
  exam_date: string | null
  total_marks: number
  state: ExamState
}

export interface ExamQuestion {
  id: string
  school_id: string
  exam_id: string
  position: number
  type: QuestionType
  prompt: string
  marks: number
  options: string[] | null
  correct_index: number | null
}

export interface Result {
  id: string
  school_id: string
  exam_id: string
  student_id: string
  marks_obtained: number | null
  grade: string | null
  published: boolean
}

export interface FeePlan {
  id: string
  school_id: string
  name: string
  amount: number
  period: string | null
}

export interface Invoice {
  id: string
  school_id: string
  student_id: string
  fee_plan_id: string | null
  invoice_no: string
  amount: number
  paid_amount: number
  due_date: string | null
  status: InvoiceStatus
  issued_at: string
}

export interface Payment {
  id: string
  school_id: string
  invoice_id: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  reference: string | null
  gateway: string | null
  paid_at: string
}

export interface TimetableSlot {
  id: string
  school_id: string
  class_id: string
  subject_id: string | null
  teacher_id: string | null
  day_of_week: number
  period: number
  start_time: string | null
  end_time: string | null
  room: string | null
}

export interface CalendarEvent {
  id: string
  school_id: string
  title: string
  description: string | null
  type: EventType
  event_date: string
  event_time: string | null
  location: string | null
  class_id: string | null
}

export interface MessageThread {
  id: string
  school_id: string
  teacher_id: string | null
  guardian_id: string | null
  student_id: string | null
  last_message_at: string | null
}

export interface Message {
  id: string
  school_id: string
  thread_id: string
  sender_id: string | null
  body: string
  read_at: string | null
  created_at: string
}

export interface AppNotificationRow {
  id: string
  school_id: string
  user_id: string
  type: string | null
  title: string
  body: string | null
  read: boolean
  created_at: string
}
