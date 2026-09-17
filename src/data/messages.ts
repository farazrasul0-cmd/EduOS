import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Message, MessageThread } from '@/types/models'

export interface ThreadJoined extends MessageThread {
  guardian_name: string | null
  student_name: string | null
  student_roll: string | null
  last_body: string | null
  unread_count: number
}

type ThreadJoinRow = MessageThread & {
  guardians: { full_name: string } | null
  students: { full_name: string; roll_no: string | null } | null
  messages: { body: string; created_at: string; sender_id: string | null; read_at: string | null }[]
}

export function useThreads(userId?: string) {
  const qc = useQueryClient()
  useEffect(() => { const channel = supabase.channel(`message-list-${Math.random().toString(36).slice(2, 9)}`).on('postgres_changes', { event:'*', schema:'public', table:'messages' }, () => { void qc.invalidateQueries({queryKey:['threads']}) }).subscribe(); return () => { void supabase.removeChannel(channel) } }, [qc])
  return useQuery({
    queryKey: ['threads'],
    queryFn: async (): Promise<ThreadJoined[]> => {
      const { data, error } = await supabase
        .from('message_threads')
        .select('*, guardians(full_name), students(full_name, roll_no), messages(body, created_at, sender_id, read_at)')
        .order('last_message_at', { ascending: false })
      if (error) throw error
      return ((data ?? []) as ThreadJoinRow[]).map((r) => {
        const msgs = [...(r.messages ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at))
        return {
          ...r,
          guardian_name: r.guardians?.full_name ?? null,
          student_name: r.students?.full_name ?? null,
          student_roll: r.students?.roll_no ?? null,
          last_body: msgs[msgs.length - 1]?.body ?? null,
          unread_count: msgs.filter((m) => m.sender_id !== userId && m.read_at == null).length,
        }
      })
    },
  })
}

export function useMessages(threadId: string | null) {
  const qc = useQueryClient()
  useEffect(() => { if (!threadId) return; const channel = supabase.channel(`messages:${threadId}-${Math.random().toString(36).slice(2, 9)}`).on('postgres_changes', { event:'*', schema:'public', table:'messages', filter:`thread_id=eq.${threadId}` }, () => { void qc.invalidateQueries({queryKey:['messages',threadId]}); void qc.invalidateQueries({queryKey:['threads']}) }).subscribe(); return () => { void supabase.removeChannel(channel) } }, [threadId,qc])
  return useQuery({
    queryKey: ['messages', threadId],
    enabled: !!threadId,
    queryFn: async (): Promise<Message[]> => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId as string)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as Message[]
    },
  })
}

export function useSendMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { school_id: string; thread_id: string; sender_id: string; body: string }) => {
      const { error } = await supabase.from('messages').insert(input)
      if (error) throw error
    },
    onSuccess: (_d, input) => {
      void qc.invalidateQueries({ queryKey: ['messages', input.thread_id] })
      void qc.invalidateQueries({ queryKey: ['threads'] })
    },
  })
}

export interface MessageRecipient { guardian_id:string; guardian_name:string; student_id:string; student_name:string }
export function useMessageRecipients() { return useQuery({ queryKey:['message-recipients'], queryFn: async (): Promise<MessageRecipient[]> => {
  const { data,error } = await supabase.from('student_guardians').select('guardians(id,full_name), students(id,full_name)')
  if(error) throw error
  return ((data ?? []) as unknown as {guardians:{id:string;full_name:string}|null;students:{id:string;full_name:string}|null}[]).filter((x) => x.guardians && x.students).map((x) => ({guardian_id:x.guardians!.id,guardian_name:x.guardians!.full_name,student_id:x.students!.id,student_name:x.students!.full_name}))
} }) }

export function useCreateThread() { const qc=useQueryClient(); return useMutation({ mutationFn:async(x:{guardianId:string;studentId:string}) => { const {data,error}=await supabase.rpc('create_message_thread',{target_guardian_id:x.guardianId,target_student_id:x.studentId}); if(error) throw error; return data as string }, onSuccess:()=>{void qc.invalidateQueries({queryKey:['threads']})} }) }
export function useMarkThreadRead() { const qc=useQueryClient(); return useMutation({ mutationFn:async(id:string)=>{const{error}=await supabase.rpc('mark_thread_read',{target_thread_id:id});if(error)throw error},onSuccess:(_d,id)=>{void qc.invalidateQueries({queryKey:['threads']});void qc.invalidateQueries({queryKey:['messages',id]})} }) }

export interface StudentStats {
  attendancePct: number | null
  avgScorePct: number | null
  feesStatus: 'paid' | 'pending' | null
}

/** Lightweight per-student aggregates for the chat sidebar. */
export function useStudentStats(studentId: string | null) {
  return useQuery({
    queryKey: ['student-stats', studentId],
    enabled: !!studentId,
    queryFn: async (): Promise<StudentStats> => {
      const sid = studentId as string
      const [att, res, inv] = await Promise.all([
        supabase.from('attendance_records').select('status').eq('student_id', sid),
        supabase.from('results').select('marks_obtained, exams(total_marks)').eq('student_id', sid),
        supabase.from('invoices').select('status').eq('student_id', sid),
      ])
      if (att.error) throw att.error
      if (res.error) throw res.error
      if (inv.error) throw inv.error

      const attRows = (att.data ?? []) as { status: string }[]
      const attendancePct = attRows.length
        ? Math.round((attRows.filter((r) => r.status === 'present').length / attRows.length) * 100)
        : null

      // exams is a many-to-one embed; PostgREST returns an object, not an array.
      const resRows = (res.data ?? []) as unknown as {
        marks_obtained: number | null
        exams: { total_marks: number } | null
      }[]
      const pcts = resRows
        .filter((r) => r.marks_obtained != null && r.exams?.total_marks)
        .map((r) => (Number(r.marks_obtained) / Number(r.exams!.total_marks)) * 100)
      const avgScorePct = pcts.length ? Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length) : null

      const invRows = (inv.data ?? []) as { status: string }[]
      const feesStatus = invRows.length ? (invRows.every((r) => r.status === 'paid') ? 'paid' : 'pending') : null

      return { attendancePct, avgScorePct, feesStatus }
    },
  })
}
