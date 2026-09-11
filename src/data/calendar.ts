import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CalendarEvent } from '@/types/models'

export function useCalendarEvents() {
  return useQuery({
    queryKey: ['calendar-events'],
    queryFn: async (): Promise<CalendarEvent[]> => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('event_date', { ascending: true })
      if (error) throw error
      return (data ?? []) as CalendarEvent[]
    },
  })
}

export interface SaveCalendarEventInput { id: string | null; school_id: string; created_by: string; title: string; description: string | null; type: CalendarEvent['type']; event_date: string; event_time: string | null; location: string | null; class_id: string | null }
export function useSaveCalendarEvent() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: async (x: SaveCalendarEventInput) => {
    const { id, ...row } = x
    const result = id ? await supabase.from('calendar_events').update(row).eq('id', id) : await supabase.from('calendar_events').insert(row)
    if (result.error) throw result.error
  }, onSuccess: () => { void qc.invalidateQueries({ queryKey: ['calendar-events'] }) } })
}

export function useDeleteCalendarEvent() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from('calendar_events').delete().eq('id', id); if (error) throw error }, onSuccess: () => { void qc.invalidateQueries({ queryKey: ['calendar-events'] }) } })
}
