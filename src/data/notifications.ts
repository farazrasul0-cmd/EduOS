import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AppNotificationRow } from '@/types/models'

/**
 * Notification rows store a machine `type` plus JSON params in `body`, so the
 * UI re-localizes them with i18n at render time (bilingual regardless of the
 * language active when the event happened). `title` is an English fallback.
 */
export type NotificationType =
  | 'fee_paid'
  | 'attendance_saved'
  | 'attendance_absent'
  | 'assignment_published'
  | 'results_published'
  | 'student_added'

export interface AppNotification extends AppNotificationRow {
  params: Record<string, string>
}

export function useNotifications() {
  const qc = useQueryClient()
  useEffect(() => {
    const channelId = `notifications-feed-${Math.random().toString(36).slice(2, 9)}`
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        void qc.invalidateQueries({ queryKey: ['notifications'] })
      })
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [qc])

  return useQuery({
    queryKey: ['notifications'],
    queryFn: async (): Promise<AppNotification[]> => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30)
      if (error) throw error
      return ((data ?? []) as AppNotificationRow[]).map((r) => {
        let params: Record<string, string> = {}
        try {
          params = r.body ? (JSON.parse(r.body) as Record<string, string>) : {}
        } catch {
          // Body wasn't JSON (e.g. hand-written row) — render title fallback.
        }
        return { ...r, params }
      })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser()
      if (!u.user) return
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', u.user.id)
        .eq('read', false)
      if (error) throw error
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

/**
 * Fire-and-forget event notification for the signed-in user. Failures are
 * swallowed — a missing notification must never break the user's action.
 */
export async function notify(
  schoolId: string,
  type: NotificationType,
  fallbackTitle: string,
  params: Record<string, string>,
): Promise<void> {
  try {
    const { data: u } = await supabase.auth.getUser()
    if (!u.user) return
    await supabase.from('notifications').insert({
      school_id: schoolId,
      user_id: u.user.id,
      type,
      title: fallbackTitle,
      body: JSON.stringify(params),
    })
  } catch {
    // Never let notification plumbing break the primary mutation.
  }
}
