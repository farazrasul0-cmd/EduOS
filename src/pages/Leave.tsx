import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CalendarClock,
  CalendarCheck,
  Clock,
  AlertCircle,
  Plus,
  Download,
  Briefcase,
  FileText,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { KPI } from '@/components/ui/KPI'
import { Segmented } from '@/components/ui/Segmented'
import { Modal } from '@/components/ui/Modal'
import { TableWrap, Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { Field, Input, Select, SearchInput } from '@/components/ui/form'
import { Avatar } from '@/components/ui/Avatar'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/auth/context'
import { formatDate, formatNumber } from '@/lib/utils'
import type { AppLanguage } from '@/i18n'
import type {
  LeaveApplication,
  LeaveCategory,
  LeaveType,
} from '@/lib/leave'
import {
  calculateWorkingDays,
  validateLeaveApplication,
  computeTeacherRemainingQuota,
} from '@/lib/leave'
import {
  createLeaveApplicationPdf,
  createLeaveSanctionOrderPdf,
} from '@/lib/leave-pdf'
import {
  useLeaveApplications,
  useTeacherLeaveQuotas,
  useApplyLeave,
  useReviewLeave,
} from '@/data/leave'

export default function Leave() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'en') as AppLanguage
  const toast = useToast()
  const { profile } = useAuth()

  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'archive'>('students')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Modals state
  const [applyModalOpen, setApplyModalOpen] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedAppForReview, setSelectedAppForReview] = useState<LeaveApplication | null>(null)
  const [approvalRemarks, setApprovalRemarks] = useState('')

  // Apply Form State
  const [category, setCategory] = useState<LeaveCategory>('student')
  const [applicantName, setApplicantName] = useState('Tanvir Ahmed')
  const [applicantId, setApplicantId] = useState('STU-1001')
  const [designationOrClass, setDesignationOrClass] = useState('Class 7 (A), Roll 01')
  const [leaveType, setLeaveType] = useState<LeaveType>('sick')
  const [startDate, setStartDate] = useState('2026-06-01')
  const [endDate, setEndDate] = useState('2026-06-03')
  const [reason, setReason] = useState('')
  const [substituteStaffName, setSubstituteStaffName] = useState('')
  const [guardianContact, setGuardianContact] = useState('01711987654')

  // Data Queries & Mutations
  const appsQuery = useLeaveApplications()
  const quotasQuery = useTeacherLeaveQuotas()
  const applyMutation = useApplyLeave()
  const reviewMutation = useReviewLeave()

  const allApps = useMemo(() => appsQuery.data ?? [], [appsQuery.data])
  const quotas = useMemo(() => quotasQuery.data ?? [], [quotasQuery.data])

  // Computed working days for form
  const calculatedDays = useMemo(() => {
    return calculateWorkingDays(startDate, endDate)
  }, [startDate, endDate])

  // KPIs
  const totalAppsCount = allApps.length
  const pendingCount = allApps.filter((a) => a.status === 'pending').length
  const today = '2026-05-25' // simulated current date
  const onLeaveTodayCount = allApps.filter(
    (a) => a.status === 'approved' && a.startDate <= today && a.endDate >= today,
  ).length

  const totalTeacherQuotaDays = quotas.reduce(
    (acc, q) => acc + q.casualTotal + q.medicalTotal + q.earnedTotal,
    0,
  )
  const totalTeacherQuotaUsed = quotas.reduce(
    (acc, q) => acc + q.casualUsed + q.medicalUsed + q.earnedUsed,
    0,
  )
  const quotaUtilizationPct = totalTeacherQuotaDays
    ? Math.round((totalTeacherQuotaUsed / totalTeacherQuotaDays) * 100)
    : 0

  // Filtered applications
  const filteredApps = useMemo(() => {
    return allApps.filter((app) => {
      if (activeTab === 'students' && app.category !== 'student') return false
      if (activeTab === 'teachers' && app.category !== 'teacher') return false

      if (statusFilter !== 'all' && app.status !== statusFilter) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesName = app.applicantName.toLowerCase().includes(q)
        const matchesId = app.applicantId.toLowerCase().includes(q)
        const matchesNo = app.applicationNo.toLowerCase().includes(q)
        const matchesClass = app.designationOrClass.toLowerCase().includes(q)
        if (!matchesName && !matchesId && !matchesNo && !matchesClass) return false
      }
      return true
    })
  }, [allApps, activeTab, statusFilter, searchQuery])

  // Open Review Modal
  const handleOpenReview = (app: LeaveApplication) => {
    setSelectedAppForReview(app)
    setApprovalRemarks('')
    setReviewModalOpen(true)
  }

  // Handle Review Action (Approve or Reject)
  const handleReviewAction = async (status: 'approved' | 'rejected') => {
    if (!selectedAppForReview) return
    try {
      await reviewMutation.mutateAsync({
        applicationId: selectedAppForReview.id,
        status,
        approverName: profile?.full_name || 'Principal M. A. Karim',
        approvalRemarks: approvalRemarks.trim() || undefined,
      })
      toast.show({
        tone: 'success',
        title: status === 'approved' ? t('leave.modals.approve') : t('leave.modals.reject'),
        message: t('leave.modals.successReviewed'),
      })
      setReviewModalOpen(false)
    } catch {
      toast.show({
        tone: 'danger',
        title: 'Error',
        message: 'Failed to update application review.',
      })
    }
  }

  // Handle Submit Application
  const handleSubmitApply = async (e: React.FormEvent) => {
    e.preventDefault()
    const quota = category === 'teacher' ? quotas.find((q) => q.staffId === applicantId) : undefined
    const validation = validateLeaveApplication(
      {
        applicantName,
        startDate,
        endDate,
        reason,
        category,
        leaveType,
      },
      quota,
    )

    if (!validation.valid) {
      toast.show({
        tone: 'danger',
        title: 'Validation Error',
        message: validation.error ?? 'Please check all required fields.',
      })
      return
    }

    try {
      await applyMutation.mutateAsync({
        category,
        applicantId,
        applicantName,
        designationOrClass,
        leaveType,
        startDate,
        endDate,
        reason,
        substituteStaffName: category === 'teacher' ? substituteStaffName : undefined,
        guardianContact: category === 'student' ? guardianContact : undefined,
      })
      toast.show({
        tone: 'success',
        title: t('leave.applyLeave'),
        message: t('leave.modals.successApplied'),
      })
      setApplyModalOpen(false)
      setReason('')
    } catch {
      toast.show({
        tone: 'danger',
        title: 'Error',
        message: 'Failed to submit leave application.',
      })
    }
  }

  // PDF Handlers
  const downloadApplicationPdf = (app: LeaveApplication) => {
    const school = {
      schoolName: 'Dhaka Model School & College',
      eiin: '108234',
      address: 'Dhanmondi, Dhaka, Bangladesh',
    }
    const bytes = createLeaveApplicationPdf(app, school)
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Leave_Application_${app.applicationNo}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadSanctionOrderPdf = (app: LeaveApplication) => {
    const school = {
      schoolName: 'Dhaka Model School & College',
      eiin: '108234',
      address: 'Dhanmondi, Dhaka, Bangladesh',
    }
    const bytes = createLeaveSanctionOrderPdf(app, school)
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Leave_Sanction_Order_${app.applicationNo}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('leave.title')}
        sub={t('leave.subtitle')}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => setApplyModalOpen(true)}
            >
              {t('leave.applyLeave')}
            </Button>
            <Button
              variant="secondary"
              icon={<Download size={16} />}
              onClick={() => {
                if (filteredApps[0]) downloadApplicationPdf(filteredApps[0])
              }}
            >
              {t('leave.exportSummary')}
            </Button>
          </div>
        }
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPI
          icon={CalendarClock}
          label={t('leave.kpis.totalApps')}
          value={formatNumber(totalAppsCount, lang)}
        />
        <KPI
          icon={AlertCircle}
          label={t('leave.kpis.pendingReview')}
          value={formatNumber(pendingCount, lang)}
          delta={pendingCount > 0 ? 'Requires Action' : undefined}
          deltaTone={pendingCount > 0 ? 'down' : 'up'}
        />
        <KPI
          icon={Clock}
          label={t('leave.kpis.onLeaveToday')}
          value={formatNumber(onLeaveTodayCount, lang)}
        />
        <KPI
          icon={CalendarCheck}
          label={t('leave.kpis.quotaUsed')}
          value={`${formatNumber(quotaUtilizationPct, lang)}%`}
          delta={`${formatNumber(totalTeacherQuotaUsed, lang)}/${formatNumber(totalTeacherQuotaDays, lang)} Days`}
          deltaTone="neutral"
        />
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={activeTab}
          onChange={(val) => setActiveTab(val as typeof activeTab)}
          options={[
            { label: t('leave.tabs.students'), value: 'students' },
            { label: t('leave.tabs.teachers'), value: 'teachers' },
            { label: t('leave.tabs.archive'), value: 'archive' },
          ]}
        />

        <div className="flex items-center gap-3">
          <div className="w-56">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('common.search')}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-36 text-xs"
          >
            <option value="all">All Status</option>
            <option value="pending">{t('leave.status.pending')}</option>
            <option value="approved">{t('leave.status.approved')}</option>
            <option value="rejected">{t('leave.status.rejected')}</option>
          </Select>
        </div>
      </div>

      {/* Tab: Student Leaves */}
      {activeTab === 'students' && (
        <TableWrap>
          <Table className="min-w-[850px]">
            <THead>
              <TR>
                <TH className="w-28">{t('leave.table.appNo')}</TH>
                <TH>{t('leave.table.applicant')}</TH>
                <TH>{t('leave.table.type')}</TH>
                <TH num>{t('leave.table.duration')}</TH>
                <TH>{t('leave.table.dates')}</TH>
                <TH>{t('leave.table.guardianPhone')}</TH>
                <TH>{t('leave.table.status')}</TH>
                <TH className="text-right">{t('leave.table.actions')}</TH>
              </TR>
            </THead>
            <TBody>
              {filteredApps.length === 0 ? (
                <TR>
                  <TD colSpan={8} className="py-8 text-center text-slate-500">
                    No student leave applications found.
                  </TD>
                </TR>
              ) : (
                filteredApps.map((app) => (
                  <TR key={app.id}>
                    <TD className="font-mono text-xs font-semibold text-slate-700">
                      {app.applicationNo}
                    </TD>
                    <TD>
                      <div className="font-semibold text-slate-900">{app.applicantName}</div>
                      <div className="text-[11px] text-slate-500">{app.designationOrClass}</div>
                    </TD>
                    <TD>
                      <span className="capitalize font-medium text-slate-700">
                        {t(`leave.types.${app.leaveType}` as const)}
                      </span>
                    </TD>
                    <TD num className="font-semibold">
                      {formatNumber(app.daysCount, lang)} Days
                    </TD>
                    <TD className="text-xs text-slate-600">
                      {formatDate(app.startDate, lang)} — {formatDate(app.endDate, lang)}
                    </TD>
                    <TD className="font-mono text-xs text-slate-600">
                      {app.guardianContact || '—'}
                    </TD>
                    <TD>
                      <Badge
                        tone={
                          app.status === 'approved'
                            ? 'success'
                            : app.status === 'rejected'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {t(`leave.status.${app.status}` as const)}
                      </Badge>
                    </TD>
                    <TD className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {app.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleOpenReview(app)}
                          >
                            Review
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          title={t('leave.modals.downloadAppPdf')}
                          onClick={() => downloadApplicationPdf(app)}
                        >
                          <FileText size={15} />
                        </Button>
                        {app.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            title={t('leave.modals.downloadOrderPdf')}
                            onClick={() => downloadSanctionOrderPdf(app)}
                          >
                            <Download size={15} />
                          </Button>
                        )}
                      </div>
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </TableWrap>
      )}

      {/* Tab: Teacher Leave Ledger */}
      {activeTab === 'teachers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quotas.map((quota) => {
              const rem = computeTeacherRemainingQuota(quota)
              return (
                <div
                  key={quota.staffId}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar name={quota.staffName} />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-slate-900 truncate">
                        {quota.staffName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {quota.designation}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                    <div>
                      <div className="flex justify-between text-slate-600 mb-1">
                        <span>Casual Leave (CL):</span>
                        <span className="font-semibold">
                          {quota.casualUsed} / {quota.casualTotal} Used ({rem.casualRemaining} left)
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${Math.min(100, (quota.casualUsed / quota.casualTotal) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-600 mb-1">
                        <span>Medical Leave:</span>
                        <span className="font-semibold">
                          {quota.medicalUsed} / {quota.medicalTotal} Used ({rem.medicalRemaining} left)
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-amber-500"
                          style={{
                            width: `${Math.min(100, (quota.medicalUsed / quota.medicalTotal) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-600 mb-1">
                        <span>Earned Leave:</span>
                        <span className="font-semibold">
                          {quota.earnedUsed} / {quota.earnedTotal} Used ({rem.earnedRemaining} left)
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500"
                          style={{
                            width: `${Math.min(100, (quota.earnedUsed / quota.earnedTotal) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <TableWrap>
            <Table className="min-w-[850px]">
              <THead>
                <TR>
                  <TH className="w-28">{t('leave.table.appNo')}</TH>
                  <TH>{t('leave.table.applicant')}</TH>
                  <TH>{t('leave.table.type')}</TH>
                  <TH num>{t('leave.table.duration')}</TH>
                  <TH>{t('leave.table.dates')}</TH>
                  <TH>{t('leave.table.substitute')}</TH>
                  <TH>{t('leave.table.status')}</TH>
                  <TH className="text-right">{t('leave.table.actions')}</TH>
                </TR>
              </THead>
              <TBody>
                {filteredApps.length === 0 ? (
                  <TR>
                    <TD colSpan={8} className="py-8 text-center text-slate-500">
                      No teacher leave applications found.
                    </TD>
                  </TR>
                ) : (
                  filteredApps.map((app) => (
                    <TR key={app.id}>
                      <TD className="font-mono text-xs font-semibold text-slate-700">
                        {app.applicationNo}
                      </TD>
                      <TD>
                        <div className="font-semibold text-slate-900">{app.applicantName}</div>
                        <div className="text-[11px] text-slate-500">{app.designationOrClass}</div>
                      </TD>
                      <TD>
                        <span className="capitalize font-medium text-slate-700">
                          {t(`leave.types.${app.leaveType}` as const)}
                        </span>
                      </TD>
                      <TD num className="font-semibold">
                        {formatNumber(app.daysCount, lang)} Days
                      </TD>
                      <TD className="text-xs text-slate-600">
                        {formatDate(app.startDate, lang)} — {formatDate(app.endDate, lang)}
                      </TD>
                      <TD className="text-xs text-slate-700">
                        {app.substituteStaffName ? (
                          <span className="inline-flex items-center gap-1 font-medium text-primary">
                            <Briefcase size={12} /> {app.substituteStaffName}
                          </span>
                        ) : (
                          '—'
                        )}
                      </TD>
                      <TD>
                        <Badge
                          tone={
                            app.status === 'approved'
                              ? 'success'
                              : app.status === 'rejected'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {t(`leave.status.${app.status}` as const)}
                        </Badge>
                      </TD>
                      <TD className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {app.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleOpenReview(app)}
                            >
                              Review
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            title={t('leave.modals.downloadAppPdf')}
                            onClick={() => downloadApplicationPdf(app)}
                          >
                            <FileText size={15} />
                          </Button>
                          {app.status === 'approved' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              title={t('leave.modals.downloadOrderPdf')}
                              onClick={() => downloadSanctionOrderPdf(app)}
                            >
                              <Download size={15} />
                            </Button>
                          )}
                        </div>
                      </TD>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>
          </TableWrap>
        </div>
      )}

      {/* Tab: Applications Archive */}
      {activeTab === 'archive' && (
        <TableWrap>
          <Table className="min-w-[850px]">
            <THead>
              <TR>
                <TH className="w-28">{t('leave.table.appNo')}</TH>
                <TH>{t('leave.table.applicant')}</TH>
                <TH>{t('leave.table.category')}</TH>
                <TH>{t('leave.table.type')}</TH>
                <TH num>{t('leave.table.duration')}</TH>
                <TH>{t('leave.table.dates')}</TH>
                <TH>{t('leave.table.status')}</TH>
                <TH className="text-right">{t('leave.table.actions')}</TH>
              </TR>
            </THead>
            <TBody>
              {filteredApps.map((app) => (
                <TR key={app.id}>
                  <TD className="font-mono text-xs font-semibold text-slate-700">
                    {app.applicationNo}
                  </TD>
                  <TD>
                    <div className="font-semibold text-slate-900">{app.applicantName}</div>
                    <div className="text-[11px] text-slate-500">{app.designationOrClass}</div>
                  </TD>
                  <TD>
                    <Badge tone={app.category === 'teacher' ? 'info' : 'neutral'}>
                      {app.category === 'teacher' ? 'Teacher' : 'Student'}
                    </Badge>
                  </TD>
                  <TD>
                    <span className="capitalize font-medium text-slate-700">
                      {t(`leave.types.${app.leaveType}` as const)}
                    </span>
                  </TD>
                  <TD num className="font-semibold">
                    {formatNumber(app.daysCount, lang)} Days
                  </TD>
                  <TD className="text-xs text-slate-600">
                    {formatDate(app.startDate, lang)} — {formatDate(app.endDate, lang)}
                  </TD>
                  <TD>
                    <Badge
                      tone={
                        app.status === 'approved'
                          ? 'success'
                          : app.status === 'rejected'
                          ? 'danger'
                          : 'warning'
                      }
                    >
                      {t(`leave.status.${app.status}` as const)}
                    </Badge>
                  </TD>
                  <TD className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        title={t('leave.modals.downloadAppPdf')}
                        onClick={() => downloadApplicationPdf(app)}
                      >
                        <FileText size={15} />
                      </Button>
                      {app.status === 'approved' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          title={t('leave.modals.downloadOrderPdf')}
                          onClick={() => downloadSanctionOrderPdf(app)}
                        >
                          <Download size={15} />
                        </Button>
                      )}
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableWrap>
      )}

      {/* Modal: Apply for Leave */}
      <Modal
        open={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        title={t('leave.modals.applyTitle')}
      >
        <form onSubmit={handleSubmitApply} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('leave.modals.selectCategory')}>
              <Select
                value={category}
                onChange={(e) => {
                  const cat = e.target.value as LeaveCategory
                  setCategory(cat)
                  if (cat === 'teacher') {
                    setApplicantName('Md. Rafiqul Islam')
                    setApplicantId('STF-101')
                    setDesignationOrClass('Senior Teacher (Mathematics)')
                    setLeaveType('casual')
                  } else {
                    setApplicantName('Tanvir Ahmed')
                    setApplicantId('STU-1001')
                    setDesignationOrClass('Class 7 (A), Roll 01')
                    setLeaveType('sick')
                  }
                }}
              >
                <option value="student">{t('leave.modals.studentCategory')}</option>
                <option value="teacher">{t('leave.modals.teacherCategory')}</option>
              </Select>
            </Field>

            <Field label={t('leave.table.type')}>
              <Select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
              >
                {category === 'teacher' ? (
                  <>
                    <option value="casual">{t('leave.types.casual')}</option>
                    <option value="medical">{t('leave.types.medical')}</option>
                    <option value="earned">{t('leave.types.earned')}</option>
                    <option value="duty">{t('leave.types.duty')}</option>
                    <option value="maternity">{t('leave.types.maternity')}</option>
                  </>
                ) : (
                  <>
                    <option value="sick">{t('leave.types.sick')}</option>
                    <option value="urgent">{t('leave.types.urgent')}</option>
                    <option value="religious">{t('leave.types.religious')}</option>
                    <option value="bereavement">{t('leave.types.bereavement')}</option>
                  </>
                )}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('leave.table.applicant')}>
              <Input
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                required
              />
            </Field>
            <Field label="Designation / Class">
              <Input
                value={designationOrClass}
                onChange={(e) => setDesignationOrClass(e.target.value)}
                required
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('leave.modals.startDate')}>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </Field>
            <Field label={t('leave.modals.endDate')}>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </Field>
          </div>

          <div className="rounded-lg bg-blue-50 border border-blue-200 p-2.5 text-xs text-blue-800 flex items-center justify-between">
            <span>{t('leave.modals.calculatedDays')}:</span>
            <span className="font-bold text-sm">{calculatedDays} Days</span>
          </div>

          {category === 'teacher' ? (
            <Field label={t('leave.table.substitute')}>
              <Input
                value={substituteStaffName}
                onChange={(e) => setSubstituteStaffName(e.target.value)}
                placeholder="e.g. Anisur Rahman (Lecturer, Physics)"
              />
            </Field>
          ) : (
            <Field label={t('leave.table.guardianPhone')}>
              <Input
                value={guardianContact}
                onChange={(e) => setGuardianContact(e.target.value)}
                placeholder="017XXXXXXXX"
              />
            </Field>
          )}

          <Field label={t('leave.table.reason')}>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('leave.modals.reasonPlaceholder')}
              rows={3}
              required
              className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-primary focus:outline-none"
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setApplyModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={applyMutation.isPending}>
              {t('leave.applyLeave')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Review Leave Application */}
      <Modal
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={t('leave.modals.reviewTitle')}
      >
        {selectedAppForReview && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 text-xs text-slate-700">
              <div className="flex justify-between font-semibold text-slate-900 text-sm">
                <span>{selectedAppForReview.applicantName}</span>
                <span className="font-mono text-xs text-slate-500">
                  {selectedAppForReview.applicationNo}
                </span>
              </div>
              <div>
                <b>Classification:</b> {selectedAppForReview.category.toUpperCase()} ·{' '}
                {t(`leave.types.${selectedAppForReview.leaveType}` as const)}
              </div>
              <div>
                <b>Requested Duration:</b> {selectedAppForReview.daysCount} Working Days (
                {selectedAppForReview.startDate} to {selectedAppForReview.endDate})
              </div>
              <div>
                <b>Reason:</b> {selectedAppForReview.reason}
              </div>
            </div>

            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800">
              {t('leave.modals.attendanceSyncNote')}
            </div>

            <Field label="Administrative Remarks / Directives">
              <textarea
                value={approvalRemarks}
                onChange={(e) => setApprovalRemarks(e.target.value)}
                placeholder={t('leave.modals.remarksPlaceholder')}
                rows={2}
                className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-primary focus:outline-none"
              />
            </Field>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="danger"
                disabled={reviewMutation.isPending}
                onClick={() => handleReviewAction('rejected')}
              >
                {t('leave.modals.reject')}
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={reviewMutation.isPending}
                onClick={() => handleReviewAction('approved')}
              >
                {t('leave.modals.approve')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
