import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { notify } from '@/data/notifications'
import type { ClassRow, Student } from '@/types/models'

export interface StudentWithClass extends Student {
  class_name: string | null
}

type StudentJoinRow = Student & { classes: { name: string } | null }

export function useStudents() {
  return useQuery({
    queryKey: ['students'],
    queryFn: async (): Promise<StudentWithClass[]> => {
      const { data, error } = await supabase
        .from('students')
        .select('*, classes(name)')
        .order('roll_no', { ascending: true })
      if (error) throw error
      return ((data ?? []) as StudentJoinRow[]).map((r) => ({
        ...r,
        class_name: r.classes?.name ?? null,
      }))
    },
  })
}

export function useClasses() {
  return useQuery({
    queryKey: ['classes'],
    queryFn: async (): Promise<ClassRow[]> => {
      const { data, error } = await supabase.from('classes').select('*').order('name', { ascending: true })
      if (error) throw error
      return (data ?? []) as ClassRow[]
    },
  })
}

export interface ClassTeacher { id:string; full_name:string }
export function useClassTeachers(enabled=true) { return useQuery({queryKey:['class-teachers'],enabled,queryFn:async():Promise<ClassTeacher[]>=>{const{data,error}=await supabase.from('profiles').select('id,full_name').eq('role','teacher').order('full_name');if(error)throw error;return(data??[]) as ClassTeacher[]}}) }

export function useSaveClass(){const qc=useQueryClient();return useMutation({mutationFn:async(x:{id:string|null;name:string;grade:string;teacherId:string|null})=>{const{error}=await supabase.rpc('save_school_class',{target_id:x.id,target_name:x.name,target_grade:x.grade,target_teacher_id:x.teacherId});if(error)throw error},onSuccess:()=>{void qc.invalidateQueries({queryKey:['classes']})}})}

export interface StudentDetailData {
  student: StudentWithClass
  attendance: { id: string; date: string; status: string }[]
  invoices: { id: string; invoice_no: string; amount: number; paid_amount: number; due_date: string | null; status: string }[]
  submissions: { id: string; status: string; grade: number | null; submitted_at: string | null; assignment_title: string; assignment_points: number }[]
  results: { id: string; marks_obtained: number | null; grade: string | null; exam_name: string; exam_date: string | null; total_marks: number; subject_name: string | null }[]
  guardians: { id: string; profile_id: string | null; full_name: string; email: string | null; phone: string | null; relationship: string | null; is_primary: boolean }[]
}

export function useStudentDetail(studentId: string | undefined) {
  return useQuery({
    queryKey: ['student-detail', studentId],
    enabled: !!studentId,
    queryFn: async (): Promise<StudentDetailData> => {
      const id = studentId as string
      const [studentRes, attendanceRes, invoicesRes, submissionsRes, resultsRes, guardiansRes] = await Promise.all([
        supabase.from('students').select('*, classes(name)').eq('id', id).single(),
        supabase.from('attendance_records').select('id,date,status').eq('student_id', id).order('date', { ascending: false }),
        supabase.from('invoices').select('id,invoice_no,amount,paid_amount,due_date,status').eq('student_id', id).order('due_date', { ascending: false }),
        supabase.from('submissions').select('id,status,grade,submitted_at,assignments(title,points)').eq('student_id', id).order('submitted_at', { ascending: false }),
        supabase.from('results').select('id,marks_obtained,grade,exams(name,exam_date,total_marks,subjects(name))').eq('student_id', id).eq('published', true),
        supabase.from('student_guardians').select('is_primary,guardians(id,profile_id,full_name,email,phone,relationship)').eq('student_id', id),
      ])
      const error = studentRes.error ?? attendanceRes.error ?? invoicesRes.error ?? submissionsRes.error ?? resultsRes.error ?? guardiansRes.error
      if (error) throw error

      const studentRow = studentRes.data as StudentJoinRow
      const submissions = (submissionsRes.data ?? []) as unknown as {
        id: string; status: string; grade: number | null; submitted_at: string | null
        assignments: { title: string; points: number } | null
      }[]
      const results = (resultsRes.data ?? []) as unknown as {
        id: string; marks_obtained: number | null; grade: string | null
        exams: { name: string; exam_date: string | null; total_marks: number; subjects: { name: string } | null } | null
      }[]
      const guardians = (guardiansRes.data ?? []) as unknown as {
        is_primary: boolean
        guardians: { id: string; profile_id: string | null; full_name: string; email: string | null; phone: string | null; relationship: string | null } | null
      }[]

      return {
        student: { ...studentRow, class_name: studentRow.classes?.name ?? null },
        attendance: (attendanceRes.data ?? []) as StudentDetailData['attendance'],
        invoices: (invoicesRes.data ?? []) as StudentDetailData['invoices'],
        submissions: submissions.map((row) => ({
          id: row.id,
          status: row.status,
          grade: row.grade,
          submitted_at: row.submitted_at,
          assignment_title: row.assignments?.title ?? '—',
          assignment_points: row.assignments?.points ?? 0,
        })),
        results: results.map((row) => ({
          id: row.id,
          marks_obtained: row.marks_obtained,
          grade: row.grade,
          exam_name: row.exams?.name ?? '—',
          exam_date: row.exams?.exam_date ?? null,
          total_marks: row.exams?.total_marks ?? 0,
          subject_name: row.exams?.subjects?.name ?? null,
        })),
        guardians: guardians.filter((row) => row.guardians != null).map((row) => ({ ...row.guardians!, is_primary: row.is_primary })),
      }
    },
  })
}

export interface NewStudent {
  school_id: string
  full_name: string
  class_id: string | null
  roll_no: string | null
  dob: string | null
  avatar_url?: string | null
}

/** Upload a student photo to the public avatars bucket; returns its URL. */
export async function uploadAvatar(schoolId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${schoolId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('avatars').upload(path, file, {
    contentType: file.type,
    upsert: false,
  })
  if (error) throw error
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
}

export function useAddStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewStudent) => {
      const { error } = await supabase.from('students').insert(input)
      if (error) throw error
      void notify(input.school_id, 'student_added', `${input.full_name} joined the school`, {
        name: input.full_name,
      })
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['students'] })
      void qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useUpdateStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; update: Partial<Pick<Student, 'full_name' | 'roll_no' | 'dob' | 'class_id' | 'status'>> }) => {
      const { error } = await supabase.from('students').update(input.update).eq('id', input.id)
      if (error) throw error
    },
    onSuccess: (_data, input) => {
      void qc.invalidateQueries({ queryKey: ['students'] })
      void qc.invalidateQueries({ queryKey: ['student-detail', input.id] })
    },
  })
}

export function useLinkGuardian() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      studentId: string
      name: string
      email: string | null
      phone: string | null
      relationship: string | null
      primary: boolean
    }) => {
      const { error } = await supabase.rpc('link_guardian_to_student', {
        target_student_id: input.studentId,
        guardian_name: input.name,
        guardian_email: input.email,
        guardian_phone: input.phone,
        guardian_relationship: input.relationship,
        make_primary: input.primary,
      })
      if (error) throw error
    },
    onSuccess: (_data, input) => {
      void qc.invalidateQueries({ queryKey: ['student-detail', input.studentId] })
    },
  })
}

export function useImportStudents() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (rows: NewStudent[]) => {
      if (rows.length === 0) return
      const { error } = await supabase.from('students').insert(rows)
      if (error) throw error
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['students'] })
    },
  })
}

export function useInviteGuardian() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/` },
      })
      if (error) throw error
    },
  })
}
