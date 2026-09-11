import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface NotificationPreferences { user_id:string; school_id:string; absent:boolean; fees:boolean; reply:boolean; ai:boolean; email:boolean; sms:boolean; whatsapp:boolean }
export const DEFAULT_NOTIFICATION_PREFERENCES = { absent:true, fees:true, reply:true, ai:false, email:true, sms:false, whatsapp:false }

export function useNotificationPreferences(userId?: string) { return useQuery({ queryKey:['notification-preferences',userId], enabled:!!userId, queryFn:async():Promise<NotificationPreferences|null>=>{const{data,error}=await supabase.from('notification_preferences').select('*').eq('user_id',userId!).maybeSingle();if(error)throw error;return data as NotificationPreferences|null} }) }
export function useSaveNotificationPreferences(){const qc=useQueryClient();return useMutation({mutationFn:async(input:NotificationPreferences)=>{const{error}=await supabase.from('notification_preferences').upsert(input,{onConflict:'user_id'});if(error)throw error},onSuccess:(_d,x)=>{void qc.invalidateQueries({queryKey:['notification-preferences',x.user_id]})}})}

export interface DeliverySummary { pending:number; sent:number; failed:number }
export function useDeliverySummary(userId?:string){return useQuery({queryKey:['notification-deliveries',userId],enabled:!!userId,queryFn:async():Promise<DeliverySummary>=>{const{data,error}=await supabase.from('notification_deliveries').select('status').eq('user_id',userId!);if(error)throw error;const rows=(data??[]) as {status:string}[];return{pending:rows.filter(x=>x.status==='pending'||x.status==='processing').length,sent:rows.filter(x=>x.status==='sent').length,failed:rows.filter(x=>x.status==='failed').length}}})}
