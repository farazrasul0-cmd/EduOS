import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { notify } from '@/data/notifications'
import type { Assignment, Submission, Subject } from '@/types/models'

export interface AssignmentWithStats extends Assignment {
  class_name: string | null
  subject_name: string | null
  submitted_count: number
  graded_count: number
}

type AssignmentJoinRow = Assignment & {
  classes: { name: string } | null
  subjects: { name: string } | null
  submissions: { status: string }[]
}

export function useAssignments() {
  return useQuery({
    queryKey: ['assignments'],
    queryFn: async (): Promise<AssignmentWithStats[]> => {
      const { data, error } = await supabase
        .from('assignments')
        .select('*, classes(name), subjects(name), submissions(status)')
        .order('due_at', { ascending: false })
      if (error) throw error
      return ((data ?? []) as AssignmentJoinRow[]).map((r) => {
        const subs = r.submissions ?? []
        return {
          ...r,
          class_name: r.classes?.name ?? null,
          subject_name: r.subjects?.name ?? null,
          submitted_count: subs.filter((s) => s.status === 'submitted' || s.status === 'graded').length,
          graded_count: subs.filter((s) => s.status === 'graded').length,
        }
      })
    },
  })
}

export interface SubmissionWithStudent extends Submission {
  student_name: string | null
  student_roll: string | null
}

type SubmissionJoinRow = Submission & {
  students: { full_name: string; roll_no: string | null } | null
}

export function useSubmissions(assignmentId: string | null) {
  return useQuery({
    queryKey: ['submissions', assignmentId],
    enabled: !!assignmentId,
    queryFn: async (): Promise<SubmissionWithStudent[]> => {
      const { data, error } = await supabase
        .from('submissions')
        .select('*, students(full_name, roll_no)')
        .eq('assignment_id', assignmentId as string)
      if (error) throw error
      return ((data ?? []) as SubmissionJoinRow[]).map((r) => ({
        ...r,
        grade: r.grade != null ? Number(r.grade) : null,
        student_name: r.students?.full_name ?? null,
        student_roll: r.students?.roll_no ?? null,
      }))
    },
  })
}

export function useGradeSubmission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; grade: number; feedback: string | null }) => {
      const { error } = await supabase
        .from('submissions')
        .update({ grade: input.grade, feedback: input.feedback, status: 'graded' })
        .eq('id', input.id)
      if (error) throw error
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['submissions'] })
      void qc.invalidateQueries({ queryKey: ['assignments'] })
    },
  })
}

export function useSubjects() {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: async (): Promise<Subject[]> => {
      const { data, error } = await supabase.from('subjects').select('*').order('name')
      if (error) throw error
      return (data ?? []) as Subject[]
    },
  })
}

export interface NewAssignment {
  school_id: string
  class_id: string | null
  subject_id: string | null
  title: string
  instructions: string | null
  due_at: string | null
  points: number
  state: 'draft' | 'open'
  files: File[]
}

const safeName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '-')
export const validAssignmentFile = (file: File) => file.size > 0 && file.size <= 25 * 1024 * 1024 && ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg'].includes(file.type)

export function useCreateAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewAssignment) => {
      if (input.files.some((file) => !validAssignmentFile(file))) throw new Error('Only PDF, DOCX, PNG, or JPEG files up to 25 MB are allowed.')
      const { files, ...row } = input
      const { data: assignmentId, error } = await supabase.rpc('create_assignment_with_roster', { input: row })
      if (error) throw error
      for (const file of files) {
        const path = `${input.school_id}/assignments/${assignmentId}/${crypto.randomUUID()}-${safeName(file.name)}`
        const { error: uploadError } = await supabase.storage.from('assignment-files').upload(path, file)
        if (uploadError) throw uploadError
        const { error: metaError } = await supabase.from('assignment_attachments').insert({ school_id: input.school_id, assignment_id: assignmentId, file_name: file.name, file_url: path, file_size: file.size, mime_type: file.type })
        if (metaError) throw metaError
      }
      if (input.state === 'open') {
        void notify(input.school_id, 'assignment_published', `Assignment "${input.title}" published`, {
          title: input.title,
        })
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['assignments'] })
      void qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export async function openAssignmentFile(path: string) {
  const { data, error } = await supabase.storage.from('assignment-files').createSignedUrl(path, 300)
  if (error) throw error
  window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
}

export function useSubmitAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { studentId: string; schoolId: string; assignmentId: string; userId: string; file: File; dueAt: string | null }) => {
      if (!validAssignmentFile(input.file)) throw new Error('Only PDF, DOCX, PNG, or JPEG files up to 25 MB are allowed.')
      const path = `${input.schoolId}/submissions/${input.assignmentId}/${input.userId}/${crypto.randomUUID()}-${safeName(input.file.name)}`
      const { error: uploadError } = await supabase.storage.from('assignment-files').upload(path, input.file)
      if (uploadError) throw uploadError
      const { error } = await supabase.from('submissions').upsert({ school_id: input.schoolId, assignment_id: input.assignmentId, student_id: input.studentId, file_url: path, file_name: input.file.name, status: 'submitted', submitted_at: new Date().toISOString(), late: input.dueAt ? Date.now() > new Date(input.dueAt).getTime() : false }, { onConflict: 'assignment_id,student_id' })
      if (error) throw error
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['submissions'] }); void qc.invalidateQueries({ queryKey: ['assignments'] }) },
  })
}
