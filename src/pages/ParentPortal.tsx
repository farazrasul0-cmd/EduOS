import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Smartphone,
  CalendarCheck,
  Banknote,
  Award,
  FileText,
  Download,
  Clock,
  Send,
  CreditCard,
  FileCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { BadgeTone } from '@/components/ui/Badge'
import { KPI } from '@/components/ui/KPI'
import { Segmented } from '@/components/ui/Segmented'
import { Modal } from '@/components/ui/Modal'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { useToast } from '@/components/ui/Toast'
import type { AppLanguage } from '@/i18n'
import type {
  PortalChildSummary,
  PortalSubjectScore,
  PortalFeeInvoice,
  PortalHomeworkItem,
  PortalTodayPeriod,
} from '@/lib/portal'
import {
  usePortalChildren,
  usePortalChildDetails,
  usePayFeeViaMfs,
  useSubmitPortalHomework,
} from '@/data/portal'
import { createStudentProgressDossierPdf } from '@/lib/portal-pdf'
import { createReportCardPdf } from '@/lib/report-card-pdf'
import { createStudentAdmitCardPdf } from '@/lib/admit-card-pdf'
import { createPaymentReceiptPdf } from '@/lib/payment-receipt-pdf'

const SCHOOL_DETAILS = {
  schoolName: 'Dhaka Model High School & College',
  eiin: '108234',
  address: 'Dhanmondi, Dhaka-1209, Bangladesh',
  phone: '+880 1711-000000',
  email: 'info@dhakamodel.edu.bd',
}

const EMPTY_CHILDREN: PortalChildSummary[] = []
const EMPTY_SUBJECTS: PortalSubjectScore[] = []
const EMPTY_INVOICES: PortalFeeInvoice[] = []
const EMPTY_HOMEWORK: PortalHomeworkItem[] = []
const EMPTY_PERIODS: PortalTodayPeriod[] = []

