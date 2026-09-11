import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Exam, ExamQuestion, ExamState } from '@/types/models'

export interface ExamWithStats extends Exam {
  class_name: string | null
  subject_name: string | null
  /** Number of marks entered for this exam. */
  results_count: number
  /** Class average as a 0–100 percentage, null until results exist. */
  avg_pct: number | null
}

export function useExamQuestions(examId: string | null) {
  return useQuery({
    queryKey: ['exam-questions', examId], enabled: Boolean(examId),
    queryFn: async (): Promise<ExamQuestion[]> => {
      const { data, error } = await supabase.from('exam_questions').select('*').eq('exam_id', examId!).order('position')
      if (error) throw error
      return (data ?? []) as ExamQuestion[]
    },
  })
}

export interface SaveExamInput { id: string | null; classId: string; subjectId: string; name: string; date: string; totalMarks: number; state: ExamState }
export function useSaveExam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: SaveExamInput) => {
      const { error } = await supabase.rpc('save_exam_schedule', { target_exam_id: input.id, target_class_id: input.classId, target_subject_id: input.subjectId, target_name: input.name, target_date: input.date, target_total_marks: input.totalMarks, target_state: input.state })
      if (error) throw error
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['exams'] }) },
  })
}

export function useDeleteExam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.rpc('delete_exam_schedule', { target_exam_id: id }); if (error) throw error },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['exams'] }) },
  })
}

type ExamJoinRow = Exam & {
  classes: { name: string } | null
  subjects: { name: string } | null
  results: { marks_obtained: number | null }[]
}

export function useExams() {
  return useQuery({
    queryKey: ['exams'],
    queryFn: async (): Promise<ExamWithStats[]> => {
      const { data, error } = await supabase
        .from('exams')
        .select('*, classes(name), subjects(name), results(marks_obtained)')
        .order('exam_date', { ascending: false })
      if (error) throw error
      return ((data ?? []) as ExamJoinRow[]).map((r) => {
        const marks = (r.results ?? [])
          .map((x) => x.marks_obtained)
          .filter((m): m is number => m != null)
        const avg =
          marks.length && r.total_marks
            ? Math.round((marks.reduce((s, m) => s + m, 0) / marks.length / r.total_marks) * 100)
            : null
        return {
          ...r,
          class_name: r.classes?.name ?? null,
          subject_name: r.subjects?.name ?? null,
          results_count: marks.length,
          avg_pct: avg,
        }
      })
    },
  })
}
