import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { notify } from '@/data/notifications'
import type { Result } from '@/types/models'
import { gradeForPercentage } from '@/lib/grading'

export interface ResultJoined extends Result {
  exam_name: string | null
  exam_total: number
  subject_name: string | null
  student_name: string | null
  student_roll: string | null
}

type ResultJoinRow = Result & {
  exams: { name: string; total_marks: number; subjects: { name: string } | null } | null
  students: { full_name: string; roll_no: string | null } | null
}

export function useResults() {
  return useQuery({
    queryKey: ['results'],
    queryFn: async (): Promise<ResultJoined[]> => {
      const { data, error } = await supabase
        .from('results')
        .select('*, exams(name, total_marks, subjects(name)), students(full_name, roll_no)')
      if (error) throw error
      return ((data ?? []) as ResultJoinRow[]).map((r) => ({
        ...r,
        marks_obtained: r.marks_obtained != null ? Number(r.marks_obtained) : null,
        exam_name: r.exams?.name ?? null,
        exam_total: Number(r.exams?.total_marks ?? 100),
        subject_name: r.exams?.subjects?.name ?? null,
        student_name: r.students?.full_name ?? null,
        student_roll: r.students?.roll_no ?? null,
      }))
    },
  })
}

export interface SaveResultRow {
  school_id: string
  exam_id: string
  student_id: string
  marks_obtained: number | null
  grade: string | null
  published: boolean
}

export function useSaveResults() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { rows: SaveResultRow[]; examName: string }) => {
      const { error } = await supabase.rpc('save_exam_results', {
        result_rows: input.rows,
        publish_now: Boolean(input.rows[0]?.published),
      })
      if (error) throw error
      if (input.rows[0]?.published) {
        void notify(input.rows[0].school_id, 'results_published', `Results published for ${input.examName}`, {
          exam: input.examName,
        })
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['results'] })
      void qc.invalidateQueries({ queryKey: ['exams'] })
      void qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

/** Grade letter from a 0–100 percentage (matches the design's scale). */
export function gradeFromPct(pct: number): string {
  return gradeForPercentage(pct).letter
}