export default function ParentPortal() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'en') as AppLanguage
  const toast = useToast()

  const { data: children = EMPTY_CHILDREN } = usePortalChildren()
  const [selectedChildId, setSelectedChildId] = useState<string>(
    children[0]?.id || 'STD-2026-001',
  )

  const { data: childData } = usePortalChildDetails(selectedChildId)
  const child = childData?.child || children[0]
  const subjects = childData?.subjects ?? EMPTY_SUBJECTS
  const invoices = childData?.invoices ?? EMPTY_INVOICES
  const homework = childData?.homework ?? EMPTY_HOMEWORK
  const todayPeriods = childData?.todayPeriods ?? EMPTY_PERIODS

  // Active Tab
  type PortalTab = 'overview' | 'attendance' | 'fees' | 'academics' | 'homework'
  const [activeTab, setActiveTab] = useState<PortalTab>('overview')

  // MFS Payment Modal state
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<PortalFeeInvoice | null>(null)
  const [mfsMethod, setMfsMethod] = useState<'bkash' | 'nagad' | 'rocket'>('bkash')
  const [mfsMobile, setMfsMobile] = useState('')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  // Homework submission modal state
  const [hwModalOpen, setHwModalOpen] = useState(false)
  const [selectedHw, setSelectedHw] = useState<PortalHomeworkItem | null>(null)
  const [hwSubmissionNote, setHwSubmissionNote] = useState('')

  // Mutations
  const payMutation = usePayFeeViaMfs()
  const submitHwMutation = useSubmitPortalHomework()

  // KPIs
  const pendingHomeworkCount = useMemo(
    () => homework.filter((h) => h.status === 'pending').length,
    [homework],
  )
  const completedHomeworkCount = useMemo(
    () => homework.filter((h) => h.status !== 'pending').length,
    [homework],
  )

  const collegiateBadgeTone: BadgeTone =
    child?.collegiateStatus === 'collegiate'
      ? 'success'
      : child?.collegiateStatus === 'non_collegiate'
        ? 'warning'
        : 'danger'

  const collegiateStandingLabel =
    child?.collegiateStatus === 'collegiate'
      ? t('portal.standing.collegiate')
      : child?.collegiateStatus === 'non_collegiate'
        ? t('portal.standing.non_collegiate')
        : t('portal.standing.dis_collegiate')

  // PDF Handlers
  const handleDownloadDossier = () => {
    if (!child) return
    const bytes = createStudentProgressDossierPdf(child, subjects, SCHOOL_DETAILS)
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Student_Progress_Dossier_${child.rollNo}_${child.name.replace(/\s+/g, '_')}.pdf`
    a.click()
    URL.revokeObjectURL(url)
    toast.show({
      tone: 'success',
      title: 'Dossier Downloaded',
      message: 'Official Student Progress Dossier generated successfully.',
    })
  }

  const handleDownloadReportCard = () => {
    if (!child) return
    const rows = subjects.map((s) => ({
      subject: s.subject,
      marks: s.totalMarks,
      total: 100,
      grade: s.letter,
      gpa: s.gradePoint,
    }))
    const bytes = createReportCardPdf({
      school: SCHOOL_DETAILS.schoolName,
      eiin: SCHOOL_DETAILS.eiin,
      schoolAddress: SCHOOL_DETAILS.address,
      examTerm: 'Annual Examination 2026',
      academicYear: '2026',
      student: lang === 'bn' && child.nameBn ? child.nameBn : child.name,
      roll: child.rollNo,
      className: child.className,
      sectionName: child.section,
      studentId: child.id,
      rows,
      average: Math.round(
        rows.reduce((acc, r) => acc + r.marks, 0) / (rows.length || 1),
      ),
      gpa: child.gpa,
      overallGrade: child.overallGrade,
      isPassed: true,
      meritPosition: child.meritPosition,
      attendanceRate: child.attendanceRate,
    })
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `NCTB_Report_Card_${child.rollNo}_${child.name.replace(/\s+/g, '_')}.pdf`
    a.click()
    URL.revokeObjectURL(url)
    toast.show({
      tone: 'success',
      title: 'Report Card Downloaded',
      message: 'Official NCTB Report Card PDF generated successfully.',
    })
  }

  const handleDownloadAdmitCard = () => {
    if (!child) return
    const candidate = {
      id: `AC-${child.id}`,
      admitCardNo: `ADM-2026-${child.rollNo.padStart(3, '0')}`,
      studentId: child.id,
      studentName: child.name,
      studentNameBn: child.nameBn || child.name,
      className: child.className,
      section: child.section,
      rollNo: child.rollNo,
      gender: child.gender,
      guardianName: child.guardianName,
      guardianPhone: child.guardianPhone,
      feeDueAmount: child.totalDues,
      clearanceStatus: child.totalDues === 0 ? ('cleared' as const) : ('withheld' as const),
      examTitle: 'Annual Examination 2026',
      academicYear: '2026',
      subjects: subjects.map((s, idx) => ({
        subjectCode: `SUB-10${idx + 1}`,
        subjectName: s.subject,
        examDate: `2026-11-${15 + idx * 2}`,
        dayOfWeek: 'Sunday',
        timeSlot: '10:00 AM - 01:00 PM',
        totalMarks: 100,
        room: 'Room 201',
      })),
    }

    const bytes = createStudentAdmitCardPdf(candidate, SCHOOL_DETAILS)
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Exam_Admit_Card_${child.rollNo}_${child.name.replace(/\s+/g, '_')}.pdf`
    a.click()
    URL.revokeObjectURL(url)
    toast.show({
      tone: 'success',
      title: 'Admit Card Downloaded',
      message: 'Official Examination Admit Card generated.',
    })
  }

  const handleDownloadReceipt = (inv: PortalFeeInvoice) => {
    if (!child) return
    const bytes = createPaymentReceiptPdf({
      schoolName: SCHOOL_DETAILS.schoolName,
      studentName: child.name,
      rollNo: child.rollNo,
      className: child.className,
      invoiceNo: inv.id,
      receiptNo: inv.lastPaymentTrx || `REC-${inv.id}`,
      amount: inv.paidAmount,
      method: 'bkash',
      reference: inv.lastPaymentTrx || 'Online Portal',
      paidAt: inv.paidAt || new Date().toISOString().slice(0, 10),
      remainingBalance: Math.max(0, inv.amount - inv.paidAmount),
    })
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Money_Receipt_${inv.id}.pdf`
    a.click()
    URL.revokeObjectURL(url)
    toast.show({
      tone: 'success',
      title: 'Money Receipt Downloaded',
      message: 'Official payment money receipt generated.',
    })
  }

  // Open MFS modal
  const handleOpenPayModal = (inv: PortalFeeInvoice) => {
    setSelectedInvoice(inv)
    setMfsMobile(child?.guardianPhone || '01711223344')
    setMfsMethod('bkash')
    setPayModalOpen(true)
  }

  // Submit MFS payment
  const handleConfirmMfsPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInvoice || !child) return

    const amountDue = selectedInvoice.amount - selectedInvoice.paidAmount
    setIsProcessingPayment(true)
    try {
      const res = await payMutation.mutateAsync({
        invoiceId: selectedInvoice.id,
        childId: child.id,
        amount: amountDue,
        method: mfsMethod,
        mobileNo: mfsMobile,
      })

      toast.show({
        tone: 'success',
        title: 'Payment Successful',
        message: `${t('portal.mfsModal.successMessage')} ${res.transactionId}`,
      })
      setPayModalOpen(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment simulation failed'
      toast.show({
        tone: 'danger',
        title: 'Payment Error',
        message: msg,
      })
    } finally {
      setIsProcessingPayment(false)
    }
  }

  // Open homework submit modal
  const handleOpenSubmitHw = (hw: PortalHomeworkItem) => {
    setSelectedHw(hw)
    setHwSubmissionNote('')
    setHwModalOpen(true)
  }

  // Confirm homework submission
  const handleConfirmSubmitHw = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedHw || !child) return

    try {
      await submitHwMutation.mutateAsync({
        homeworkId: selectedHw.id,
        childId: child.id,
        submissionNote: hwSubmissionNote || 'Completed assignment according to teacher guidelines.',
      })

      toast.show({
        tone: 'success',
        title: 'Assignment Submitted',
        message: t('portal.hwModal.success'),
      })
      setHwModalOpen(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed'
      toast.show({
        tone: 'danger',
        title: 'Submission Error',
        message: msg,
      })
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Child Switcher and Dossier Download */}
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-white shadow-sm">
              <Smartphone size={22} />
            </span>
            <span>{t('portal.title')}</span>
          </div>
        }
        sub={t('portal.subtitle')}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {/* Child Switcher Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-fg-3 uppercase tracking-wider">
                {t('portal.selectChild')}:
              </span>
              <Select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="min-w-[240px] font-medium"
              >
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {lang === 'bn' && c.nameBn ? c.nameBn : c.name} ({c.className} - {c.section} | #{c.rollNo})
                  </option>
                ))}
              </Select>
            </div>

            {/* Dossier Download Action */}
            <Button
              variant="secondary"
              onClick={handleDownloadDossier}
              className="flex items-center gap-2 shadow-sm"
            >
              <Download size={16} />
              <span>{t('portal.downloadDossier')}</span>
            </Button>
          </div>
        }
      />

      {/* 4 Core KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI
          icon={CalendarCheck}
          label={t('portal.kpis.attendance')}
          value={`${child?.attendanceRate || 0}%`}
          delta={`${child?.presentDays || 0}/${child?.totalWorkingDays || 0} days`}
          deltaTone={child?.attendanceRate >= 75 ? 'up' : child?.attendanceRate >= 60 ? 'neutral' : 'down'}
          footer={collegiateStandingLabel}
        />

        <KPI
          icon={Banknote}
          label={t('portal.kpis.totalDues')}
          value={`৳${(child?.totalDues || 0).toLocaleString()}`}
          delta={child?.totalDues === 0 ? 'Fully Cleared' : 'Pending Payment'}
          deltaTone={child?.totalDues === 0 ? 'up' : 'down'}
          footer={child?.totalDues === 0 ? 'Eligible for Admit Card' : 'bKash Pay Available'}
        />

        <KPI
          icon={Award}
          label={t('portal.kpis.gpa')}
          value={`GPA ${(child?.gpa || 0).toFixed(2)}`}
          delta={`Grade ${child?.overallGrade || 'N/A'}`}
          deltaTone="up"
          footer={`Merit Rank #${child?.meritPosition || '-'}`}
        />

        <KPI
          icon={FileText}
          label={t('portal.kpis.homeworkDue')}
          value={String(pendingHomeworkCount)}
          delta={`${completedHomeworkCount} completed`}
          deltaTone={pendingHomeworkCount === 0 ? 'up' : 'neutral'}
          footer="Active Tasks"
        />
      </div>

      {/* Tab Selector */}
      <div className="flex border-b border-border pb-3">
        <Segmented<PortalTab>
          value={activeTab}
          onChange={(tab) => setActiveTab(tab)}
          options={[
            { value: 'overview', label: t('portal.tabs.overview') },
            { value: 'attendance', label: t('portal.tabs.attendance') },
            { value: 'fees', label: t('portal.tabs.fees') },
            { value: 'academics', label: t('portal.tabs.academics') },
            { value: 'homework', label: t('portal.tabs.homework') },
          ]}
        />
      </div>

      {/* TAB 1: OVERVIEW & ROUTINE */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Student Profile Card */}
          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm lg:col-span-1">
            <h3 className="text-base font-semibold text-fg-1 border-b border-border pb-3">
              {lang === 'bn' && child.nameBn ? child.nameBn : child.name}
            </h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-fg-3">Student ID:</span>
                <span className="font-mono font-medium text-fg-1">{child.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fg-3">Class & Section:</span>
                <span className="font-medium text-fg-1">{child.className} ({child.section})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fg-3">Roll Number:</span>
                <span className="font-semibold text-fg-1">#{child.rollNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fg-3">Guardian Name:</span>
                <span className="font-medium text-fg-1">{child.guardianName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fg-3">Guardian Phone:</span>
                <span className="font-mono text-fg-1">{child.guardianPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fg-3">Collegiate Status:</span>
                <Badge tone={collegiateBadgeTone}>{collegiateStandingLabel}</Badge>
              </div>
            </div>
          </div>

          {/* Today's Class Routine */}
          <div className="rounded-lg border border-border bg-surface p-5 shadow-sm lg:col-span-2">
            <h3 className="text-base font-semibold text-fg-1 mb-4 flex items-center gap-2">
              <Clock size={18} className="text-primary" />
              <span>{t('portal.routine.title')}</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-neutral-50 text-xs font-semibold uppercase text-fg-3">
                  <tr>
                    <th className="px-4 py-2.5">{t('portal.routine.period')}</th>
                    <th className="px-4 py-2.5">{t('portal.routine.subject')}</th>
                    <th className="px-4 py-2.5">{t('portal.routine.teacher')}</th>
                    <th className="px-4 py-2.5">{t('portal.routine.time')}</th>
                    <th className="px-4 py-2.5">{t('portal.routine.room')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {todayPeriods.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-fg-3">
                        {t('portal.routine.noClasses')}
                      </td>
                    </tr>
                  ) : (
                    todayPeriods.map((p) => (
                      <tr key={p.period} className="hover:bg-neutral-50/50">
                        <td className="px-4 py-3 font-semibold text-fg-1">Period {p.period}</td>
                        <td className="px-4 py-3 font-medium text-primary">{p.subject}</td>
                        <td className="px-4 py-3 text-fg-2">{p.teacher}</td>
                        <td className="px-4 py-3 font-mono text-xs text-fg-3">{p.timeSlot}</td>
                        <td className="px-4 py-3 text-fg-2">
                          <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium">
                            {p.room}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Collegiate Rules Banner */}
          <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-base font-semibold text-fg-1">
                  {t('portal.attendance.ruleTitle')}
                </h3>
                <p className="mt-1 text-sm text-fg-3">
                  {t('portal.attendance.title')}
                </p>
              </div>
              <Badge tone={collegiateBadgeTone} dot>
                {collegiateStandingLabel}
              </Badge>
            </div>

            {/* Attendance Progress Bar */}
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-fg-2">
                  {t('portal.attendance.rateLabel')}:
                </span>
                <span className="font-bold text-fg-1">{child.attendanceRate}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  style={{ width: `${Math.min(100, child.attendanceRate)}%` }}
                  className={`h-full transition-all duration-500 ${
                    child.attendanceRate >= 75
                      ? 'bg-emerald-500'
                      : child.attendanceRate >= 60
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                  }`}
                />
              </div>
              <div className="flex justify-between text-xs text-fg-3 pt-1">
                <span>
                  {t('portal.attendance.daysAttended')}: <strong>{child.presentDays}</strong>
                </span>
                <span>
                  {t('portal.attendance.totalDays')}: <strong>{child.totalWorkingDays}</strong>
                </span>
              </div>
            </div>

            {/* Explanatory Cards */}
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-md border border-emerald-200 bg-emerald-50/40 p-4 text-sm">
                <div className="font-semibold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 size={16} />
                  <span>Collegiate (&gt;= 75%)</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-emerald-700">
                  {t('portal.attendance.ruleCollegiate')}
                </p>
              </div>

              <div className="rounded-md border border-amber-200 bg-amber-50/40 p-4 text-sm">
                <div className="font-semibold text-amber-800 flex items-center gap-1.5">
                  <AlertCircle size={16} />
                  <span>Non-Collegiate (60% - 74.9%)</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-amber-700">
                  {t('portal.attendance.ruleNonCollegiate')}
                </p>
              </div>

              <div className="rounded-md border border-rose-200 bg-rose-50/40 p-4 text-sm">
                <div className="font-semibold text-rose-800 flex items-center gap-1.5">
                  <AlertCircle size={16} />
                  <span>Dis-Collegiate (&lt; 60%)</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-rose-700">
                  {t('portal.attendance.ruleDisCollegiate')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FEES & BKASH */}
      {activeTab === 'fees' && (
        <div className="rounded-lg border border-border bg-surface p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <h3 className="text-base font-semibold text-fg-1">{t('portal.fees.title')}</h3>
              <p className="mt-1 text-sm text-fg-3">{t('portal.fees.subtitle')}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-fg-3 uppercase font-medium">
                {t('portal.fees.dueAmount')}:
              </span>
              <div className="text-2xl font-bold text-fg-1">
                ৳{child.totalDues.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-neutral-50 text-xs font-semibold uppercase text-fg-3">
                <tr>
                  <th className="px-4 py-2.5">{t('portal.fees.invoiceNo')}</th>
                  <th className="px-4 py-2.5">{t('portal.fees.description')}</th>
                  <th className="px-4 py-2.5">{t('portal.fees.amount')}</th>
                  <th className="px-4 py-2.5">{t('portal.fees.paidAmount')}</th>
                  <th className="px-4 py-2.5">{t('portal.fees.dueDate')}</th>
                  <th className="px-4 py-2.5">{t('portal.fees.status')}</th>
                  <th className="px-4 py-2.5 text-right">{t('portal.fees.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((inv) => {
                  const remaining = Math.max(0, inv.amount - inv.paidAmount)
                  const isPaid = inv.status === 'paid'
                  const statusTone: BadgeTone = isPaid
                    ? 'success'
                    : inv.status === 'overdue'
                      ? 'danger'
                      : 'warning'
                  const statusText = isPaid
                    ? t('portal.fees.paid')
                    : inv.status === 'overdue'
                      ? t('portal.fees.overdue')
                      : t('portal.fees.due')

                  return (
                    <tr key={inv.id} className="hover:bg-neutral-50/50">
                      <td className="px-4 py-3 font-mono font-medium text-fg-1">{inv.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-fg-1">{inv.title}</div>
                        {inv.lastPaymentTrx && (
                          <div className="text-xs text-fg-3">
                            {t('portal.fees.lastPayment')}: {inv.lastPaymentTrx}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-fg-1">
                        ৳{inv.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-fg-2">
                        ৳{inv.paidAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-fg-3">{inv.dueDate}</td>
                      <td className="px-4 py-3">
                        <Badge tone={statusTone}>{statusText}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isPaid ? (
                          <Button
                            variant="primary"
                            onClick={() => handleOpenPayModal(inv)}
                            className="text-xs flex items-center gap-1.5 ml-auto"
                          >
                            <CreditCard size={14} />
                            <span>{t('portal.fees.payNow')} (৳{remaining})</span>
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            onClick={() => handleDownloadReceipt(inv)}
                            className="text-xs flex items-center gap-1.5 ml-auto"
                          >
                            <Download size={14} />
                            <span>{t('portal.fees.receipt')}</span>
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ACADEMICS & MARKSHEET */}
      {activeTab === 'academics' && (
        <div className="rounded-lg border border-border bg-surface p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <h3 className="text-base font-semibold text-fg-1">{t('portal.academics.title')}</h3>
              <p className="mt-1 text-sm text-fg-3">
                {t('portal.academics.overallGpa')}: <strong>GPA {child.gpa.toFixed(2)}</strong> | {t('portal.academics.meritPosition')}: <strong>#{child.meritPosition}</strong>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                onClick={handleDownloadReportCard}
                className="flex items-center gap-2 text-xs shadow-sm"
              >
                <FileCheck size={15} />
                <span>{t('portal.academics.downloadReportCard')}</span>
              </Button>
              <Button
                variant="secondary"
                onClick={handleDownloadAdmitCard}
                className="flex items-center gap-2 text-xs shadow-sm"
              >
                <Download size={15} />
                <span>{t('portal.academics.downloadAdmitCard')}</span>
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-neutral-50 text-xs font-semibold uppercase text-fg-3">
                <tr>
                  <th className="px-4 py-2.5">{t('portal.academics.subject')}</th>
                  <th className="px-4 py-2.5">{t('portal.academics.caMarks')}</th>
                  <th className="px-4 py-2.5">{t('portal.academics.finalMarks')}</th>
                  <th className="px-4 py-2.5">{t('portal.academics.total')}</th>
                  <th className="px-4 py-2.5">{t('portal.academics.letterGrade')}</th>
                  <th className="px-4 py-2.5">{t('portal.academics.gradePoint')}</th>
                  <th className="px-4 py-2.5">{t('portal.academics.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subjects.map((s) => (
                  <tr key={s.subject} className="hover:bg-neutral-50/50">
                    <td className="px-4 py-3 font-medium text-fg-1">{s.subject}</td>
                    <td className="px-4 py-3 text-fg-2">{s.caMarks} / 20</td>
                    <td className="px-4 py-3 text-fg-2">{s.finalMarks} / 80</td>
                    <td className="px-4 py-3 font-semibold text-fg-1">{s.totalMarks} / 100</td>
                    <td className="px-4 py-3 font-bold text-primary">{s.letter}</td>
                    <td className="px-4 py-3 font-mono font-medium text-fg-1">{s.gradePoint.toFixed(1)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={s.isPassed ? 'success' : 'danger'}>
                        {s.isPassed ? t('portal.academics.passed') : t('portal.academics.failed')}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: HOMEWORK TRACKER */}
      {activeTab === 'homework' && (
        <div className="rounded-lg border border-border bg-surface p-6 shadow-sm space-y-6">
          <div className="border-b border-border pb-4">
            <h3 className="text-base font-semibold text-fg-1">{t('portal.homework.title')}</h3>
          </div>

          <div className="space-y-4">
            {homework.map((hw) => {
              const isPending = hw.status === 'pending'
              const tone: BadgeTone =
                hw.status === 'graded'
                  ? 'success'
                  : hw.status === 'submitted'
                    ? 'info'
                    : 'warning'
              const statusText =
                hw.status === 'graded'
                  ? t('portal.homework.graded')
                  : hw.status === 'submitted'
                    ? t('portal.homework.submitted')
                    : t('portal.homework.pending')

              return (
                <div
                  key={hw.id}
                  className="rounded-lg border border-border p-4 bg-surface hover:border-border-strong transition-colors"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-primary-tint px-2 py-0.5 text-xs font-semibold text-primary">
                          {hw.subject}
                        </span>
                        <h4 className="text-base font-semibold text-fg-1">{hw.title}</h4>
                      </div>
                      <p className="mt-2 text-xs text-fg-3">
                        {t('portal.homework.due')}: <strong>{hw.dueAt}</strong>
                      </p>
                    </div>
                    <Badge tone={tone}>{statusText}</Badge>
                  </div>

                  <p className="mt-3 text-sm text-fg-2 leading-relaxed bg-neutral-50/60 p-3 rounded-md border border-neutral-100">
                    <strong>{t('portal.homework.instructions')}:</strong> {hw.instructions}
                  </p>

                  {hw.submissionNote && (
                    <div className="mt-3 text-xs text-fg-3 bg-primary-tint/20 p-2.5 rounded border border-primary-tint">
                      <strong>{t('portal.homework.submittedOn')} {hw.submittedAt}:</strong> {hw.submissionNote}
                    </div>
                  )}

                  {hw.grade && (
                    <div className="mt-2 text-xs font-semibold text-emerald-700">
                      {t('portal.homework.teacherNote')}: {hw.grade}
                    </div>
                  )}

                  {isPending && (
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="primary"
                        onClick={() => handleOpenSubmitHw(hw)}
                        className="text-xs flex items-center gap-1.5"
                      >
                        <Send size={14} />
                        <span>{t('portal.homework.submitWork')}</span>
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* MFS PAY MODAL */}
      <Modal
        open={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title={t('portal.mfsModal.title')}
        sub={t('portal.mfsModal.subtitle')}
        width={520}
      >
        <form onSubmit={handleConfirmMfsPayment} className="space-y-4">
          <div className="rounded-lg bg-neutral-50 p-4 border border-border">
            <div className="text-xs uppercase text-fg-3 font-semibold">
              {t('portal.mfsModal.amountToPay')}:
            </div>
            <div className="mt-1 text-2xl font-extrabold text-primary">
              ৳{(selectedInvoice ? selectedInvoice.amount - selectedInvoice.paidAmount : 0).toLocaleString()} {t('portal.mfsModal.bdt')}
            </div>
            <div className="mt-1 text-xs text-fg-3">
              {selectedInvoice?.title}
            </div>
          </div>

          {/* Payment Gateways */}
          <div>
            <span className="text-[13px] font-medium text-fg-2">
              {t('portal.mfsModal.selectGateway')}:
            </span>
            <div className="mt-2 grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setMfsMethod('bkash')}
                className={`flex flex-col items-center justify-center p-3 rounded-md border text-xs font-semibold transition-all ${
                  mfsMethod === 'bkash'
                    ? 'border-pink-500 bg-pink-50 text-pink-700 ring-2 ring-pink-400'
                    : 'border-border bg-surface text-fg-2 hover:bg-neutral-50'
                }`}
              >
                <span className="text-sm font-bold">bKash</span>
                <span className="text-[11px] text-pink-600 font-normal">বিকাশ</span>
              </button>

              <button
                type="button"
                onClick={() => setMfsMethod('nagad')}
                className={`flex flex-col items-center justify-center p-3 rounded-md border text-xs font-semibold transition-all ${
                  mfsMethod === 'nagad'
                    ? 'border-orange-500 bg-orange-50 text-orange-700 ring-2 ring-orange-400'
                    : 'border-border bg-surface text-fg-2 hover:bg-neutral-50'
                }`}
              >
                <span className="text-sm font-bold">Nagad</span>
                <span className="text-[11px] text-orange-600 font-normal">নগদ</span>
              </button>

              <button
                type="button"
                onClick={() => setMfsMethod('rocket')}
                className={`flex flex-col items-center justify-center p-3 rounded-md border text-xs font-semibold transition-all ${
                  mfsMethod === 'rocket'
                    ? 'border-purple-500 bg-purple-50 text-purple-700 ring-2 ring-purple-400'
                    : 'border-border bg-surface text-fg-2 hover:bg-neutral-50'
                }`}
              >
                <span className="text-sm font-bold">Rocket</span>
                <span className="text-[11px] text-purple-600 font-normal">রকেট</span>
              </button>
            </div>
          </div>

          {/* Wallet Number */}
          <Field label={t('portal.mfsModal.mobileNumber')} required>
            <Input
              type="text"
              value={mfsMobile}
              onChange={(e) => setMfsMobile(e.target.value)}
              placeholder={t('portal.mfsModal.mobilePlaceholder')}
              required
            />
          </Field>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPayModalOpen(false)}
            >
              {t('portal.mfsModal.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isProcessingPayment || !mfsMobile}
            >
              {isProcessingPayment
                ? t('portal.mfsModal.processing')
                : t('portal.mfsModal.confirmPayment')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* SUBMIT HOMEWORK MODAL */}
      <Modal
        open={hwModalOpen}
        onClose={() => setHwModalOpen(false)}
        title={t('portal.hwModal.title')}
        sub={selectedHw?.title}
        width={560}
      >
        <form onSubmit={handleConfirmSubmitHw} className="space-y-4">
          <div className="rounded bg-neutral-50 p-3 text-xs text-fg-3 border border-border">
            <strong>{t('portal.hwModal.instructionsLabel')}:</strong> {selectedHw?.instructions}
          </div>

          <Field label={t('portal.hwModal.noteLabel')} required>
            <Textarea
              rows={4}
              value={hwSubmissionNote}
              onChange={(e) => setHwSubmissionNote(e.target.value)}
              placeholder={t('portal.hwModal.notePlaceholder')}
              required
            />
          </Field>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setHwModalOpen(false)}
            >
              {t('portal.hwModal.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitHwMutation.isPending || !hwSubmissionNote.trim()}
            >
              {t('portal.hwModal.submit')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
