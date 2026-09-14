import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Ticket,
  CheckCircle,
  AlertTriangle,
  Building,
  Download,
  ShieldAlert,
  Users,
  Printer,
  RefreshCw,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { KPI } from '@/components/ui/KPI'
import { Segmented } from '@/components/ui/Segmented'
import { Modal } from '@/components/ui/Modal'
import { TableWrap, Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { Field, Input, Select, SearchInput, Textarea } from '@/components/ui/form'
import { useToast } from '@/components/ui/Toast'
import { formatNumber, formatTaka } from '@/lib/utils'
import type { AppLanguage } from '@/i18n'
import type { AdmitCardCandidate, ExamHall } from '@/lib/admit-card'
import {
  createStudentAdmitCardPdf,
  createExamHallDoorNoticePdf,
  createBenchStickersPdf,
} from '@/lib/admit-card-pdf'
import {
  useAdmitCardSessions,
  useAdmitCardCandidates,
  useExamHalls,
  useSeatPlanAllocations,
  useOverrideFeeClearance,
  useGenerateSeatPlan,
} from '@/data/admit-cards'

export default function AdmitCards() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'en') as AppLanguage
  const toast = useToast()

  const [activeTab, setActiveTab] = useState<'admitCards' | 'seatPlan' | 'invigilation'>('admitCards')
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [feeFilter, setFeeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedHallId, setSelectedHallId] = useState<string>('all')

  // Override Modal State
  const [overrideModalOpen, setOverrideModalOpen] = useState(false)
  const [targetCandidate, setTargetCandidate] = useState<AdmitCardCandidate | null>(null)
  const [overrideRemarks, setOverrideRemarks] = useState('')
  const [authorizedBy, setAuthorizedBy] = useState('Prof. Anisur Rahman (Principal)')

  // Queries
  const sessionsQuery = useAdmitCardSessions()
  const candidatesQuery = useAdmitCardCandidates(selectedClass)
  const hallsQuery = useExamHalls()
  const seatPlanQuery = useSeatPlanAllocations()

  const overrideMutation = useOverrideFeeClearance()
  const seatPlanMutation = useGenerateSeatPlan()

  const sessions = useMemo(() => sessionsQuery.data ?? [], [sessionsQuery.data])
  const candidates = useMemo(() => candidatesQuery.data ?? [], [candidatesQuery.data])
  const halls = useMemo(() => hallsQuery.data ?? [], [hallsQuery.data])
  const seatAllocations = useMemo(() => seatPlanQuery.data ?? [], [seatPlanQuery.data])

  const currentSession = sessions[0] ?? {
    title: 'Half-Yearly Examination 2026',
    academicYear: '2026',
  }

  // Filtered Candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        c.studentName.toLowerCase().includes(q) ||
        c.studentNameBn.includes(q) ||
        c.rollNo.includes(q) ||
        c.admitCardNo.toLowerCase().includes(q)

      const matchesFee =
        feeFilter === 'all' || c.clearanceStatus === feeFilter

      return matchesSearch && matchesFee
    })
  }, [candidates, searchQuery, feeFilter])

  // KPIs
  const totalCount = candidates.length
  const clearedCount = candidates.filter((c) => c.clearanceStatus === 'cleared' || c.clearanceStatus === 'overridden').length
  const withheldCount = candidates.filter((c) => c.clearanceStatus === 'withheld').length
  const hallsCount = halls.length

  // Filtered Seat Allocations for Hall Tab
  const filteredAllocations = useMemo(() => {
    if (selectedHallId === 'all') return seatAllocations
    return seatAllocations.filter((a) => a.hallId === selectedHallId)
  }, [seatAllocations, selectedHallId])

  // Handlers
  function handleOpenOverride(c: AdmitCardCandidate) {
    setTargetCandidate(c)
    setOverrideRemarks('Parent submitted formal commitment for clearance')
    setOverrideModalOpen(true)
  }

  async function handleConfirmOverride() {
    if (!targetCandidate) return
    try {
      await overrideMutation.mutateAsync({
        candidateId: targetCandidate.id,
        remarks: overrideRemarks.trim(),
        authorizedBy: authorizedBy.trim(),
      })
      toast.success(t('admitCards.status.overridden'))
      setOverrideModalOpen(false)
      setTargetCandidate(null)
    } catch {
      toast.error(t('common.error'))
    }
  }

  function downloadSingleAdmitCard(candidate: AdmitCardCandidate) {
    const school = {
      schoolName: t('app.school'),
      eiin: '108234',
      address: 'Dhaka, Bangladesh',
      phone: '+880 1711-000000',
    }
    const bytes = createStudentAdmitCardPdf(candidate, school)
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `admit-card-${candidate.admitCardNo.toLowerCase()}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  function downloadBatchAdmitCards() {
    const eligible = filteredCandidates.filter(
      (c) => c.clearanceStatus === 'cleared' || c.clearanceStatus === 'overridden',
    )
    if (eligible.length === 0) {
      toast.error(t('admitCards.empty.desc'))
      return
    }

    // Generate individual cards and trigger download
    eligible.slice(0, 5).forEach((cand, idx) => {
      setTimeout(() => downloadSingleAdmitCard(cand), idx * 250)
    })
    toast.success(`${eligible.length} Admit Cards generated for printing`)
  }

  function downloadDoorNotice(hall: ExamHall) {
    const school = {
      schoolName: t('app.school'),
      eiin: '108234',
      address: 'Dhaka, Bangladesh',
    }
    const bytes = createExamHallDoorNoticePdf(
      hall,
      seatAllocations,
      currentSession.title,
      school,
    )
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `exam-door-notice-${hall.roomName.toLowerCase().replace(/\s+/g, '-')}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  function downloadBenchStickers() {
    const school = {
      schoolName: t('app.school'),
      eiin: '108234',
      address: 'Dhaka, Bangladesh',
    }
    const bytes = createBenchStickersPdf(filteredAllocations, school)
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bench-stickers-${selectedHallId}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleAutoAllocate() {
    try {
      await seatPlanMutation.mutateAsync()
      toast.success(t('admitCards.actions.recalculateSeatPlan'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('admitCards.title')}
        sub={t('admitCards.subtitle')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {activeTab === 'admitCards' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={downloadBatchAdmitCards}
                disabled={clearedCount === 0}
              >
                <Printer className="mr-1.5 h-4 w-4" />
                {t('admitCards.actions.batchPrint')}
              </Button>
            )}
            {activeTab === 'seatPlan' && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={downloadBenchStickers}
                  disabled={filteredAllocations.length === 0}
                >
                  <Ticket className="mr-1.5 h-4 w-4" />
                  {t('admitCards.actions.benchStickers')}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAutoAllocate}
                  disabled={seatPlanMutation.isPending}
                >
                  <RefreshCw className="mr-1.5 h-4 w-4" />
                  {t('admitCards.actions.recalculateSeatPlan')}
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* 4 Summary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI
          icon={Users}
          label={t('admitCards.kpis.totalCandidates')}
          value={formatNumber(totalCount, lang)}
          footer={currentSession.title}
          deltaTone="neutral"
        />
        <KPI
          icon={CheckCircle}
          label={t('admitCards.kpis.cleared')}
          value={formatNumber(clearedCount, lang)}
          footer="Ready for Immediate Print"
          deltaTone="up"
        />
        <KPI
          icon={AlertTriangle}
          label={t('admitCards.kpis.withheld')}
          value={formatNumber(withheldCount, lang)}
          footer="Pending Fee Clearance"
          deltaTone={withheldCount > 0 ? 'down' : 'neutral'}
        />
        <KPI
          icon={Building}
          label={t('admitCards.kpis.halls')}
          value={formatNumber(hallsCount, lang)}
          footer="Active Examination Halls"
          deltaTone="up"
        />
      </div>

      {/* Segmented Filter & Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <Segmented
          value={activeTab}
          onChange={(v) => setActiveTab(v as 'admitCards' | 'seatPlan' | 'invigilation')}
          options={[
            { value: 'admitCards', label: t('admitCards.tabs.admitCards') },
            { value: 'seatPlan', label: t('admitCards.tabs.seatPlan') },
            { value: 'invigilation', label: t('admitCards.tabs.invigilation') },
          ]}
        />

        <div className="flex flex-wrap items-center gap-3">
          {activeTab === 'admitCards' && (
            <>
              <div className="w-56">
                <SearchInput
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('common.search')}
                />
              </div>

              <Select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-40"
              >
                <option value="all">All Classes</option>
                <option value="Class 7">Class 7</option>
                <option value="Class 8">Class 8</option>
                <option value="Class 9">Class 9</option>
                <option value="Class 10">Class 10</option>
              </Select>

              <Select
                value={feeFilter}
                onChange={(e) => setFeeFilter(e.target.value)}
                className="w-44"
              >
                <option value="all">All Fee Statuses</option>
                <option value="cleared">Cleared Only</option>
                <option value="withheld">Dues Withheld</option>
                <option value="overridden">Special Clearance</option>
              </Select>
            </>
          )}

          {activeTab === 'seatPlan' && (
            <Select
              value={selectedHallId}
              onChange={(e) => setSelectedHallId(e.target.value)}
              className="w-64"
            >
              <option value="all">All Exam Halls & Rooms</option>
              {halls.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.roomName}
                </option>
              ))}
            </Select>
          )}
        </div>
      </div>

      {/* Tab 1: Admit Card Desk */}
      {activeTab === 'admitCards' && (
        <TableWrap>
          <Table>
            <THead>
              <TR>
                <TH>{t('admitCards.table.admitNo')}</TH>
                <TH>{t('admitCards.table.candidate')}</TH>
                <TH>{t('admitCards.table.classRoll')}</TH>
                <TH>{t('admitCards.table.feeStatus')}</TH>
                <TH className="text-right">{t('admitCards.table.actions')}</TH>
              </TR>
            </THead>
            <TBody>
              {filteredCandidates.map((cand) => {
                const isCleared = cand.clearanceStatus === 'cleared'
                const isOverridden = cand.clearanceStatus === 'overridden'
                const isWithheld = cand.clearanceStatus === 'withheld'

                return (
                  <TR key={cand.id}>
                    <TD className="font-mono text-sm font-semibold text-slate-800">
                      {cand.admitCardNo}
                    </TD>
                    <TD>
                      <div className="font-medium text-slate-900">
                        {lang === 'bn' ? cand.studentNameBn : cand.studentName}
                      </div>
                      <div className="text-xs text-slate-500">
                        ID: {cand.studentId} · Guardian: {cand.guardianName}
                      </div>
                    </TD>
                    <TD>
                      <div className="font-medium text-slate-800">
                        {cand.className} ({cand.section})
                      </div>
                      <div className="text-xs text-slate-500">
                        Roll: {cand.rollNo} {cand.group ? `· ${cand.group}` : ''}
                      </div>
                    </TD>
                    <TD>
                      {isCleared && (
                        <Badge tone="success">
                          {t('admitCards.status.cleared')}
                        </Badge>
                      )}
                      {isOverridden && (
                        <div>
                          <Badge tone="warning">
                            {t('admitCards.status.overridden')}
                          </Badge>
                          <div className="text-[10px] text-amber-700 mt-0.5">
                            {cand.overrideRemarks}
                          </div>
                        </div>
                      )}
                      {isWithheld && (
                        <div>
                          <Badge tone="danger">
                            {t('admitCards.status.withheld')}
                          </Badge>
                          <div className="text-[11px] font-semibold text-rose-700 mt-0.5">
                            Due: {formatTaka(cand.feeDueAmount, lang)}
                          </div>
                        </div>
                      )}
                    </TD>
                    <TD className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isWithheld ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenOverride(cand)}
                            className="text-amber-700"
                          >
                            <ShieldAlert className="mr-1 h-3.5 w-3.5" />
                            {t('admitCards.actions.overrideFee')}
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => downloadSingleAdmitCard(cand)}
                            title={t('admitCards.actions.downloadAdmitCard')}
                          >
                            <Download className="mr-1 h-3.5 w-3.5" />
                            PDF
                          </Button>
                        )}
                      </div>
                    </TD>
                  </TR>
                )
              })}
            </TBody>
          </Table>
        </TableWrap>
      )}

      {/* Tab 2: Hall Seat Planner */}
      {activeTab === 'seatPlan' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {halls.map((hall) => {
              const hallSeated = seatAllocations.filter(
                (a) => a.hallId === hall.id || a.hallName === hall.roomName,
              ).length

              return (
                <div
                  key={hall.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-900">{hall.roomName}</div>
                    <Badge tone="info">{hall.building}</Badge>
                  </div>
                  <div className="mt-2 text-xs text-slate-600">
                    Floor {hall.floor} · {hall.totalBenches} Benches · {hall.totalBenches * 2} Capacity
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Invigilator: {hall.invigilatorName}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-xs font-semibold text-slate-700">
                      {hallSeated} Students Seated
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => downloadDoorNotice(hall)}
                    >
                      <Download className="mr-1 h-3.5 w-3.5" />
                      {t('admitCards.actions.doorNotice')}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          <TableWrap>
            <Table>
              <THead>
                <TR>
                  <TH>{t('admitCards.table.hall')}</TH>
                  <TH>{t('admitCards.table.bench')}</TH>
                  <TH>{t('admitCards.table.seat')}</TH>
                  <TH>{t('admitCards.table.candidate')}</TH>
                  <TH>{t('admitCards.table.classRoll')}</TH>
                </TR>
              </THead>
              <TBody>
                {filteredAllocations.map((alloc) => (
                  <TR key={alloc.id}>
                    <TD className="font-medium text-slate-900">{alloc.hallName}</TD>
                    <TD className="font-mono text-sm font-semibold text-slate-800">
                      Bench {alloc.benchNo}
                    </TD>
                    <TD>
                      <Badge tone={alloc.seatPosition === 'Left' ? 'info' : 'warning'}>
                        {alloc.seatPosition} Seat
                      </Badge>
                    </TD>
                    <TD>
                      <div className="font-semibold text-slate-900">
                        {alloc.candidate.studentName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {alloc.candidate.admitCardNo}
                      </div>
                    </TD>
                    <TD>
                      <div className="font-medium text-slate-800">
                        {alloc.candidate.className}
                      </div>
                      <div className="text-xs text-slate-500">
                        Roll: {alloc.candidate.rollNo}
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </TableWrap>
        </div>
      )}

      {/* Tab 3: Invigilation Schedule */}
      {activeTab === 'invigilation' && (
        <TableWrap>
          <Table>
            <THead>
              <TR>
                <TH>{t('admitCards.table.hall')}</TH>
                <TH>Location</TH>
                <TH>Benches / Capacity</TH>
                <TH>{t('admitCards.table.invigilator')}</TH>
                <TH>Contact Phone</TH>
                <TH>Assigned Shift</TH>
              </TR>
            </THead>
            <TBody>
              {halls.map((hall, idx) => (
                <TR key={hall.id}>
                  <TD className="font-semibold text-slate-900">{hall.roomName}</TD>
                  <TD className="text-xs text-slate-600">
                    {hall.building}, Floor {hall.floor}
                  </TD>
                  <TD className="text-xs font-mono text-slate-700">
                    {hall.totalBenches} Benches ({hall.totalBenches * 2} Seats)
                  </TD>
                  <TD className="font-medium text-slate-900">{hall.invigilatorName}</TD>
                  <TD className="text-xs font-mono text-slate-600">
                    {hall.invigilatorPhone}
                  </TD>
                  <TD>
                    <Badge tone={idx % 2 === 0 ? 'info' : 'neutral'}>
                      {idx % 2 === 0 ? 'Morning (10:00 AM)' : 'Afternoon (2:00 PM)'}
                    </Badge>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableWrap>
      )}

      {/* Modal: Authorize Fee Clearance Override */}
      <Modal
        open={overrideModalOpen}
        onClose={() => setOverrideModalOpen(false)}
        title={t('admitCards.modal.overrideTitle')}
      >
        <div className="space-y-4 py-2">
          {targetCandidate && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 space-y-1">
              <div className="font-semibold text-sm text-amber-950">
                {targetCandidate.studentName} ({targetCandidate.admitCardNo})
              </div>
              <div>
                Class: {targetCandidate.className} · Roll: {targetCandidate.rollNo} · Outstanding Dues: ৳{targetCandidate.feeDueAmount.toLocaleString()}
              </div>
              <div className="text-[11px] text-amber-700">
                {t('admitCards.modal.overrideSub')}
              </div>
            </div>
          )}

          <Field label={t('admitCards.modal.remarks')}>
            <Textarea
              value={overrideRemarks}
              onChange={(e) => setOverrideRemarks(e.target.value)}
              rows={3}
              placeholder="e.g. Guardian submitted financial relief appeal approved by Principal"
            />
          </Field>

          <Field label={t('admitCards.modal.authorizedBy')}>
            <Input
              value={authorizedBy}
              onChange={(e) => setAuthorizedBy(e.target.value)}
            />
          </Field>

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="ghost" onClick={() => setOverrideModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmOverride}
              disabled={overrideMutation.isPending}
            >
              {t('admitCards.modal.confirmOverride')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
