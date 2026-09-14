import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  GraduationCap,
  Users,
  CheckCircle,
  FileCheck,
  Percent,
  ExternalLink,
  Eye,
  Download,
  MessageSquare,
  UserCheck,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { KPI } from '@/components/ui/KPI'
import { Segmented } from '@/components/ui/Segmented'
import { Modal } from '@/components/ui/Modal'
import { Empty } from '@/components/ui/Empty'
import { Toolbar, TableWrap, Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { SearchInput, Select } from '@/components/ui/form'
import { useToast } from '@/components/ui/Toast'
import {
  type AdmissionApplicant,
  type AdmissionStatus,
  ADMISSION_CLASSES,
  generateAdmissionSmsText,
} from '@/lib/admissions'
import {
  createAdmissionAdmitCardPdf,
  createAdmissionFeeVoucherPdf,
} from '@/lib/admissions-pdf'
import {
  useAdmissions,
  useUpdateAdmissionStatus,
  useEnrollApplicant,
} from '@/data/admissions'
import { formatDate, formatNumber } from '@/lib/utils'
import type { AppLanguage } from '@/i18n'

export default function Admissions() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'en') as AppLanguage
  const toast = useToast()

  const admissionsQuery = useAdmissions()
  const updateStatus = useUpdateAdmissionStatus()
  const enrollApplicant = useEnrollApplicant()

  const [q, setQ] = useState('')
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [statusTab, setStatusTab] = useState<string>('all')
  const [activeApplicant, setActiveApplicant] = useState<AdmissionApplicant | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)

  const applicants = useMemo(() => admissionsQuery.data ?? [], [admissionsQuery.data])

  // KPIs
  const totalCount = applicants.length
  const shortlistedCount = applicants.filter((a) => a.status === 'shortlisted').length
  const admittedCount = applicants.filter((a) => a.status === 'admitted').length
  const admissionRate = totalCount ? Math.round((admittedCount / totalCount) * 100) : 0

  // Filtered rows
  const filteredApplicants = useMemo(() => {
    return applicants.filter((app) => {
      const matchClass = selectedClass === 'all' || app.appliedClass === selectedClass
      const matchStatus = statusTab === 'all' || app.status === statusTab
      const query = q.toLowerCase().trim()
      const matchQuery =
        !query ||
        app.applicationNo.toLowerCase().includes(query) ||
        app.studentName.toLowerCase().includes(query) ||
        (app.studentNameBn && app.studentNameBn.includes(query)) ||
        app.guardianPhone.includes(query)

      return matchClass && matchStatus && matchQuery
    })
  }, [applicants, selectedClass, statusTab, q])

  function openReview(applicant: AdmissionApplicant) {
    setActiveApplicant(applicant)
    setReviewOpen(true)
  }

  async function handleStatusChange(status: AdmissionStatus) {
    if (!activeApplicant) return
    try {
      await updateStatus.mutateAsync({
        id: activeApplicant.id,
        status,
      })
      setActiveApplicant((prev) => (prev ? { ...prev, status } : null))
      toast.success(t('admissions.dashboard.modal.statusChanged'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  async function handleEnroll() {
    if (!activeApplicant) return
    try {
      await enrollApplicant.mutateAsync(activeApplicant.id)
      setActiveApplicant((prev) => (prev ? { ...prev, status: 'admitted' } : null))
      toast.success(t('admissions.dashboard.modal.enrolled'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  function handleSendSms() {
    if (!activeApplicant) return
    const msg = generateAdmissionSmsText(
      activeApplicant,
      t('app.school'),
      activeApplicant.status,
      lang,
    )
    toast.info(`BTRC SMS: "${msg.slice(0, 60)}..."`, t('admissions.dashboard.modal.smsSent'))
  }

  function downloadAdmitCard(applicant: AdmissionApplicant) {
    const bytes = createAdmissionAdmitCardPdf(applicant, {
      schoolName: t('app.school'),
      eiin: '108234',
      address: 'Dhaka, Bangladesh',
    })
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `admit-card-${applicant.applicationNo}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }

  function downloadFeeVoucher(applicant: AdmissionApplicant) {
    const bytes = createAdmissionFeeVoucherPdf(applicant, {
      schoolName: t('app.school'),
      eiin: '108234',
      address: 'Dhaka, Bangladesh',
    })
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `admission-voucher-${applicant.applicationNo}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }

  const statusToneMap: Record<AdmissionStatus, 'info' | 'warning' | 'success' | 'danger' | 'neutral'> = {
    submitted: 'neutral',
    under_review: 'warning',
    shortlisted: 'info',
    admitted: 'success',
    rejected: 'danger',
  }

  return (
    <div>
      <PageHeader
        title={t('admissions.dashboard.title')}
        sub={t('admissions.dashboard.sub')}
        actions={
          <Link to="/apply" target="_blank" rel="noreferrer">
            <Button variant="secondary" icon={<ExternalLink size={15} />}>
              {t('admissions.dashboard.actions.portalLink')}
            </Button>
          </Link>
        }
      />

      {/* KPI Cards */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPI
          icon={Users}
          label={t('admissions.dashboard.kpis.total')}
          value={formatNumber(totalCount, lang)}
        />
        <KPI
          icon={FileCheck}
          label={t('admissions.dashboard.kpis.shortlisted')}
          value={formatNumber(shortlistedCount, lang)}
        />
        <KPI
          icon={CheckCircle}
          label={t('admissions.dashboard.kpis.admitted')}
          value={formatNumber(admittedCount, lang)}
        />
        <KPI
          icon={Percent}
          label={t('admissions.dashboard.kpis.rate')}
          value={`${formatNumber(admissionRate, lang)}%`}
        />
      </div>

      {/* Filter Tabs & Toolbar */}
      <Toolbar className="flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('topbar.searchPlaceholder')}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            aria-label="Filter by class"
            className="w-40"
          >
            <option value="all">{t('students.allClasses')}</option>
            {ADMISSION_CLASSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>

          <Segmented
            value={statusTab}
            onChange={setStatusTab}
            options={[
              { label: t('admissions.dashboard.tabs.all'), value: 'all' },
              { label: t('admissions.dashboard.tabs.submitted'), value: 'submitted' },
              { label: t('admissions.dashboard.tabs.shortlisted'), value: 'shortlisted' },
              { label: t('admissions.dashboard.tabs.admitted'), value: 'admitted' },
              { label: t('admissions.dashboard.tabs.rejected'), value: 'rejected' },
            ]}
          />
        </div>
      </Toolbar>

      {/* Applicants Roster Table */}
      <TableWrap className="rounded-t-none">
        <Table className="min-w-[760px]">
          <THead>
            <TR>
              <TH>{t('admissions.dashboard.table.appNo')}</TH>
              <TH>{t('admissions.dashboard.table.student')}</TH>
              <TH>{t('admissions.dashboard.table.class')}</TH>
              <TH>{t('admissions.dashboard.table.guardian')}</TH>
              <TH>{t('admissions.dashboard.table.appliedDate')}</TH>
              <TH>{t('admissions.dashboard.table.status')}</TH>
              <TH className="w-28 text-right">{t('admissions.dashboard.table.actions')}</TH>
            </TR>
          </THead>
          <TBody>
            {filteredApplicants.length === 0 ? (
              <TR>
                <TD colSpan={7} className="py-8 text-center">
                  <Empty
                    icon={GraduationCap}
                    title={t('admissions.dashboard.modal.empty')}
                    sub={t('admissions.dashboard.modal.emptySub')}
                  />
                </TD>
              </TR>
            ) : (
              filteredApplicants.map((app) => (
                <TR key={app.id}>
                  <TD className="font-mono text-xs font-semibold text-primary">
                    {app.applicationNo}
                  </TD>
                  <TD>
                    <div className="flex flex-col">
                      <span className="font-semibold text-fg-1">{app.studentName}</span>
                      {app.studentNameBn && (
                        <span className="text-xs text-fg-3">{app.studentNameBn}</span>
                      )}
                    </div>
                  </TD>
                  <TD className="text-xs font-medium">{app.appliedClass}</TD>
                  <TD>
                    <div className="flex flex-col text-xs">
                      <span>{app.guardianName}</span>
                      <span className="text-fg-3">{app.guardianPhone}</span>
                    </div>
                  </TD>
                  <TD className="text-xs text-fg-3">
                    {formatDate(app.appliedAt.slice(0, 10), lang)}
                  </TD>
                  <TD>
                    <Badge tone={statusToneMap[app.status]}>
                      {t(`admissions.dashboard.tabs.${app.status}`)}
                    </Badge>
                  </TD>
                  <TD className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<Eye size={14} />}
                        onClick={() => openReview(app)}
                        aria-label={`Review ${app.studentName}`}
                      >
                        {t('admissions.dashboard.actions.view')}
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </TableWrap>

      {/* Detailed Review Modal */}
      {activeApplicant && (
        <Modal
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          title={`${t('admissions.dashboard.modal.reviewTitle')} · ${activeApplicant.applicationNo}`}
          width={680}
          footer={
            <div className="flex w-full flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<MessageSquare size={14} />}
                  onClick={handleSendSms}
                >
                  {t('admissions.dashboard.actions.sendSms')}
                </Button>
                {activeApplicant.status === 'shortlisted' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Download size={14} />}
                    onClick={() => downloadAdmitCard(activeApplicant)}
                  >
                    {t('admissions.dashboard.actions.downloadAdmitCard')}
                  </Button>
                )}
                {activeApplicant.status === 'admitted' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Download size={14} />}
                    onClick={() => downloadFeeVoucher(activeApplicant)}
                  >
                    {t('admissions.dashboard.actions.downloadVoucher')}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {activeApplicant.status !== 'shortlisted' && activeApplicant.status !== 'admitted' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleStatusChange('shortlisted')}
                  >
                    {t('admissions.dashboard.actions.shortlist')}
                  </Button>
                )}
                {activeApplicant.status !== 'admitted' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStatusChange('admitted')}
                  >
                    {t('admissions.dashboard.actions.admit')}
                  </Button>
                )}
                {activeApplicant.status === 'admitted' && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<UserCheck size={14} />}
                    onClick={handleEnroll}
                  >
                    {t('admissions.dashboard.actions.enroll')}
                  </Button>
                )}
                {activeApplicant.status !== 'rejected' && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleStatusChange('rejected')}
                  >
                    {t('admissions.dashboard.actions.reject')}
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Applicant Profile Details */}
            <div className="rounded-lg border border-divider bg-neutral-50/50 p-3.5">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-fg-2">
                {t('admissions.dashboard.modal.studentInfo')}
              </h4>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <div>
                  <span className="text-fg-3">Full Name: </span>
                  <strong className="text-fg-1">{activeApplicant.studentName}</strong>
                </div>
                <div>
                  <span className="text-fg-3">Bangla Name: </span>
                  <strong className="text-fg-1">{activeApplicant.studentNameBn || '—'}</strong>
                </div>
                <div>
                  <span className="text-fg-3">Applied Class: </span>
                  <strong className="text-primary">{activeApplicant.appliedClass}</strong>
                </div>
                <div>
                  <span className="text-fg-3">DOB: </span>
                  <span>{activeApplicant.dob}</span>
                </div>
                <div>
                  <span className="text-fg-3">Gender: </span>
                  <span>{activeApplicant.gender.toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-fg-3">Blood Group: </span>
                  <span className="font-semibold text-rose-700">{activeApplicant.bloodGroup || '—'}</span>
                </div>
                <div className="sm:col-span-3">
                  <span className="text-fg-3">Birth Certificate (17 Digits): </span>
                  <span className="font-mono">{activeApplicant.birthCertificateNo}</span>
                </div>
              </div>
            </div>

            {/* Guardian Information */}
            <div className="rounded-lg border border-divider bg-neutral-50/50 p-3.5">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-fg-2">
                {t('admissions.dashboard.modal.guardianInfo')}
              </h4>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <div>
                  <span className="text-fg-3">Guardian: </span>
                  <strong className="text-fg-1">{activeApplicant.guardianName}</strong>
                </div>
                <div>
                  <span className="text-fg-3">Phone: </span>
                  <strong className="text-emerald-700">{activeApplicant.guardianPhone}</strong>
                </div>
                <div>
                  <span className="text-fg-3">Email: </span>
                  <span>{activeApplicant.guardianEmail || '—'}</span>
                </div>
                <div>
                  <span className="text-fg-3">Occupation: </span>
                  <span>{activeApplicant.guardianOccupation || '—'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-fg-3">Address: </span>
                  <span>{activeApplicant.presentAddress}</span>
                </div>
              </div>
            </div>

            {/* Test Arrangement details if Shortlisted */}
            {(activeApplicant.status === 'shortlisted' || activeApplicant.status === 'admitted') && (
              <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-3.5">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-blue-900">
                  {t('admissions.dashboard.modal.testDetails')}
                </h4>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <div>
                    <span className="text-blue-700">Exam Roll: </span>
                    <strong className="font-mono text-blue-900">
                      {activeApplicant.examRollNo || 'EXM-6001'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-blue-700">Exam Date: </span>
                    <span>{activeApplicant.examDate || '2026-11-20'}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Exam Venue: </span>
                    <span>{activeApplicant.examVenue || 'Main Academic Hall'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
