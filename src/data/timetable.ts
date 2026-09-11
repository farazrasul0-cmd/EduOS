import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { TimetableSlot } from '@/types/models'

export interface SlotJoined extends TimetableSlot {
  class_name: string | null
  subject_name: string | null
  teacher_name: string | null
}

type SlotJoinRow = TimetableSlot & {
  classes: { name: string } | null
  subjects: { name: string } | null
  profiles: { full_name: string } | null
}

export function useTimetable() {
  return useQuery({
    queryKey: ['timetable'],
    queryFn: async (): Promise<SlotJoined[]> => {
      const { data, error } = await supabase
        .from('timetable_slots')
        .select('*, classes(name), subjects(name), profiles!timetable_slots_teacher_id_fkey(full_name)')
        .order('day_of_week')
        .order('period')
      if (error) throw error
      return ((data ?? []) as SlotJoinRow[]).map((r) => ({
        ...r,
        class_name: r.classes?.name ?? null,
        subject_name: r.subjects?.name ?? null,
        teacher_name: r.profiles?.full_name ?? null,
      }))
    },
  })
}

export interface TimetableTeacher { id: string; full_name: string }
export function useTimetableTeachers(enabled = true) {
  return useQuery({ queryKey: ['timetable-teachers'], queryFn: async (): Promise<TimetableTeacher[]> => {
    const { data, error } = await supabase.from('profiles').select('id,full_name').in('role', ['owner', 'admin', 'teacher']).order('full_name')
    if (error) throw error
    return (data ?? []) as TimetableTeacher[]
  }, enabled })
}

export interface SaveTimetableSlotInput { id: string | null; classId: string; subjectId: string; teacherId: string | null; day: number; period: number; start: string | null; end: string | null; room: string }
export function useSaveTimetableSlot() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: async (x: SaveTimetableSlotInput) => {
    const { error } = await supabase.rpc('save_timetable_slot', { target_slot_id:x.id, target_class_id:x.classId, target_subject_id:x.subjectId, target_teacher_id:x.teacherId, target_day:x.day, target_period:x.period, target_start:x.start, target_end:x.end, target_room:x.room })
    if (error) throw error
  }, onSuccess: () => { void qc.invalidateQueries({ queryKey: ['timetable'] }) } })
}

export function useDeleteTimetableSlot() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.rpc('delete_timetable_slot', { target_slot_id:id }); if (error) throw error }, onSuccess: () => { void qc.invalidateQueries({ queryKey: ['timetable'] }) } })
}
