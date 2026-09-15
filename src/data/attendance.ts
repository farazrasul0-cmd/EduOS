import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { notify } from '@/data/notifications'
import type { AttendanceStatus } from '@/types/models'

export interface AttendanceRow {
  student_id: string
  status: AttendanceStatus
}

export function useAttendance(date: string) {
  return useQuery({
    queryKey: ['attendance', date],
    queryFn: async (): Promise<AttendanceRow[]> => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('student_id, status')
        .eq('date', date)
      if (error) throw error
      return (data ?? []) as AttendanceRow[]
    },
  })
}

export interface AttendanceDay {
  date: string
  present: number
  absent: number
  late: number
  leave: number
  total: number
}

/** Per-date present/total across all saved records (for dashboard charts). */
export function useAttendanceOverview() {
  return useQuery({
    queryKey: ['attendance-overview'],
    queryFn: async (): Promise<AttendanceDay[]> => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('date, status')
        .order('date', { ascending: true })
      if (error) throw error
      const byDate = new Map<string, AttendanceDay>()
      for (const r of (data ?? []) as { date: string; status: string }[]) {
        const d = byDate.get(r.date) ?? { date: r.date, present: 0, absent: 0, late: 0, leave: 0, total: 0 }
        d.total += 1
        if (r.status === 'present') d.present += 1
        if (r.status === 'absent') d.absent += 1
        if (r.status === 'late') d.late += 1
        if (r.status === 'leave') d.leave += 1
        byDate.set(r.date, d)
      }
      return [...byDate.values()]
    },
  })
}

export interface SaveAttendanceRow {
  school_id: string
  student_id: string
  class_id: string | null
  date: string
  status: AttendanceStatus
}

export function useSaveAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ rows, notifyParents }: { rows: SaveAttendanceRow[]; notifyParents: boolean }) => {
      const { data: authData } = await supabase.auth.getUser()
      const payload = rows.map((row) => ({ ...row, marked_by: authData.user?.id ?? null }))
      const { error } = await supabase
        .from('attendance_records')
        .upsert(payload, { onConflict: 'student_id,date' })
      if (error) throw error
      if (rows.length) {
        const absent = rows.filter((r) => r.status === 'absent').length
        await notify(rows[0].school_id, 'attendance_saved', 'Attendance saved', {
          date: rows[0].date,
          present: String(rows.filter((r) => r.status === 'present').length),
          absent: String(absent),
        })
        if (notifyParents && absent) {
          const { error: notifyError } = await supabase.rpc('notify_absent_guardians', {
            target_school_id: rows[0].school_id,
            target_date: rows[0].date,
            absent_student_ids: rows.filter((r) => r.status === 'absent').map((r) => r.student_id),
          })
          if (notifyError) throw notifyError
        }
      }
    },
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ['attendance', variables.rows[0]?.date] })
      void qc.invalidateQueries({ queryKey: ['attendance-overview'] })
      void qc.invalidateQueries({ queryKey: ['attendance-monthly'] })
      void qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export interface StudentMonthlyAttendanceRecord {
  student_id: string
  date: string
  status: AttendanceStatus
}

export function useMonthlyAttendance(monthPrefix: string) {
  return useQuery({
    queryKey: ['attendance-monthly', monthPrefix],
    queryFn: async (): Promise<StudentMonthlyAttendanceRecord[]> => {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('student_id, date, status')
        .gte('date', `${monthPrefix}-01`)
        .lte('date', `${monthPrefix}-31`)
        .order('date', { ascending: true })
      if (error) throw error
      return (data ?? []) as StudentMonthlyAttendanceRecord[]
    },
  })
}

