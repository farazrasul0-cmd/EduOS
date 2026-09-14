import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Award,
  FileText,
  GraduationCap,
  Building2,
  Plus,
  Download,
  Eye,
  Trash2,
  Calendar,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { KPI } from '@/components/ui/KPI'
import { Segmented } from '@/components/ui/Segmented'
import { Modal } from '@/components/ui/Modal'
import { TableWrap, Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { Field, Input, Select, SearchInput } from '@/components/ui/form'
import { useToast } from '@/components/ui/Toast'
import { formatNumber } from '@/lib/utils'
import type { AppLanguage } from '@/i18n'
import type {
  CertificateRecord,
  CertificateType,
  EducationBoard,
} from '@/lib/certificates'
import {
  EDUCATION_BOARDS,
  getCertificateTypeLabel,
} from '@/lib/certificates'
import {
  createTransferCertificatePdf,
  createTestimonialPdf,
  createBonafideCertificatePdf,
} from '@/lib/certificates-pdf'
import {
  useCertificates,
  useIssueCertificate,
  useRevokeCertificate,
  type IssueCertificatePayload,
} from '@/data/certificates'

export default function Certificates() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'en') as AppLanguage
  const toast = useToast()

  const [activeTab, setActiveTab] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Modals state
  const [issueModalOpen, setIssueModalOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [selectedRecordForPreview, setSelectedRecordForPreview] = useState<CertificateRecord | null>(null)

  // Issue Form State
  const [certType, setCertType] = useState<CertificateType>('tc')
  const [studentName, setStudentName] = useState('')
  const [studentNameBn, setStudentNameBn] = useState('')
  const [fatherName, setFatherName] = useState('')
  const [fatherNameBn, setFatherNameBn] = useState('')
  const [motherName, setMotherName] = useState('')
  const [motherNameBn, setMotherNameBn] = useState('')
  const [birthRegNo, setBirthRegNo] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('2012-01-01')
  const [className, setClassName] = useState('Class 7')
  const [section, setSection] = useState('A')
  const [rollNo, setRollNo] = useState('01')
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male')

  // TC specific
  const [reasonForLeaving, setReasonForLeaving] = useState("Father's job transfer / family relocation")
  const [conduct, setConduct] = useState<'Excellent' | 'Very Good' | 'Good' | 'Satisfactory'>('Good')
  const [promotedToClass, setPromotedToClass] = useState('Promoted to next grade')
  const [duesClearedUpTo, setDuesClearedUpTo] = useState('Current month')
  const [admissionDate, setAdmissionDate] = useState('2023-01-10')
  const [dateOfLeaving, setDateOfLeaving] = useState(new Date().toISOString().slice(0, 10))

  // Testimonial specific
  const [boardName, setBoardName] = useState<EducationBoard>('Dhaka')
  const [boardRollNo, setBoardRollNo] = useState('')
  const [boardRegNo, setBoardRegNo] = useState('')
  const [session, setSession] = useState('2024-2025')
  const [passingYear, setPassingYear] = useState('2026')
  const [gpaAchieved, setGpaAchieved] = useState('5.00')
  const [gradeAchieved, setGradeAchieved] = useState('A+')
  const [activities, setActivities] = useState('Scouts, Debate, Sports Club')

  // Bonafide specific
  const [purpose, setPurpose] = useState('Opening Student Bank Account / Passport Application')
  const [validUntil, setValidUntil] = useState('2026-12-31')

  // Queries & Mutations
  const certsQuery = useCertificates()
  const issueMutation = useIssueCertificate()
  const revokeMutation = useRevokeCertificate()

  const certificates = useMemo(() => certsQuery.data ?? [], [certsQuery.data])

  // KPIs
  const totalIssued = certificates.length
  const totalTc = useMemo(
    () => certificates.filter((c) => c.certificateType === 'tc').length,
    [certificates],
  )
  const totalTestimonial = useMemo(
    () => certificates.filter((c) => c.certificateType === 'testimonial').length,
    [certificates],
  )
  const totalBonafide = useMemo(
    () => certificates.filter((c) => c.certificateType === 'bonafide').length,
    [certificates],
  )

  // Filtered List
  const filteredCertificates = useMemo(() => {
    return certificates.filter((c) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        c.studentName.toLowerCase().includes(q) ||
        c.studentNameBn.includes(q) ||
        c.serialNo.toLowerCase().includes(q) ||
        c.rollNo.includes(q) ||
        c.className.toLowerCase().includes(q)

      const matchesTab = activeTab === 'all' || c.certificateType === activeTab
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter

      return matchesSearch && matchesTab && matchesStatus
    })
  }, [certificates, searchQuery, activeTab, statusFilter])

  // Download PDF Handler
  function downloadCertificatePdf(record: CertificateRecord) {
    const school = {
      schoolName: t('app.school'),
      eiin: '108234',
      address: 'Dhaka, Bangladesh',
      phone: '+880 1711-000000',
      establishedYear: '1995',
    }

    let pdfBytes: Uint8Array
    let filename: string

    if (record.certificateType === 'tc') {
      pdfBytes = createTransferCertificatePdf(record, school)
      filename = `transfer-certificate-${record.serialNo.toLowerCase()}.pdf`
    } else if (record.certificateType === 'testimonial') {
      pdfBytes = createTestimonialPdf(record, school)
      filename = `testimonial-${record.serialNo.toLowerCase()}.pdf`
    } else {
      pdfBytes = createBonafideCertificatePdf(record, school)
      filename = `bonafide-certificate-${record.serialNo.toLowerCase()}.pdf`
    }

    const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  // Handle Form Submit
  async function handleIssueCertificate() {
    if (!studentName.trim() || !fatherName.trim() || !motherName.trim()) {
      toast.error(t('common.error'))
      return
    }

    try {
      const payload: IssueCertificatePayload = {
        certificateType: certType,
        studentId: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
        studentName: studentName.trim(),
        studentNameBn: studentNameBn.trim() || undefined,
        fatherName: fatherName.trim(),
        fatherNameBn: fatherNameBn.trim() || undefined,
        motherName: motherName.trim(),
        motherNameBn: motherNameBn.trim() || undefined,
        birthRegNo: birthRegNo.trim() || '20122692019283719',
        dateOfBirth,
        className,
        section,
        rollNo,
        gender,
        admissionDate,
        dateOfLeaving,
        reasonForLeaving,
        conduct,
        promotedToClass,
        duesClearedUpTo,
        boardName,
        boardRollNo,
        boardRegNo,
        session,
        passingYear: Number(passingYear) || 2026,
        gpaAchieved: Number(gpaAchieved) || 5.0,
        gradeAchieved,
        activities,
        purpose,
        validUntil,
      }

      await issueMutation.mutateAsync(payload)
      toast.success(t('certificates.messages.issued'))
      setIssueModalOpen(false)

      // Reset fields
      setStudentName('')
      setStudentNameBn('')
      setFatherName('')
      setFatherNameBn('')
      setMotherName('')
      setMotherNameBn('')
      setBirthRegNo('')
    } catch {
      toast.error(t('common.error'))
    }
  }

  // Revoke Handler
  async function handleRevoke(id: string) {
    try {
      await revokeMutation.mutateAsync(id)
      toast.success(t('certificates.messages.revoked'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('certificates.title')}
        sub={t('certificates.subtitle')}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIssueModalOpen(true)}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            {t('certificates.actions.issue')}
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI
          icon={Award}
          label={t('certificates.kpis.total')}
          value={formatNumber(totalIssued, lang)}
          footer="Active Institutional Register"
          deltaTone="up"
        />
        <KPI
          icon={FileText}
          label={t('certificates.kpis.tc')}
          value={formatNumber(totalTc, lang)}
          footer="Transfer Certificates"
          deltaTone="neutral"
        />
        <KPI
          icon={GraduationCap}
          label={t('certificates.kpis.testimonials')}
          value={formatNumber(totalTestimonial, lang)}
          footer="SSC / HSC Batches"
          deltaTone="up"
        />
        <KPI
          icon={Building2}
          label={t('certificates.kpis.bonafide')}
          value={formatNumber(totalBonafide, lang)}
          footer="Passport & Bank Verification"
          deltaTone="neutral"
        />
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <Segmented
          value={activeTab}
          onChange={(v) => setActiveTab(v)}
          options={[
            { value: 'all', label: t('certificates.tabs.all') },
            { value: 'tc', label: t('certificates.tabs.tc') },
            { value: 'testimonial', label: t('certificates.tabs.testimonial') },
            { value: 'bonafide', label: t('certificates.tabs.bonafide') },
          ]}
        />

        <div className="flex flex-wrap items-center gap-3">
          <div className="w-64">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('common.search')}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-40"
          >
            <option value="all">{t('payroll.filter.allStatuses')}</option>
            <option value="issued">{t('certificates.status.issued')}</option>
            <option value="pending">{t('certificates.status.pending')}</option>
            <option value="revoked">{t('certificates.status.revoked')}</option>
          </Select>
        </div>
      </div>

      {/* Certificates Roster Table */}
      {filteredCertificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Award className="h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-base font-medium text-slate-800">{t('certificates.empty.title')}</h3>
          <p className="mt-1 text-sm text-slate-500">{t('certificates.empty.desc')}</p>
          <Button
            variant="primary"
            size="sm"
            className="mt-4"
            onClick={() => setIssueModalOpen(true)}
          >
            {t('certificates.actions.issue')}
          </Button>
        </div>
      ) : (
        <TableWrap>
          <Table>
            <THead>
              <TR>
                <TH>{t('certificates.table.serial')}</TH>
                <TH>{t('certificates.table.student')}</TH>
                <TH>{t('certificates.table.type')}</TH>
                <TH>{t('certificates.table.class')}</TH>
                <TH>{t('certificates.table.issueDate')}</TH>
                <TH>{t('certificates.table.status')}</TH>
                <TH className="text-right">{t('certificates.table.actions')}</TH>
              </TR>
            </THead>
            <TBody>
              {filteredCertificates.map((cert) => (
                <TR key={cert.id}>
                  <TD className="font-mono text-xs font-bold text-slate-700">{cert.serialNo}</TD>
                  <TD>
                    <div className="font-medium text-slate-900">
                      {lang === 'bn' ? cert.studentNameBn : cert.studentName}
                    </div>
                    <div className="text-xs text-slate-500">
                      Father: {lang === 'bn' ? cert.fatherNameBn : cert.fatherName}
                    </div>
                  </TD>
                  <TD>
                    <div className="text-xs font-semibold text-slate-800">
                      {getCertificateTypeLabel(cert.certificateType, lang)}
                    </div>
                    {cert.certificateType === 'testimonial' && cert.boardRollNo && (
                      <div className="text-[11px] text-slate-500">
                        Roll: {cert.boardRollNo} · GPA: {cert.gpaAchieved}
                      </div>
                    )}
                    {cert.certificateType === 'tc' && cert.reasonForLeaving && (
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">
                        {cert.reasonForLeaving}
                      </div>
                    )}
                    {cert.certificateType === 'bonafide' && cert.purpose && (
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">
                        {cert.purpose}
                      </div>
                    )}
                  </TD>
                  <TD>
                    <span className="text-sm font-medium text-slate-700">{cert.className}</span>
                    <span className="ml-1 text-xs text-slate-500">({cert.section}-{cert.rollNo})</span>
                  </TD>
                  <TD className="text-xs text-slate-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {cert.issueDate}
                    </div>
                  </TD>
                  <TD>
                    <Badge
                      tone={
                        cert.status === 'issued'
                          ? 'success'
                          : cert.status === 'pending'
                            ? 'warning'
                            : 'danger'
                      }
                    >
                      {t(`certificates.status.${cert.status}`)}
                    </Badge>
                  </TD>
                  <TD className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        title={t('certificates.actions.preview')}
                        onClick={() => {
                          setSelectedRecordForPreview(cert)
                          setPreviewModalOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4 text-slate-600" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        title={t('certificates.actions.download')}
                        onClick={() => downloadCertificatePdf(cert)}
                        className="text-indigo-600 hover:text-indigo-700"
                      >
                        <Download className="mr-1 h-3.5 w-3.5" />
                        PDF
                      </Button>
                      {cert.status !== 'revoked' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          title={t('certificates.actions.revoke')}
                          onClick={() => handleRevoke(cert.id)}
                          className="text-rose-600 hover:text-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Modal: Issue Official Certificate */}
      <Modal
        open={issueModalOpen}
        onClose={() => setIssueModalOpen(false)}
        title={t('certificates.modal.issueTitle')}
      >
        <div className="max-h-[75vh] space-y-4 overflow-y-auto py-2 pr-1">
          {/* Certificate Type Picker */}
          <Field label={t('certificates.modal.selectType')}>
            <Select
              value={certType}
              onChange={(e) => setCertType(e.target.value as CertificateType)}
            >
              <option value="tc">{t('certificates.types.tc')}</option>
              <option value="testimonial">{t('certificates.types.testimonial')}</option>
              <option value="bonafide">{t('certificates.types.bonafide')}</option>
            </Select>
          </Field>

          {/* Student General Information */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
              {t('certificates.modal.studentInfo')}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t('certificates.modal.studentName')}>
                <Input
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Amina Begum"
                />
              </Field>
              <Field label={t('certificates.modal.studentNameBn')}>
                <Input
                  value={studentNameBn}
                  onChange={(e) => setStudentNameBn(e.target.value)}
                  placeholder="উদা. আমিনা বেগম"
                />
              </Field>
              <Field label={t('certificates.modal.fatherName')}>
                <Input
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  placeholder="e.g. Md. Abdur Rahim"
                />
              </Field>
              <Field label={t('certificates.modal.motherName')}>
                <Input
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  placeholder="e.g. Rokeya Begum"
                />
              </Field>
              <Field label={t('certificates.modal.birthRegNo')}>
                <Input
                  value={birthRegNo}
                  onChange={(e) => setBirthRegNo(e.target.value)}
                  placeholder="17 Digits"
                />
              </Field>
              <Field label={t('certificates.modal.dob')}>
                <Input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </Field>
              <Field label={t('certificates.modal.class')}>
                <Input
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label={t('certificates.modal.section')}>
                  <Input
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                  />
                </Field>
                <Field label={t('certificates.modal.roll')}>
                  <Input
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                  />
                </Field>
              </div>
              <Field label={t('certificates.modal.gender')}>
                <Select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other')}
                >
                  <option value="male">{t('certificates.modal.male')}</option>
                  <option value="female">{t('certificates.modal.female')}</option>
                  <option value="other">Other</option>
                </Select>
              </Field>
            </div>
          </div>

          {/* Type Specific Fields */}
          {certType === 'tc' && (
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                {t('certificates.modal.tcDetails')}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('certificates.modal.reasonForLeaving')}>
                  <Input
                    value={reasonForLeaving}
                    onChange={(e) => setReasonForLeaving(e.target.value)}
                  />
                </Field>
                <Field label={t('certificates.modal.conduct')}>
                  <Select
                    value={conduct}
                    onChange={(e) =>
                      setConduct(e.target.value as 'Excellent' | 'Very Good' | 'Good' | 'Satisfactory')
                    }
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Very Good">Very Good</option>
                    <option value="Good">Good</option>
                    <option value="Satisfactory">Satisfactory</option>
                  </Select>
                </Field>
                <Field label={t('certificates.modal.promotedTo')}>
                  <Input
                    value={promotedToClass}
                    onChange={(e) => setPromotedToClass(e.target.value)}
                  />
                </Field>
                <Field label={t('certificates.modal.duesCleared')}>
                  <Input
                    value={duesClearedUpTo}
                    onChange={(e) => setDuesClearedUpTo(e.target.value)}
                  />
                </Field>
                <Field label="Admission Date">
                  <Input
                    type="date"
                    value={admissionDate}
                    onChange={(e) => setAdmissionDate(e.target.value)}
                  />
                </Field>
                <Field label="Date of Leaving">
                  <Input
                    type="date"
                    value={dateOfLeaving}
                    onChange={(e) => setDateOfLeaving(e.target.value)}
                  />
                </Field>
              </div>
            </div>
          )}

          {certType === 'testimonial' && (
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                {t('certificates.modal.testimonialDetails')}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('certificates.modal.board')}>
                  <Select
                    value={boardName}
                    onChange={(e) => setBoardName(e.target.value as EducationBoard)}
                  >
                    {EDUCATION_BOARDS.map((b) => (
                      <option key={b} value={b}>
                        {b} Board
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={t('certificates.modal.boardRoll')}>
                  <Input
                    value={boardRollNo}
                    onChange={(e) => setBoardRollNo(e.target.value)}
                    placeholder="e.g. 482910"
                  />
                </Field>
                <Field label={t('certificates.modal.boardReg')}>
                  <Input
                    value={boardRegNo}
                    onChange={(e) => setBoardRegNo(e.target.value)}
                    placeholder="e.g. 2118392102"
                  />
                </Field>
                <Field label="Academic Session">
                  <Input
                    value={session}
                    onChange={(e) => setSession(e.target.value)}
                    placeholder="e.g. 2024-2025"
                  />
                </Field>
                <Field label={t('certificates.modal.passingYear')}>
                  <Input
                    value={passingYear}
                    onChange={(e) => setPassingYear(e.target.value)}
                  />
                </Field>
                <Field label={t('certificates.modal.gpa')}>
                  <Input
                    value={gpaAchieved}
                    onChange={(e) => setGpaAchieved(e.target.value)}
                    placeholder="5.00"
                  />
                </Field>
                <Field label={t('certificates.modal.grade')}>
                  <Input
                    value={gradeAchieved}
                    onChange={(e) => setGradeAchieved(e.target.value)}
                    placeholder="A+"
                  />
                </Field>
                <div className="col-span-2">
                  <Field label={t('certificates.modal.activities')}>
                    <Input
                      value={activities}
                      onChange={(e) => setActivities(e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {certType === 'bonafide' && (
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                {t('certificates.modal.bonafideDetails')}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('certificates.modal.purpose')}>
                  <Input
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                  />
                </Field>
                <Field label={t('certificates.modal.validUntil')}>
                  <Input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </Field>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="ghost" onClick={() => setIssueModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleIssueCertificate}
              disabled={issueMutation.isPending}
            >
              {t('certificates.modal.submitBtn')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Document Preview */}
      <Modal
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title={t('certificates.modal.previewTitle')}
      >
        {selectedRecordForPreview && (
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    {lang === 'bn'
                      ? selectedRecordForPreview.studentNameBn
                      : selectedRecordForPreview.studentName}
                  </h4>
                  <p className="text-xs font-mono text-indigo-600">
                    {selectedRecordForPreview.serialNo}
                  </p>
                </div>
                <Badge
                  tone={
                    selectedRecordForPreview.status === 'issued'
                      ? 'success'
                      : selectedRecordForPreview.status === 'pending'
                        ? 'warning'
                        : 'danger'
                  }
                >
                  {t(`certificates.status.${selectedRecordForPreview.status}`)}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-200 pt-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-700">Type: </span>
                  {getCertificateTypeLabel(selectedRecordForPreview.certificateType, lang)}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Class & Roll: </span>
                  {selectedRecordForPreview.className} ({selectedRecordForPreview.section}-{selectedRecordForPreview.rollNo})
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Father: </span>
                  {selectedRecordForPreview.fatherName}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Mother: </span>
                  {selectedRecordForPreview.motherName}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Birth Reg No: </span>
                  <span className="font-mono">{selectedRecordForPreview.birthRegNo}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Issue Date: </span>
                  {selectedRecordForPreview.issueDate}
                </div>
              </div>

              {selectedRecordForPreview.certificateType === 'tc' && (
                <div className="mt-3 rounded bg-white p-2.5 text-xs text-slate-600">
                  <div><strong>Reason:</strong> {selectedRecordForPreview.reasonForLeaving}</div>
                  <div><strong>Conduct:</strong> {selectedRecordForPreview.conduct}</div>
                  <div><strong>Dues Cleared:</strong> {selectedRecordForPreview.duesClearedUpTo}</div>
                </div>
              )}

              {selectedRecordForPreview.certificateType === 'testimonial' && (
                <div className="mt-3 rounded bg-white p-2.5 text-xs text-slate-600">
                  <div><strong>Board & Roll:</strong> {selectedRecordForPreview.boardName} Board (Roll: {selectedRecordForPreview.boardRollNo}, Reg: {selectedRecordForPreview.boardRegNo})</div>
                  <div><strong>GPA & Grade:</strong> GPA {selectedRecordForPreview.gpaAchieved} ({selectedRecordForPreview.gradeAchieved}) in {selectedRecordForPreview.passingYear}</div>
                  <div><strong>Activities:</strong> {selectedRecordForPreview.activities}</div>
                </div>
              )}

              {selectedRecordForPreview.certificateType === 'bonafide' && (
                <div className="mt-3 rounded bg-white p-2.5 text-xs text-slate-600">
                  <div><strong>Purpose:</strong> {selectedRecordForPreview.purpose}</div>
                  <div><strong>Valid Until:</strong> {selectedRecordForPreview.validUntil}</div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setPreviewModalOpen(false)}>
                {t('common.close')}
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  downloadCertificatePdf(selectedRecordForPreview)
                  setPreviewModalOpen(false)
                }}
              >
                <Download className="mr-1.5 h-4 w-4" />
                {t('certificates.actions.download')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
