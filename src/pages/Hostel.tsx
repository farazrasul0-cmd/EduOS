import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bed,
  Building,
  Users,
  Clock,
  Plus,
  Download,
  Eye,
  Check,
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
import { formatNumber, formatTaka } from '@/lib/utils'
import type { AppLanguage } from '@/i18n'
import type {
  HostelGatePass,
} from '@/lib/hostel'
import {
  calculateOccupancyRate,
  getRoomTypeLabel,
} from '@/lib/hostel'
import {
  createHostelGatePassPdf,
  createHostelOccupancyReportPdf,
} from '@/lib/hostel-pdf'
import {
  useHostelRooms,
  useHostelBoarders,
  useHostelGatePasses,
  useAllocateBoarder,
  useVacateBoarder,
  useIssueGatePass,
  useReturnGatePass,
} from '@/data/hostel'

export default function Hostel() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'en') as AppLanguage
  const toast = useToast()

  const [activeTab, setActiveTab] = useState<'rooms' | 'boarders' | 'gatepass'>('rooms')
  const [searchQuery, setSearchQuery] = useState('')
  const [buildingFilter, setBuildingFilter] = useState<string>('all')

  // Modals state
  const [allocateModalOpen, setAllocateModalOpen] = useState(false)
  const [gatePassModalOpen, setGatePassModalOpen] = useState(false)
  const [previewPassModalOpen, setPreviewPassModalOpen] = useState(false)
  const [selectedPassForPreview, setSelectedPassForPreview] = useState<HostelGatePass | null>(null)

  // Allocate Boarder Form State
  const [studentName, setStudentName] = useState('')
  const [studentNameBn, setStudentNameBn] = useState('')
  const [className, setClassName] = useState('Class 8')
  const [rollNo, setRollNo] = useState('05')
  const [selectedBuilding, setSelectedBuilding] = useState('Kazi Nazrul Islam Hall')
  const [selectedRoom, setSelectedRoom] = useState('101')
  const [bedNo, setBedNo] = useState('Bed-A')
  const [guardianName, setGuardianName] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [seatRent, setSeatRent] = useState('2500')
  const [messFee, setMessFee] = useState('3500')

  // Gate Pass Form State
  const [passStudentName, setPassStudentName] = useState('')
  const [passStudentNameBn, setPassStudentNameBn] = useState('')
  const [passBuilding, setPassBuilding] = useState('Kazi Nazrul Islam Hall')
  const [passRoom, setPassRoom] = useState('101')
  const [passPhone, setPassPhone] = useState('')
  const [destination, setDestination] = useState('')
  const [reason, setReason] = useState('Weekend home visit')
  const [departureDate, setDepartureDate] = useState(new Date().toISOString().slice(0, 10))
  const [departureTime, setDepartureTime] = useState('04:00 PM')
  const [expectedReturnDate, setExpectedReturnDate] = useState(new Date().toISOString().slice(0, 10))
  const [expectedReturnTime, setExpectedReturnTime] = useState('07:00 PM')

  // Queries & Mutations
  const roomsQuery = useHostelRooms()
  const boardersQuery = useHostelBoarders()
  const gatePassesQuery = useHostelGatePasses()

  const allocateMutation = useAllocateBoarder()
  const vacateMutation = useVacateBoarder()
  const issuePassMutation = useIssueGatePass()
  const returnPassMutation = useReturnGatePass()

  const rooms = useMemo(() => roomsQuery.data ?? [], [roomsQuery.data])
  const boarders = useMemo(() => boardersQuery.data ?? [], [boardersQuery.data])
  const gatePasses = useMemo(() => gatePassesQuery.data ?? [], [gatePassesQuery.data])

  // KPIs
  const totalCapacity = useMemo(() => rooms.reduce((sum, r) => sum + r.capacity, 0), [rooms])
  const totalOccupied = useMemo(() => rooms.reduce((sum, r) => sum + r.occupiedBeds, 0), [rooms])
  const vacantBeds = Math.max(0, totalCapacity - totalOccupied)
  const occupancyRate = calculateOccupancyRate(totalCapacity, totalOccupied)

  // Filtered Rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        r.roomNo.toLowerCase().includes(q) ||
        r.buildingName.toLowerCase().includes(q)
      const matchesBuilding = buildingFilter === 'all' || r.buildingName === buildingFilter
      return matchesSearch && matchesBuilding
    })
  }, [rooms, searchQuery, buildingFilter])

  // Filtered Boarders
  const filteredBoarders = useMemo(() => {
    return boarders.filter((b) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        b.studentName.toLowerCase().includes(q) ||
        b.studentNameBn.includes(q) ||
        b.roomNo.toLowerCase().includes(q) ||
        b.guardianPhone.includes(q)
      const matchesBuilding = buildingFilter === 'all' || b.buildingName === buildingFilter
      return matchesSearch && matchesBuilding
    })
  }, [boarders, searchQuery, buildingFilter])

  // Filtered Gate Passes
  const filteredGatePasses = useMemo(() => {
    return gatePasses.filter((p) => {
      const q = searchQuery.toLowerCase().trim()
      return (
        !q ||
        p.studentName.toLowerCase().includes(q) ||
        p.studentNameBn.includes(q) ||
        p.passNo.toLowerCase().includes(q) ||
        p.destination.toLowerCase().includes(q)
      )
    })
  }, [gatePasses, searchQuery])

  // Handlers
  async function handleAllocate() {
    if (!studentName.trim() || !guardianPhone.trim()) {
      toast.error(t('common.error'))
      return
    }

    try {
      await allocateMutation.mutateAsync({
        studentId: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
        studentName: studentName.trim(),
        studentNameBn: studentNameBn.trim() || undefined,
        className,
        rollNo,
        buildingName: selectedBuilding,
        roomNo: selectedRoom,
        bedNo,
        guardianName: guardianName.trim() || 'Guardian',
        guardianPhone: guardianPhone.trim(),
        monthlySeatRent: Number(seatRent) || 2000,
        monthlyMessFee: Number(messFee) || 3500,
      })
      toast.success(t('hostel.messages.allocated'))
      setAllocateModalOpen(false)

      setStudentName('')
      setStudentNameBn('')
      setGuardianName('')
      setGuardianPhone('')
    } catch {
      toast.error(t('common.error'))
    }
  }

  async function handleVacate(boarderId: string) {
    try {
      await vacateMutation.mutateAsync(boarderId)
      toast.success(t('hostel.messages.vacated'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  async function handleIssuePass() {
    if (!passStudentName.trim() || !destination.trim()) {
      toast.error(t('common.error'))
      return
    }

    try {
      await issuePassMutation.mutateAsync({
        studentId: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
        studentName: passStudentName.trim(),
        studentNameBn: passStudentNameBn.trim() || undefined,
        buildingName: passBuilding,
        roomNo: passRoom,
        guardianPhone: passPhone.trim() || '01711000000',
        destination: destination.trim(),
        reason: reason.trim(),
        departureDate,
        departureTime,
        expectedReturnDate,
        expectedReturnTime,
      })
      toast.success(t('hostel.messages.passIssued'))
      setGatePassModalOpen(false)

      setPassStudentName('')
      setPassStudentNameBn('')
      setDestination('')
    } catch {
      toast.error(t('common.error'))
    }
  }

  async function handleReturnPass(passId: string) {
    try {
      await returnPassMutation.mutateAsync(passId)
      toast.success(t('hostel.messages.returned'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  function downloadPassPdf(pass: HostelGatePass) {
    const school = {
      schoolName: t('app.school'),
      eiin: '108234',
      address: 'Dhaka, Bangladesh',
      phone: '+880 1711-000000',
    }
    const bytes = createHostelGatePassPdf(pass, school)
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `gatepass-${pass.passNo.toLowerCase()}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }

  function downloadOccupancyPdf() {
    const school = {
      schoolName: t('app.school'),
      eiin: '108234',
      address: 'Dhaka, Bangladesh',
    }
    const bytes = createHostelOccupancyReportPdf(rooms, boarders, school)
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `hostel-occupancy-report-${new Date().toISOString().slice(0, 10)}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('hostel.title')}
        sub={t('hostel.subtitle')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={downloadOccupancyPdf}
            >
              <Download className="mr-1.5 h-4 w-4" />
              {t('hostel.actions.downloadRegister')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setGatePassModalOpen(true)}
            >
              <Calendar className="mr-1.5 h-4 w-4" />
              {t('hostel.actions.issuePass')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setAllocateModalOpen(true)}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              {t('hostel.actions.allocate')}
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI
          icon={Bed}
          label={t('hostel.kpis.capacity')}
          value={formatNumber(totalCapacity, lang)}
          footer="Combined Hall Capacity"
          deltaTone="up"
        />
        <KPI
          icon={Users}
          label={t('hostel.kpis.boarders')}
          value={formatNumber(totalOccupied, lang)}
          footer="Active Resident Students"
          deltaTone="neutral"
        />
        <KPI
          icon={Clock}
          label={t('hostel.kpis.vacant')}
          value={formatNumber(vacantBeds, lang)}
          footer="Ready for Immediate Allotment"
          deltaTone="up"
        />
        <KPI
          icon={Building}
          label={t('hostel.kpis.occupancyRate')}
          value={`${occupancyRate}%`}
          footer="Hall Occupancy Ratio"
          deltaTone={occupancyRate >= 80 ? 'up' : 'neutral'}
        />
      </div>

      {/* Segmented Filter & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <Segmented
          value={activeTab}
          onChange={(v) => setActiveTab(v as 'rooms' | 'boarders' | 'gatepass')}
          options={[
            { value: 'rooms', label: t('hostel.tabs.rooms') },
            { value: 'boarders', label: t('hostel.tabs.boarders') },
            { value: 'gatepass', label: t('hostel.tabs.gatepass') },
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
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
            className="w-56"
          >
            <option value="all">All Buildings / Halls</option>
            <option value="Kazi Nazrul Islam Hall">Kazi Nazrul Islam Hall</option>
            <option value="Begum Rokeya Bhaban">Begum Rokeya Bhaban</option>
          </Select>
        </div>
      </div>

      {/* Tab 1: Rooms & Capacity */}
      {activeTab === 'rooms' && (
        <TableWrap>
          <Table>
            <THead>
              <TR>
                <TH>{t('hostel.table.roomNo')}</TH>
                <TH>{t('hostel.table.building')}</TH>
                <TH>{t('hostel.table.type')}</TH>
                <TH>{t('hostel.table.capacity')}</TH>
                <TH>{t('hostel.table.seatRent')}</TH>
                <TH>{t('hostel.table.status')}</TH>
                <TH className="text-right">{t('hostel.table.actions')}</TH>
              </TR>
            </THead>
            <TBody>
              {filteredRooms.map((rm) => {
                const vacant = Math.max(0, rm.capacity - rm.occupiedBeds)
                const isFull = vacant === 0
                return (
                  <TR key={rm.id}>
                    <TD className="font-mono text-sm font-bold text-slate-800">Room {rm.roomNo}</TD>
                    <TD>
                      <div className="font-medium text-slate-900">{rm.buildingName}</div>
                      <div className="text-xs text-slate-500">Floor {rm.floor}</div>
                    </TD>
                    <TD>
                      <div className="text-xs font-semibold text-slate-800">
                        {getRoomTypeLabel(rm.roomType, lang)}
                      </div>
                      <div className="mt-1">
                        <Badge tone={rm.gender === 'boys' ? 'info' : 'warning'}>
                          {rm.gender.toUpperCase()}
                        </Badge>
                      </div>
                    </TD>
                    <TD>
                      <div className="font-semibold text-slate-800">
                        {rm.occupiedBeds} / {rm.capacity} Beds
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {vacant > 0 ? `${vacant} Vacant` : 'Fully Occupied'}
                      </div>
                    </TD>
                    <TD className="font-medium text-slate-700">
                      {formatTaka(rm.monthlySeatRent, lang)} / mo
                    </TD>
                    <TD>
                      <Badge tone={isFull ? 'danger' : 'success'}>
                        {isFull ? 'Full' : `${vacant} Available`}
                      </Badge>
                    </TD>
                    <TD className="text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={isFull}
                        onClick={() => {
                          setSelectedBuilding(rm.buildingName)
                          setSelectedRoom(rm.roomNo)
                          setSeatRent(String(rm.monthlySeatRent))
                          setAllocateModalOpen(true)
                        }}
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        {t('hostel.actions.allocate')}
                      </Button>
                    </TD>
                  </TR>
                )
              })}
            </TBody>
          </Table>
        </TableWrap>
      )}

      {/* Tab 2: Boarders Roster */}
      {activeTab === 'boarders' && (
        <TableWrap>
          <Table>
            <THead>
              <TR>
                <TH>{t('hostel.table.student')}</TH>
                <TH>{t('hostel.table.class')}</TH>
                <TH>{t('hostel.table.building')}</TH>
                <TH>{t('hostel.table.bed')}</TH>
                <TH>{t('hostel.table.guardianPhone')}</TH>
                <TH>Fees (Rent + Mess)</TH>
                <TH>{t('hostel.table.status')}</TH>
                <TH className="text-right">{t('hostel.table.actions')}</TH>
              </TR>
            </THead>
            <TBody>
              {filteredBoarders.map((bdr) => (
                <TR key={bdr.id}>
                  <TD>
                    <div className="font-medium text-slate-900">
                      {lang === 'bn' ? bdr.studentNameBn : bdr.studentName}
                    </div>
                    <div className="font-mono text-xs text-slate-500">{bdr.studentId}</div>
                  </TD>
                  <TD className="text-sm text-slate-700">
                    {bdr.className} (Roll: {bdr.rollNo})
                  </TD>
                  <TD>
                    <div className="text-xs font-semibold text-slate-800">{bdr.buildingName}</div>
                    <div className="text-xs text-slate-500">Room {bdr.roomNo}</div>
                  </TD>
                  <TD className="font-mono text-xs font-bold text-indigo-700">{bdr.bedNo}</TD>
                  <TD className="text-xs text-slate-600">
                    <div>{bdr.guardianPhone}</div>
                    <div className="text-slate-400">{bdr.guardianName}</div>
                  </TD>
                  <TD>
                    <div className="font-semibold text-slate-800">
                      {formatTaka(bdr.monthlySeatRent + bdr.monthlyMessFee, lang)}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Rent: {bdr.monthlySeatRent} | Mess: {bdr.monthlyMessFee}
                    </div>
                  </TD>
                  <TD>
                    <Badge
                      tone={
                        bdr.paymentStatus === 'paid'
                          ? 'success'
                          : bdr.paymentStatus === 'due'
                            ? 'warning'
                            : 'danger'
                      }
                    >
                      {t(`hostel.status.${bdr.paymentStatus}`)}
                    </Badge>
                  </TD>
                  <TD className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      title={t('hostel.actions.vacate')}
                      onClick={() => handleVacate(bdr.id)}
                      className="text-rose-600 hover:text-rose-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableWrap>
      )}

      {/* Tab 3: Gate Pass & Curfew */}
      {activeTab === 'gatepass' && (
        <TableWrap>
          <Table>
            <THead>
              <TR>
                <TH>{t('hostel.table.passNo')}</TH>
                <TH>{t('hostel.table.student')}</TH>
                <TH>{t('hostel.table.destination')}</TH>
                <TH>{t('hostel.table.departure')}</TH>
                <TH>{t('hostel.table.expectedReturn')}</TH>
                <TH>{t('hostel.table.status')}</TH>
                <TH className="text-right">{t('hostel.table.actions')}</TH>
              </TR>
            </THead>
            <TBody>
              {filteredGatePasses.map((pass) => (
                <TR key={pass.id}>
                  <TD className="font-mono text-xs font-bold text-slate-800">{pass.passNo}</TD>
                  <TD>
                    <div className="font-medium text-slate-900">
                      {lang === 'bn' ? pass.studentNameBn : pass.studentName}
                    </div>
                    <div className="text-xs text-slate-500">
                      {pass.buildingName} · Room {pass.roomNo}
                    </div>
                  </TD>
                  <TD>
                    <div className="text-xs font-medium text-slate-800">{pass.destination}</div>
                    <div className="text-[11px] text-slate-500">{pass.reason}</div>
                  </TD>
                  <TD className="text-xs text-slate-600">
                    <div>{pass.departureDate}</div>
                    <div className="font-semibold text-slate-700">{pass.departureTime}</div>
                  </TD>
                  <TD className="text-xs text-slate-600">
                    <div>{pass.expectedReturnDate}</div>
                    <div className="font-semibold text-rose-700">{pass.expectedReturnTime}</div>
                  </TD>
                  <TD>
                    <Badge
                      tone={
                        pass.status === 'returned'
                          ? 'neutral'
                          : pass.status === 'active'
                            ? 'warning'
                            : 'info'
                      }
                    >
                      {t(`hostel.status.${pass.status}`)}
                    </Badge>
                  </TD>
                  <TD className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPassForPreview(pass)
                          setPreviewPassModalOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4 text-slate-600" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => downloadPassPdf(pass)}
                        title="Download Pass Slip"
                      >
                        <Download className="mr-1 h-3.5 w-3.5" />
                        PDF
                      </Button>
                      {pass.status !== 'returned' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleReturnPass(pass.id)}
                          className="text-emerald-700"
                        >
                          <Check className="mr-1 h-3.5 w-3.5" />
                          {t('hostel.actions.markReturned')}
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

      {/* Modal: Allocate Seat */}
      <Modal
        open={allocateModalOpen}
        onClose={() => setAllocateModalOpen(false)}
        title={t('hostel.modal.allocateTitle')}
      >
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('hostel.modal.studentName')}>
              <Input
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Tanvir Hasan"
              />
            </Field>
            <Field label={t('hostel.modal.studentNameBn')}>
              <Input
                value={studentNameBn}
                onChange={(e) => setStudentNameBn(e.target.value)}
                placeholder="উদা. তানভীর হাসান"
              />
            </Field>
            <Field label={t('hostel.modal.class')}>
              <Input
                value={className}
                onChange={(e) => setClassName(e.target.value)}
              />
            </Field>
            <Field label={t('hostel.modal.roll')}>
              <Input
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
              />
            </Field>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Field label={t('hostel.modal.building')}>
                <Select
                  value={selectedBuilding}
                  onChange={(e) => setSelectedBuilding(e.target.value)}
                >
                  <option value="Kazi Nazrul Islam Hall">Kazi Nazrul Islam Hall</option>
                  <option value="Begum Rokeya Bhaban">Begum Rokeya Bhaban</option>
                </Select>
              </Field>
              <Field label={t('hostel.modal.room')}>
                <Input
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                />
              </Field>
              <Field label={t('hostel.modal.bed')}>
                <Input
                  value={bedNo}
                  onChange={(e) => setBedNo(e.target.value)}
                />
              </Field>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('hostel.modal.guardianName')}>
              <Input
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
              />
            </Field>
            <Field label={t('hostel.modal.guardianPhone')}>
              <Input
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
              />
            </Field>
            <Field label={t('hostel.modal.seatRent')}>
              <Input
                type="number"
                value={seatRent}
                onChange={(e) => setSeatRent(e.target.value)}
              />
            </Field>
            <Field label={t('hostel.modal.messFee')}>
              <Input
                type="number"
                value={messFee}
                onChange={(e) => setMessFee(e.target.value)}
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="ghost" onClick={() => setAllocateModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleAllocate}
              disabled={allocateMutation.isPending}
            >
              {t('hostel.modal.confirmAllocate')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Issue Gate Pass */}
      <Modal
        open={gatePassModalOpen}
        onClose={() => setGatePassModalOpen(false)}
        title={t('hostel.modal.gatePassTitle')}
      >
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('hostel.modal.studentName')}>
              <Input
                value={passStudentName}
                onChange={(e) => setPassStudentName(e.target.value)}
                placeholder="Student Name"
              />
            </Field>
            <Field label={t('hostel.modal.guardianPhone')}>
              <Input
                value={passPhone}
                onChange={(e) => setPassPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
              />
            </Field>
            <Field label={t('hostel.modal.building')}>
              <Select
                value={passBuilding}
                onChange={(e) => setPassBuilding(e.target.value)}
              >
                <option value="Kazi Nazrul Islam Hall">Kazi Nazrul Islam Hall</option>
                <option value="Begum Rokeya Bhaban">Begum Rokeya Bhaban</option>
              </Select>
            </Field>
            <Field label={t('hostel.modal.room')}>
              <Input
                value={passRoom}
                onChange={(e) => setPassRoom(e.target.value)}
              />
            </Field>
          </div>

          <Field label={t('hostel.modal.destination')}>
            <Input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Home (Kushtia) / Hospital"
            />
          </Field>

          <Field label={t('hostel.modal.reason')}>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('hostel.modal.departureDate')}>
              <Input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
              />
            </Field>
            <Field label={t('hostel.modal.departureTime')}>
              <Input
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
              />
            </Field>
            <Field label={t('hostel.modal.expectedReturnDate')}>
              <Input
                type="date"
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
              />
            </Field>
            <Field label={t('hostel.modal.expectedReturnTime')}>
              <Input
                value={expectedReturnTime}
                onChange={(e) => setExpectedReturnTime(e.target.value)}
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="ghost" onClick={() => setGatePassModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleIssuePass}
              disabled={issuePassMutation.isPending}
            >
              {t('hostel.modal.confirmPass')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Preview Gate Pass */}
      <Modal
        open={previewPassModalOpen}
        onClose={() => setPreviewPassModalOpen(false)}
        title="Hostel Gate Pass Preview"
      >
        {selectedPassForPreview && (
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    {lang === 'bn' ? selectedPassForPreview.studentNameBn : selectedPassForPreview.studentName}
                  </h4>
                  <p className="font-mono text-xs text-indigo-600">{selectedPassForPreview.passNo}</p>
                </div>
                <Badge
                  tone={
                    selectedPassForPreview.status === 'returned'
                      ? 'neutral'
                      : selectedPassForPreview.status === 'active'
                        ? 'warning'
                        : 'info'
                  }
                >
                  {t(`hostel.status.${selectedPassForPreview.status}`)}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-200 pt-3 text-xs">
                <div><strong>Building:</strong> {selectedPassForPreview.buildingName}</div>
                <div><strong>Room:</strong> Room {selectedPassForPreview.roomNo}</div>
                <div><strong>Destination:</strong> {selectedPassForPreview.destination}</div>
                <div><strong>Guardian Phone:</strong> {selectedPassForPreview.guardianPhone}</div>
                <div><strong>Departure:</strong> {selectedPassForPreview.departureDate} at {selectedPassForPreview.departureTime}</div>
                <div><strong>Expected Return:</strong> {selectedPassForPreview.expectedReturnDate} at {selectedPassForPreview.expectedReturnTime}</div>
                <div><strong>Authorized By:</strong> {selectedPassForPreview.approvedBy}</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setPreviewPassModalOpen(false)}>
                {t('common.close')}
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  downloadPassPdf(selectedPassForPreview)
                  setPreviewPassModalOpen(false)
                }}
              >
                <Download className="mr-1.5 h-4 w-4" />
                {t('hostel.actions.downloadPass')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
