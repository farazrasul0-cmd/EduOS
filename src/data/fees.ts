import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { notify } from '@/data/notifications'
import type { FeePlan, Invoice, Payment, PaymentMethod } from '@/types/models'

export interface InvoiceWithStudent extends Invoice { student_name: string | null }
type InvoiceJoinRow = Invoice & { students: { full_name: string } | null }

export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async (): Promise<InvoiceWithStudent[]> => {
      const { data, error } = await supabase.from('invoices').select('*, students(full_name)').order('issued_at', { ascending: false })
      if (error) throw error
      return ((data ?? []) as InvoiceJoinRow[]).map((row) => ({ ...row, amount: Number(row.amount), paid_amount: Number(row.paid_amount), student_name: row.students?.full_name ?? null }))
    },
  })
}

export function useFeePlans() {
  return useQuery({
    queryKey: ['fee-plans'],
    queryFn: async (): Promise<FeePlan[]> => {
      const { data, error } = await supabase.from('fee_plans').select('*').order('name')
      if (error) throw error
      return (data ?? []).map((row) => ({ ...row, amount: Number(row.amount) })) as FeePlan[]
    },
  })
}

export function useInvoicePayments(invoiceId: string | null) {
  return useQuery({
    queryKey: ['payments', invoiceId], enabled: Boolean(invoiceId),
    queryFn: async (): Promise<Payment[]> => {
      const { data, error } = await supabase.from('payments').select('*').eq('invoice_id', invoiceId!).eq('status', 'success').order('paid_at', { ascending: false })
      if (error) throw error
      return (data ?? []).map((row) => ({ ...row, amount: Number(row.amount) })) as Payment[]
    },
  })
}

export interface CreateInvoiceInput { studentId: string; feePlanId: string | null; planName: string; period: string; amount: number; dueDate: string }
export function useCreateInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateInvoiceInput) => {
      const { error } = await supabase.rpc('create_fee_invoice', {
        target_student_id: input.studentId, target_fee_plan_id: input.feePlanId,
        new_plan_name: input.planName, new_plan_period: input.period,
        invoice_amount: input.amount, invoice_due_date: input.dueDate,
      })
      if (error) throw error
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['invoices'] }); void qc.invalidateQueries({ queryKey: ['fee-plans'] }) },
  })
}

export interface RecordPaymentInput { invoice: InvoiceWithStudent; amount: number; method: PaymentMethod; reference: string }
export function useRecordPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: RecordPaymentInput) => {
      const { error } = await supabase.rpc('record_invoice_payment', {
        target_invoice_id: input.invoice.id, payment_amount: input.amount,
        payment_method_name: input.method, payment_reference: input.reference,
      })
      if (error) throw error
      await notify(input.invoice.school_id, 'fee_paid', `${input.invoice.student_name ?? 'A student'} paid an invoice`, {
        name: input.invoice.student_name ?? '—', amount: String(input.amount),
      })
    },
    onSuccess: (_data, input) => {
      void qc.invalidateQueries({ queryKey: ['invoices'] })
      void qc.invalidateQueries({ queryKey: ['payments', input.invoice.id] })
      void qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
