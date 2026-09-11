import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Plus, Wallet, Hourglass, CircleAlert, Receipt, Loader2, History } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { KPI } from '@/components/ui/KPI'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Segmented } from '@/components/ui/Segmented'
import { Empty } from '@/components/ui/Empty'
import { Field, Input, SearchInput, Select } from '@/components/ui/form'
import { Modal } from '@/components/ui/Modal'
import { Toolbar, TableWrap, Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { formatDate, formatTaka, formatNumber } from '@/lib/utils'
import { invoiceOutstanding, matchesInvoiceSearch, validPaymentAmount } from '@/lib/fees'
import { useCreateInvoice, useFeePlans, useInvoicePayments, useInvoices, useRecordPayment, type InvoiceWithStudent } from '@/data/fees'
import { useStudents } from '@/data/students'
import type { InvoiceStatus, Payment, PaymentMethod } from '@/types/models'
import type { AppLanguage } from '@/i18n'

const stateTone: Record<InvoiceStatus, BadgeTone> = { paid: 'success', due: 'warning', overdue: 'danger', partial: 'info' }
const stateKey: Record<InvoiceStatus, string> = { paid: 'badge.paid', due: 'badge.due', overdue: 'badge.overdue', partial: 'fees.filter.partial' }
const paymentMethods: PaymentMethod[] = ['cash', 'bank', 'bkash', 'nagad', 'rocket', 'upay', 'card']

function downloadText(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function Fees() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'en') as AppLanguage
  const invoicesQuery = useInvoices()
  const plansQuery = useFeePlans()
  const studentsQuery = useStudents()
  const createInvoice = useCreateInvoice()
  const recordPayment = useRecordPayment()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [selected, setSelected] = useState<InvoiceWithStudent | null>(null)
  const paymentsQuery = useInvoicePayments(selected?.id ?? null)
  const [invoiceForm, setInvoiceForm] = useState({ studentId: '', feePlanId: '', planName: '', period: 'monthly', amount: '', dueDate: '' })
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'cash' as PaymentMethod, reference: '' })

  const invoices = useMemo(() => invoicesQuery.data ?? [], [invoicesQuery.data])
  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return invoices.filter((row) => (filter === 'all' || row.status === filter) && matchesInvoiceSearch(row, needle))
  }, [filter, invoices, search])
  const totals = invoices.reduce((sum, row) => {
    sum.total += row.amount; sum.collected += row.paid_amount
    if (row.status === 'overdue') { sum.overdue += row.amount - row.paid_amount; sum.overdueCount += 1 }
    return sum
  }, { total: 0, collected: 0, overdue: 0, overdueCount: 0 })
  const outstanding = totals.total - totals.collected
  const collectedPct = totals.total ? Math.round((totals.collected / totals.total) * 100) : 0

  function choosePlan(id: string) {
    const plan = plansQuery.data?.find((item) => item.id === id)
    setInvoiceForm((form) => ({ ...form, feePlanId: id, amount: plan ? String(plan.amount) : form.amount }))
  }
  function submitInvoice() {
    const amount = Number(invoiceForm.amount)
    if (!invoiceForm.studentId || !invoiceForm.dueDate || amount <= 0 || (!invoiceForm.feePlanId && !invoiceForm.planName.trim())) return
    createInvoice.mutate({ studentId: invoiceForm.studentId, feePlanId: invoiceForm.feePlanId || null, planName: invoiceForm.planName, period: invoiceForm.period, amount, dueDate: invoiceForm.dueDate }, {
      onSuccess: () => { setInvoiceOpen(false); setInvoiceForm({ studentId: '', feePlanId: '', planName: '', period: 'monthly', amount: '', dueDate: '' }) },
    })
  }
  function openInvoice(invoice: InvoiceWithStudent) {
    setSelected(invoice)
    setPaymentForm({ amount: String(Math.max(0, invoice.amount - invoice.paid_amount)), method: 'cash', reference: crypto.randomUUID() })
  }
  function submitPayment() {
    if (!selected) return
    const amount = Number(paymentForm.amount)
    const remaining = invoiceOutstanding(selected)
    if (!validPaymentAmount(amount, remaining) || !paymentForm.reference.trim()) return
    recordPayment.mutate({ invoice: selected, amount, method: paymentForm.method, reference: paymentForm.reference }, {
      onSuccess: () => {
        setPaymentForm((form) => ({ ...form, amount: '', reference: crypto.randomUUID() }))
        const paidAmount = selected.paid_amount + amount
        setSelected({ ...selected, paid_amount: paidAmount, status: paidAmount >= selected.amount ? 'paid' : 'partial' })
      },
    })
  }
  function exportInvoices() {
    const csv = ['invoice,student,due_date,status,amount,paid,outstanding', ...rows.map((row) => [row.invoice_no, JSON.stringify(row.student_name ?? ''), row.due_date ?? '', row.status, row.amount, row.paid_amount, row.amount - row.paid_amount].join(','))].join('\n')
    downloadText('invoices.csv', csv, 'text/csv;charset=utf-8')
  }
  function receipt(invoice: InvoiceWithStudent, payment: Payment) {
    const html = `<!doctype html><meta charset="utf-8"><title>Receipt ${payment.reference ?? payment.id}</title><style>body{font-family:Arial;max-width:640px;margin:48px auto;color:#172033}h1{margin-bottom:4px}.row{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding:12px 0}</style><h1>EduOS payment receipt</h1><p>${invoice.student_name ?? ''}</p><div class="row"><span>Invoice</span><b>${invoice.invoice_no}</b></div><div class="row"><span>Amount</span><b>BDT ${payment.amount.toFixed(2)}</b></div><div class="row"><span>Method</span><b>${payment.method}</b></div><div class="row"><span>Reference</span><b>${payment.reference ?? '—'}</b></div><div class="row"><span>Paid at</span><b>${payment.paid_at}</b></div><p>Generated by EduOS</p>`
    downloadText(`receipt-${invoice.invoice_no}-${payment.id.slice(0, 8)}.html`, html, 'text/html;charset=utf-8')
  }

  return <div>
    <PageHeader title={t('fees.title')} sub={t('fees.sub')} actions={<><Button variant="secondary" icon={<Download size={16} />} onClick={exportInvoices}>{t('actions.export')}</Button><Button variant="primary" icon={<Plus size={16} />} onClick={() => setInvoiceOpen(true)}>{t('actions.newInvoice')}</Button></>} />
    {(createInvoice.isError || recordPayment.isError) && <div className="mb-4 rounded-sm border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{(createInvoice.error ?? recordPayment.error)?.message}</div>}
    <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KPI icon={Wallet} label={t('fees.kpi.collected')} value={formatTaka(totals.collected, lang)} delta={`${formatNumber(collectedPct, lang)}%`} deltaTone="up" />
      <KPI icon={Hourglass} label={t('fees.kpi.outstanding')} value={formatTaka(outstanding, lang)} delta={`${formatNumber(100 - collectedPct, lang)}%`} deltaTone="down" />
      <KPI icon={CircleAlert} label={t('fees.kpi.overdue')} value={formatTaka(totals.overdue, lang)} delta={t('fees.kpi.overdueStudents', { count: formatNumber(totals.overdueCount, lang) })} deltaTone="down" />
      <KPI icon={Receipt} label={t('fees.kpi.totalBilled')} value={formatTaka(totals.total, lang)} footer={t('fees.kpi.month')} />
    </div>
    <Toolbar><Segmented value={filter} onChange={setFilter} options={['all', 'paid', 'due', 'partial', 'overdue'].map((value) => ({ label: t(`fees.filter.${value}`), value }))} /><SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('fees.searchPlaceholder')} /><span className="ml-auto text-[13px] text-fg-3">{t('fees.invoicesCount', { count: formatNumber(rows.length, lang) })}</span></Toolbar>
    <TableWrap className="rounded-t-none"><Table className="min-w-[860px]"><THead><TR><TH>{t('fees.table.student')}</TH><TH>{t('fees.table.invoice')}</TH><TH>{t('fees.table.dueDate')}</TH><TH>{t('fees.table.status')}</TH><TH num>{t('fees.table.amount')}</TH><TH num>{t('fees.table.outstanding')}</TH><TH className="w-28" /></TR></THead><TBody>
      {invoicesQuery.isPending ? <TR><TD className="py-10 text-center" colSpan={7}><Loader2 className="mx-auto animate-spin text-primary" size={22} /></TD></TR> : rows.length === 0 ? <TR><TD className="py-4" colSpan={7}><Empty icon={Receipt} title={t('fees.empty')} sub={t('fees.emptySub')} /></TD></TR> : rows.map((row) => <TR key={row.id}><TD><div className="flex items-center gap-2.5"><Avatar name={row.student_name ?? '?'} /><b>{row.student_name ?? '—'}</b></div></TD><TD className="font-mono text-xs text-fg-3">{row.invoice_no}</TD><TD>{row.due_date ? formatDate(row.due_date, lang) : '—'}</TD><TD><Badge tone={stateTone[row.status]}>{t(stateKey[row.status])}</Badge></TD><TD num className="font-semibold">{formatTaka(row.amount, lang)}</TD><TD num>{formatTaka(row.amount - row.paid_amount, lang)}</TD><TD><Button variant="ghost" size="sm" icon={<History size={14} />} onClick={() => openInvoice(row)}>{t('fees.view')}</Button></TD></TR>)}
    </TBody></Table></TableWrap>

    <Modal open={invoiceOpen} onClose={() => setInvoiceOpen(false)} title={t('fees.newInvoice.title')} sub={t('fees.newInvoice.sub')} footer={<><Button variant="secondary" onClick={() => setInvoiceOpen(false)}>{t('actions.cancel')}</Button><Button variant="primary" onClick={submitInvoice} disabled={createInvoice.isPending}>{createInvoice.isPending ? t('common.saving') : t('actions.newInvoice')}</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2"><Field className="sm:col-span-2" label={t('fees.newInvoice.student')}><Select value={invoiceForm.studentId} onChange={(event) => setInvoiceForm((form) => ({ ...form, studentId: event.target.value }))}><option value="">—</option>{(studentsQuery.data ?? []).map((student) => <option key={student.id} value={student.id}>{student.full_name}</option>)}</Select></Field><Field className="sm:col-span-2" label={t('fees.newInvoice.plan')}><Select value={invoiceForm.feePlanId} onChange={(event) => choosePlan(event.target.value)}><option value="">{t('fees.newInvoice.newPlan')}</option>{(plansQuery.data ?? []).map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · {formatTaka(plan.amount, lang)}</option>)}</Select></Field>{!invoiceForm.feePlanId && <><Field label={t('fees.newInvoice.planName')}><Input value={invoiceForm.planName} onChange={(event) => setInvoiceForm((form) => ({ ...form, planName: event.target.value }))} /></Field><Field label={t('fees.newInvoice.period')}><Input value={invoiceForm.period} onChange={(event) => setInvoiceForm((form) => ({ ...form, period: event.target.value }))} /></Field></>}<Field label={t('fees.newInvoice.amount')}><Input type="number" min="0.01" step="0.01" value={invoiceForm.amount} onChange={(event) => setInvoiceForm((form) => ({ ...form, amount: event.target.value }))} /></Field><Field label={t('fees.newInvoice.dueDate')}><Input type="date" value={invoiceForm.dueDate} onChange={(event) => setInvoiceForm((form) => ({ ...form, dueDate: event.target.value }))} /></Field></div>
    </Modal>

    <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.invoice_no} sub={selected?.student_name} width={640}>
      {selected && <><div className="mb-5 grid grid-cols-3 gap-3 rounded-sm bg-app p-4 text-sm"><div><span className="block text-xs text-fg-3">{t('fees.table.amount')}</span><b>{formatTaka(selected.amount, lang)}</b></div><div><span className="block text-xs text-fg-3">{t('fees.paid')}</span><b>{formatTaka(selected.paid_amount, lang)}</b></div><div><span className="block text-xs text-fg-3">{t('fees.table.outstanding')}</span><b>{formatTaka(selected.amount - selected.paid_amount, lang)}</b></div></div>{selected.status !== 'paid' && <div className="mb-5 grid gap-3 border-b border-divider pb-5 sm:grid-cols-2"><Field label={t('fees.payment.amount')}><Input type="number" min="0.01" max={selected.amount - selected.paid_amount} step="0.01" value={paymentForm.amount} onChange={(event) => setPaymentForm((form) => ({ ...form, amount: event.target.value }))} /></Field><Field label={t('fees.payment.method')}><Select value={paymentForm.method} onChange={(event) => setPaymentForm((form) => ({ ...form, method: event.target.value as PaymentMethod }))}>{paymentMethods.map((method) => <option key={method} value={method}>{t(`fees.payment.methods.${method}`)}</option>)}</Select></Field><Field className="sm:col-span-2" label={t('fees.payment.reference')} hint={t('fees.payment.referenceHint')}><Input value={paymentForm.reference} onChange={(event) => setPaymentForm((form) => ({ ...form, reference: event.target.value }))} /></Field><Button className="sm:col-span-2" variant="primary" onClick={submitPayment} disabled={recordPayment.isPending}>{recordPayment.isPending ? t('common.saving') : t('fees.payment.record')}</Button></div>}<h3 className="mb-2 font-semibold">{t('fees.payment.history')}</h3>{paymentsQuery.isPending ? <Loader2 className="animate-spin" /> : !paymentsQuery.data?.length ? <p className="text-sm text-fg-3">{t('fees.payment.empty')}</p> : <div>{paymentsQuery.data.map((payment) => <div key={payment.id} className="flex items-center justify-between gap-3 border-t border-divider py-3 text-sm"><div><b>{formatTaka(payment.amount, lang)}</b><div className="text-xs text-fg-3">{formatDate(payment.paid_at, lang)} · {payment.method} · {payment.reference}</div></div><Button variant="ghost" size="sm" icon={<Download size={14} />} onClick={() => receipt(selected, payment)}>{t('actions.receipt')}</Button></div>)}</div>}</>}
    </Modal>
  </div>
}
