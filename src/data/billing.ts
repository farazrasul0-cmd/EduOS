import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export type SubscriptionPlan='starter'|'growth'|'school'
export interface SchoolSubscription{id:string;school_id:string;plan:SubscriptionPlan;status:'trialing'|'active'|'past_due'|'cancelled';price_per_student:number;billing_email:string|null;current_period_start:string;current_period_end:string;cancel_at_period_end:boolean}
export function useSchoolSubscription(schoolId?:string){return useQuery({queryKey:['school-subscription',schoolId],enabled:!!schoolId,queryFn:async():Promise<SchoolSubscription|null>=>{const{data,error}=await supabase.from('school_subscriptions').select('*').eq('school_id',schoolId!).maybeSingle();if(error)throw error;return data?{...(data as SchoolSubscription),price_per_student:Number(data.price_per_student)}:null}})}
export function useUpdateSubscription(){const qc=useQueryClient();return useMutation({mutationFn:async(x:{plan:SubscriptionPlan;email:string;cancel:boolean;schoolId:string})=>{const{error}=await supabase.rpc('update_school_subscription',{target_plan:x.plan,target_billing_email:x.email,target_cancel:x.cancel});if(error)throw error},onSuccess:(_d,x)=>{void qc.invalidateQueries({queryKey:['school-subscription',x.schoolId]})}})}
