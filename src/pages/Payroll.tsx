import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Wallet,
  CheckCircle2,
  Clock,
  Users,
  Download,
  Edit3,
  Eye,
  CreditCard,
  Building2,
  Calendar,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { KPI } from '@/components/ui/KPI'
import { Segmented } from '@/components/ui/Segmented'
import { Modal } from '@/components/ui/Modal'
import { Toolbar, TableWrap, Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { Field, Input, Select, SearchInput } from '@/components/ui/form'
import { useToast } from '@/components/ui/Toast'
import { formatTaka, formatNumber } from '@/lib/utils'
import type { AppLanguage } from '@/i18n'
import type {
  StaffSalaryProfile,
  StaffPayslip,
  PaymentChannel,
} from '@/lib/payroll'
import {
  createPayslipPdf,
  createPayrollSummaryPdf,
} from '@/lib/payroll-pdf'
import {
  useStaffSalaryProfiles,
  useUpdateStaffSalaryProfile,
  useMonthlyPayroll,
  useGenerateMonthlyPayroll,
  useDisburseSalary,
  useBulkDisburse,
} from '@/data/payroll'

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const MONTH_NAMES_BN = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
]

export default function Payroll() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'en') as AppLanguage
  const toast = useToast()

  const [selectedMonth, setSelectedMonth] = useState<number>(9)
  const [selectedYear, setSelectedYear] = useState<number>(2026)
  const [activeTab, setActiveTab] = useState<'salarySheet' | 'disbursements' | 'profiles'>('salarySheet')
  const [searchQuery, setSearchQuery] = useState('')
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedSlipIds, setSelectedSlipIds] = useState<string[]>([])

  // Modals
  const [generateModalOpen, setGenerateModalOpen] = useState(false)
  const [bonusPercent, setBonusPercent] = useState('0')

  const [disburseModalOpen, setDisburseModalOpen] = useState(false)
  const [selectedSlipForDisburse, setSelectedSlipForDisburse] = useState<StaffPayslip | null>(null)
  const [disburseDate, setDisburseDate] = useState(new Date().toISOString().slice(0, 10))
  const [disburseReference, setDisburseReference] = useState('')

  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<StaffSalaryProfile | null>(null)
  const [editBasic, setEditBasic] = useState('0')
  const [editHouseRent, setEditHouseRent] = useState('0')
  const [editMedical, setEditMedical] = useState('0')
  const [editConveyance, setEditConveyance] = useState('0')
  const [editSpecial, setEditSpecial] = useState('0')
  const [editTax, setEditTax] = useState('0')
  const [editAdvance, setEditAdvance] = useState('0')
  const [editChannel, setEditChannel] = useState<PaymentChannel>('bank_transfer')
  const [editBankName, setEditBankName] = useState('')
  const [editBranchName, setEditBranchName] = useState('')
  const [editAccountNo, setEditAccountNo] = useState('')
  const [editRoutingNo, setEditRoutingNo] = useState('')
  const [editMfsNumber, setEditMfsNumber] = useState('')

  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [selectedSlipForPreview, setSelectedSlipForPreview] = useState<StaffPayslip | null>(null)

  // Queries & Mutations
  const profilesQuery = useStaffSalaryProfiles()
  const monthlyQuery = useMonthlyPayroll(selectedMonth, selectedYear)
  const generatePayroll = useGenerateMonthlyPayroll()
  const disburseSalary = useDisburseSalary()
  const bulkDisburse = useBulkDisburse()
  const updateProfile = useUpdateStaffSalaryProfile()

  const profiles = useMemo(() => profilesQuery.data ?? [], [profilesQuery.data])
  const payslips = useMemo(() => monthlyQuery.data ?? [], [monthlyQuery.data])

  // KPIs
  const totalGross = useMemo(() => payslips.reduce((sum, p) => sum + p.grossEarnings, 0), [payslips])
  const totalNet = useMemo(() => payslips.reduce((sum, p) => sum + p.netPayable, 0), [payslips])
  const totalDisbursed = useMemo(
    () => payslips.filter((p) => p.status === 'disbursed').reduce((sum, p) => sum + p.netPayable, 0),
    [payslips],
  )
  const totalPending = totalNet - totalDisbursed
  const totalStaff = profiles.length

  // Filtered Payslips
  const filteredPayslips = useMemo(() => {
    return payslips.filter((p) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        p.employeeName.toLowerCase().includes(q) ||
        p.employeeNameBn.includes(q) ||
        p.staffId.toLowerCase().includes(q) ||
        p.designation.toLowerCase().includes(q)

      const matchesChannel = channelFilter === 'all' || p.paymentChannel === channelFilter
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter

      return matchesSearch && matchesChannel && matchesStatus
    })
  }, [payslips, searchQuery, channelFilter, statusFilter])

  // Filtered Profiles
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const q = searchQuery.toLowerCase().trim()
      return (
        !q ||
        p.employeeName.toLowerCase().includes(q) ||
        p.employeeNameBn.includes(q) ||
        p.staffId.toLowerCase().includes(q) ||
        p.designation.toLowerCase().includes(q)
      )
    })
  }, [profiles, searchQuery])

  // Handlers
  async function handleGenerate() {
    try {
      await generatePayroll.mutateAsync({
        month: selectedMonth,
        year: selectedYear,
        festivalBonusPercent: Number(bonusPercent) || 0,
      })
      toast.success(t('payroll.messages.generated'))
      setGenerateModalOpen(false)
    } catch {
      toast.error(t('common.error'))
    }
  }

  function openDisburseModal(slip: StaffPayslip) {
    setSelectedSlipForDisburse(slip)
    setDisburseDate(new Date().toISOString().slice(0, 10))
    setDisburseReference(slip.paymentReference || `TXN-${Math.floor(100000 + Math.random() * 900000)}`)
    setDisburseModalOpen(true)
  }

  async function handleConfirmDisburse() {
    if (!selectedSlipForDisburse) return
    try {
      await disburseSalary.mutateAsync({
        payslipId: selectedSlipForDisburse.id,
        disbursementDate: disburseDate,
        paymentReference: disburseReference.trim() || undefined,
      })
      toast.success(t('payroll.messages.disbursed'))
      setDisburseModalOpen(false)
    } catch {
      toast.error(t('common.error'))
    }
  }

  async function handleBulkDisburseAction() {
    if (selectedSlipIds.length === 0) return
    try {
      await bulkDisburse.mutateAsync({
        payslipIds: selectedSlipIds,
        disbursementDate: new Date().toISOString().slice(0, 10),
      })
      toast.success(t('payroll.messages.bulkDisbursed'))
      setSelectedSlipIds([])
    } catch {
      toast.error(t('common.error'))
    }
  }

  function openEditProfileModal(profile: StaffSalaryProfile) {
    setSelectedProfile(profile)
    setEditBasic(String(profile.earnings.basicPay))
    setEditHouseRent(String(profile.earnings.houseRent))
    setEditMedical(String(profile.earnings.medicalAllowance))
    setEditConveyance(String(profile.earnings.conveyanceAllowance))
    setEditSpecial(String(profile.earnings.specialAllowance))
    setEditTax(String(profile.fixedDeductions.incomeTax))
    setEditAdvance(String(profile.fixedDeductions.advanceSalaryDeduction))
    setEditChannel(profile.preferredPaymentChannel)
    setEditBankName(profile.bankDetails?.bankName || '')
    setEditBranchName(profile.bankDetails?.branchName || '')
    setEditAccountNo(profile.bankDetails?.accountNo || '')
    setEditRoutingNo(profile.bankDetails?.routingNo || '')
    setEditMfsNumber(profile.mfsNumber || '')
    setEditProfileModalOpen(true)
  }

  async function handleSaveProfile() {
    if (!selectedProfile) return
    try {
      await updateProfile.mutateAsync({
        staffId: selectedProfile.staffId,
        earnings: {
          basicPay: Number(editBasic) || 0,
          houseRent: Number(editHouseRent) || 0,
          medicalAllowance: Number(editMedical) || 0,
          conveyanceAllowance: Number(editConveyance) || 0,
          specialAllowance: Number(editSpecial) || 0,
        },
        fixedDeductions: {
          incomeTax: Number(editTax) || 0,
          advanceSalaryDeduction: Number(editAdvance) || 0,
        },
        preferredPaymentChannel: editChannel,
        bankDetails:
          editChannel === 'bank_transfer'
            ? {
                bankName: editBankName.trim() || 'Sonali Bank PLC',
                branchName: editBranchName.trim() || 'Principal Branch',
                accountNo: editAccountNo.trim(),
                routingNo: editRoutingNo.trim(),
              }
            : null,
        mfsNumber: editChannel === 'bkash' || editChannel === 'nagad' ? editMfsNumber.trim() : null,
      })
      toast.success(t('payroll.messages.profileUpdated'))
      setEditProfileModalOpen(false)
    } catch {
      toast.error(t('common.error'))
    }
  }

  function downloadPayslipPdf(slip: StaffPayslip) {
    const bytes = createPayslipPdf(slip, {
      schoolName: t('app.school'),
      eiin: '108234',
      address: 'Dhaka, Bangladesh',
      phone: '+880 1711-000000',
    })
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `payslip-${slip.staffId}-${slip.year}-${String(slip.month).padStart(2, '0')}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }

  function downloadSummaryPdf() {
    const bytes = createPayrollSummaryPdf(payslips, selectedMonth, selectedYear, {
      schoolName: t('app.school'),
      eiin: '108234',
      address: 'Dhaka, Bangladesh',
    })
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `payroll-statement-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }

  function toggleSlipSelection(id: string) {
    setSelectedSlipIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  function toggleSelectAll() {
    const pendingSlips = filteredPayslips.filter((p) => p.status !== 'disbursed').map((p) => p.id)
    if (selectedSlipIds.length === pendingSlips.length) {
      setSelectedSlipIds([])
    } else {
      setSelectedSlipIds(pendingSlips)
    }
  }

  const currentMonthName =
    lang === 'bn' ? MONTH_NAMES_BN[selectedMonth - 1] : MONTH_NAMES_EN[selectedMonth - 1]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('payroll.title')}
        sub={`${t('payroll.subtitle')} · ${currentMonthName} ${selectedYear}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={downloadSummaryPdf}
              disabled={payslips.length === 0}
            >
              <Download className="mr-1.5 h-4 w-4" />
              {t('payroll.actions.downloadBankSheet')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setGenerateModalOpen(true)}
            >
              <Calendar className="mr-1.5 h-4 w-4" />
              {t('payroll.actions.generatePayroll')}
            </Button>
          </div>
        }
      />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI
          icon={Wallet}
          label={t('payroll.kpis.totalExpense')}
          value={formatTaka(totalGross, lang)}
          footer={`Net: ${formatTaka(totalNet, lang)}`}
          deltaTone="neutral"
        />
        <KPI
          icon={CheckCircle2}
          label={t('payroll.kpis.disbursed')}
          value={formatTaka(totalDisbursed, lang)}
          delta={`${Math.round(totalNet > 0 ? (totalDisbursed / totalNet) * 100 : 0)}%`}
          deltaTone="up"
        />
        <KPI
          icon={Clock}
          label={t('payroll.kpis.pending')}
          value={formatTaka(totalPending, lang)}
          footer={`${payslips.filter((p) => p.status !== 'disbursed').length} pending`}
          deltaTone="neutral"
        />
        <KPI
          icon={Users}
          label={t('payroll.kpis.totalStaff')}
          value={formatNumber(totalStaff, lang)}
          footer="MPO & Institutional"
          deltaTone="up"
        />
      </div>

      {/* Month & Year Selection Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">{t('payroll.modal.selectMonth')}:</span>
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none"
          >
            {(lang === 'bn' ? MONTH_NAMES_BN : MONTH_NAMES_EN).map((name, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        </div>

        {/* Tab Segmented */}
        <Segmented
          value={activeTab}
          onChange={(v) => setActiveTab(v as 'salarySheet' | 'disbursements' | 'profiles')}
          options={[
            { value: 'salarySheet', label: t('payroll.tabs.salarySheet') },
            { value: 'disbursements', label: t('payroll.tabs.disbursements') },
            { value: 'profiles', label: t('payroll.tabs.profiles') },
          ]}
        />
      </div>

      {/* Tab 1: Salary Sheet */}
      {activeTab === 'salarySheet' && (
        <div className="space-y-4">
          <Toolbar>
            <div className="flex flex-1 flex-wrap items-center gap-3">
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
                <option value="draft">{t('payroll.status.draft')}</option>
                <option value="approved">{t('payroll.status.approved')}</option>
                <option value="disbursed">{t('payroll.status.disbursed')}</option>
              </Select>
            </div>
          </Toolbar>

          {filteredPayslips.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <Wallet className="h-12 w-12 text-slate-300" />
              <h3 className="mt-3 text-base font-medium text-slate-800">{t('payroll.empty.title')}</h3>
              <p className="mt-1 text-sm text-slate-500">{t('payroll.empty.desc')}</p>
              <Button
                variant="primary"
                size="sm"
                className="mt-4"
                onClick={() => setGenerateModalOpen(true)}
              >
                {t('payroll.actions.generatePayroll')}
              </Button>
            </div>
          ) : (
            <TableWrap>
              <Table>
                <THead>
                  <TR>
                    <TH>{t('payroll.table.staffId')}</TH>
                    <TH>{t('payroll.table.employee')}</TH>
                    <TH>{t('payroll.table.designation')}</TH>
                    <TH>{t('payroll.table.gross')}</TH>
                    <TH>{t('payroll.table.deductions')}</TH>
                    <TH>{t('payroll.table.netPay')}</TH>
                    <TH>{t('payroll.table.paymentChannel')}</TH>
                    <TH>{t('payroll.table.status')}</TH>
                    <TH className="text-right">{t('payroll.table.actions')}</TH>
                  </TR>
                </THead>
                <TBody>
                  {filteredPayslips.map((slip) => (
                    <TR key={slip.id}>
                      <TD className="font-mono text-xs font-semibold text-slate-600">{slip.staffId}</TD>
                      <TD>
                        <div className="font-medium text-slate-900">
                          {lang === 'bn' ? slip.employeeNameBn : slip.employeeName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {lang === 'bn' ? slip.departmentBn : slip.department}
                        </div>
                      </TD>
                      <TD>
                        <div className="text-sm text-slate-700">
                          {lang === 'bn' ? slip.designationBn : slip.designation}
                        </div>
                        <Badge
                          tone={slip.employmentType === 'mpo' ? 'info' : 'neutral'}
                        >
                          {slip.employmentType.toUpperCase()}
                          {slip.mpoIndexNo ? ` · ${slip.mpoIndexNo}` : ''}
                        </Badge>
                      </TD>
                      <TD className="font-medium text-slate-800">
                        {formatTaka(slip.grossEarnings, lang)}
                      </TD>
                      <TD className="font-medium text-rose-600">
                        -{formatTaka(slip.totalDeductions, lang)}
                      </TD>
                      <TD className="font-bold text-emerald-700">
                        {formatTaka(slip.netPayable, lang)}
                      </TD>
                      <TD>
                        <div className="text-xs font-medium text-slate-700">
                          {t(`payroll.channels.${slip.paymentChannel}`)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {slip.paymentChannel === 'bank_transfer' && slip.bankDetails
                            ? `${slip.bankDetails.bankName.slice(0, 14)} (${slip.bankDetails.accountNo.slice(-4)})`
                            : slip.mfsNumber || '—'}
                        </div>
                      </TD>
                      <TD>
                        <Badge
                          tone={
                            slip.status === 'disbursed'
                              ? 'success'
                              : slip.status === 'approved'
                                ? 'info'
                                : 'neutral'
                          }
                        >
                          {t(`payroll.status.${slip.status}`)}
                        </Badge>
                      </TD>
                      <TD className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            title={t('payroll.actions.previewPayslip')}
                            onClick={() => {
                              setSelectedSlipForPreview(slip)
                              setPreviewModalOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4 text-slate-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title={t('payroll.actions.downloadPayslip')}
                            onClick={() => downloadPayslipPdf(slip)}
                          >
                            <Download className="h-4 w-4 text-indigo-600" />
                          </Button>
                          {slip.status !== 'disbursed' ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="text-emerald-700 hover:border-emerald-600 hover:bg-emerald-50"
                              onClick={() => openDisburseModal(slip)}
                            >
                              <CreditCard className="mr-1 h-3.5 w-3.5" />
                              {t('payroll.actions.disburse')}
                            </Button>
                          ) : (
                            <span className="inline-flex items-center text-xs text-emerald-600">
                              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                              {slip.disbursementDate?.slice(5)}
                            </span>
                          )}
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </TableWrap>
          )}
        </div>
      )}

      {/* Tab 2: Disbursement Ledger */}
      {activeTab === 'disbursements' && (
        <div className="space-y-4">
          <Toolbar>
            <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <Select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value)}
                  className="w-48"
                >
                  <option value="all">{t('payroll.filter.allChannels')}</option>
                  <option value="bank_transfer">{t('payroll.channels.bank_transfer')}</option>
                  <option value="bkash">{t('payroll.channels.bkash')}</option>
                  <option value="nagad">{t('payroll.channels.nagad')}</option>
                  <option value="cash">{t('payroll.channels.cash')}</option>
                </Select>
                <Button variant="secondary" size="sm" onClick={toggleSelectAll}>
                  {selectedSlipIds.length === 0 ? 'Select All Pending' : 'Deselect All'}
                </Button>
              </div>

              {selectedSlipIds.length > 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleBulkDisburseAction}
                >
                  <CreditCard className="mr-1.5 h-4 w-4" />
                  {t('payroll.actions.bulkDisburse')} ({selectedSlipIds.length})
                </Button>
              )}
            </div>
          </Toolbar>

          <TableWrap>
            <Table>
              <THead>
                <TR>
                  <TH className="w-10"></TH>
                  <TH>{t('payroll.table.staffId')}</TH>
                  <TH>{t('payroll.table.employee')}</TH>
                  <TH>{t('payroll.table.paymentChannel')}</TH>
                  <TH>{t('payroll.table.netPay')}</TH>
                  <TH>{t('payroll.table.status')}</TH>
                  <TH>Disbursement Date & Ref</TH>
                  <TH className="text-right">{t('payroll.table.actions')}</TH>
                </TR>
              </THead>
              <TBody>
                {filteredPayslips.map((slip) => {
                  const isChecked = selectedSlipIds.includes(slip.id)
                  return (
                    <TR key={slip.id} className={isChecked ? 'bg-indigo-50/40' : undefined}>
                      <TD>
                        {slip.status !== 'disbursed' && (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSlipSelection(slip.id)}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        )}
                      </TD>
                      <TD className="font-mono text-xs font-semibold text-slate-600">{slip.staffId}</TD>
                      <TD>
                        <div className="font-medium text-slate-900">
                          {lang === 'bn' ? slip.employeeNameBn : slip.employeeName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {lang === 'bn' ? slip.designationBn : slip.designation}
                        </div>
                      </TD>
                      <TD>
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          {slip.paymentChannel === 'bank_transfer' ? (
                            <Building2 className="h-4 w-4 text-sky-600" />
                          ) : slip.paymentChannel === 'cash' ? (
                            <Wallet className="h-4 w-4 text-amber-600" />
                          ) : (
                            <CreditCard className="h-4 w-4 text-pink-600" />
                          )}
                          <span>{t(`payroll.channels.${slip.paymentChannel}`)}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {slip.paymentChannel === 'bank_transfer' && slip.bankDetails
                            ? `${slip.bankDetails.bankName} - ${slip.bankDetails.accountNo}`
                            : slip.mfsNumber || 'Cash Payment'}
                        </div>
                      </TD>
                      <TD className="font-bold text-slate-900">
                        {formatTaka(slip.netPayable, lang)}
                      </TD>
                      <TD>
                        <Badge
                          tone={
                            slip.status === 'disbursed'
                              ? 'success'
                              : slip.status === 'approved'
                                ? 'info'
                                : 'neutral'
                          }
                        >
                          {t(`payroll.status.${slip.status}`)}
                        </Badge>
                      </TD>
                      <TD>
                        {slip.status === 'disbursed' ? (
                          <div className="text-xs">
                            <span className="font-medium text-slate-700">{slip.disbursementDate}</span>
                            {slip.paymentReference && (
                              <span className="ml-1.5 font-mono text-slate-500">
                                ({slip.paymentReference})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Pending Execution</span>
                        )}
                      </TD>
                      <TD className="text-right">
                        {slip.status !== 'disbursed' ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openDisburseModal(slip)}
                          >
                            {t('payroll.actions.disburse')}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadPayslipPdf(slip)}
                          >
                            <Download className="h-4 w-4 text-slate-600" />
                          </Button>
                        )}
                      </TD>
                    </TR>
                  )
                })}
              </TBody>
            </Table>
          </TableWrap>
        </div>
      )}

      {/* Tab 3: Staff Salary Profiles */}
      {activeTab === 'profiles' && (
        <div className="space-y-4">
          <Toolbar>
            <div className="w-72">
              <SearchInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('common.search')}
              />
            </div>
          </Toolbar>

          <TableWrap>
            <Table>
              <THead>
                <TR>
                  <TH>{t('payroll.table.staffId')}</TH>
                  <TH>{t('payroll.table.employee')}</TH>
                  <TH>{t('payroll.table.designation')}</TH>
                  <TH>{t('payroll.earnings.basic')}</TH>
                  <TH>Allowances</TH>
                  <TH>{t('payroll.deductions.pf')}</TH>
                  <TH>Pay Channel / Bank Details</TH>
                  <TH className="text-right">{t('payroll.table.actions')}</TH>
                </TR>
              </THead>
              <TBody>
                {filteredProfiles.map((p) => {
                  const totalAllowances =
                    p.earnings.houseRent +
                    p.earnings.medicalAllowance +
                    p.earnings.conveyanceAllowance +
                    p.earnings.specialAllowance

                  return (
                    <TR key={p.staffId}>
                      <TD className="font-mono text-xs font-semibold text-slate-600">{p.staffId}</TD>
                      <TD>
                        <div className="font-medium text-slate-900">
                          {lang === 'bn' ? p.employeeNameBn : p.employeeName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {lang === 'bn' ? p.departmentBn : p.department}
                        </div>
                      </TD>
                      <TD>
                        <div className="text-sm text-slate-700">
                          {lang === 'bn' ? p.designationBn : p.designation}
                        </div>
                        <Badge
                          tone={p.employmentType === 'mpo' ? 'info' : 'neutral'}
                        >
                          {p.employmentType.toUpperCase()}
                          {p.mpoIndexNo ? ` · ${p.mpoIndexNo}` : ''}
                        </Badge>
                      </TD>
                      <TD className="font-semibold text-slate-800">
                        {formatTaka(p.earnings.basicPay, lang)}
                      </TD>
                      <TD className="text-sm text-slate-600">
                        {formatTaka(totalAllowances, lang)}
                        <div className="text-[11px] text-slate-400">
                          HR: {p.earnings.houseRent} | Med: {p.earnings.medicalAllowance}
                        </div>
                      </TD>
                      <TD className="text-sm text-slate-600">
                        {p.employmentType === 'mpo' ? '10% (GPF)' : '10% (Inst.)'}
                      </TD>
                      <TD>
                        <div className="text-xs font-medium text-slate-800">
                          {t(`payroll.channels.${p.preferredPaymentChannel}`)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {p.bankDetails
                            ? `${p.bankDetails.bankName} (${p.bankDetails.accountNo.slice(-4)})`
                            : p.mfsNumber || 'Cash'}
                        </div>
                      </TD>
                      <TD className="text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openEditProfileModal(p)}
                        >
                          <Edit3 className="mr-1 h-3.5 w-3.5" />
                          {t('payroll.actions.editProfile')}
                        </Button>
                      </TD>
                    </TR>
                  )
                })}
              </TBody>
            </Table>
          </TableWrap>
        </div>
      )}

      {/* Modal: Generate Monthly Payroll */}
      <Modal
        open={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        title={t('payroll.modal.generateTitle')}
      >
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('payroll.modal.selectMonth')}>
              <Select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {(lang === 'bn' ? MONTH_NAMES_BN : MONTH_NAMES_EN).map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('payroll.modal.selectYear')}>
              <Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </Select>
            </Field>
          </div>

          <Field label={t('payroll.modal.festivalBonusPercent')}>
            <Select
              value={bonusPercent}
              onChange={(e) => setBonusPercent(e.target.value)}
            >
              <option value="0">{t('payroll.modal.none')}</option>
              <option value="25">{t('payroll.modal.eidTeachers')}</option>
              <option value="50">{t('payroll.modal.eidStaff')}</option>
              <option value="100">{t('payroll.modal.fullBonus')}</option>
            </Select>
          </Field>

          <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            {t('payroll.subtitle')}
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="ghost" onClick={() => setGenerateModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleGenerate}
              disabled={generatePayroll.isPending}
            >
              {t('payroll.modal.generateBtn')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Disburse Salary */}
      <Modal
        open={disburseModalOpen}
        onClose={() => setDisburseModalOpen(false)}
        title={t('payroll.modal.disburseTitle')}
      >
        {selectedSlipForDisburse && (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-sm font-semibold text-slate-800">
                {selectedSlipForDisburse.employeeName} ({selectedSlipForDisburse.staffId})
              </div>
              <div className="text-xs text-slate-500">
                {selectedSlipForDisburse.designation} · {selectedSlipForDisburse.department}
              </div>
              <div className="mt-2 text-base font-bold text-emerald-700">
                Net Payable: {formatTaka(selectedSlipForDisburse.netPayable, lang)}
              </div>
            </div>

            <Field label={t('payroll.modal.disbursementDate')}>
              <Input
                type="date"
                value={disburseDate}
                onChange={(e) => setDisburseDate(e.target.value)}
              />
            </Field>

            <Field label={t('payroll.modal.reference')}>
              <Input
                value={disburseReference}
                onChange={(e) => setDisburseReference(e.target.value)}
                placeholder="BEFTN / Check No / bKash Txn ID"
              />
            </Field>

            <div className="flex justify-end gap-2 pt-3">
              <Button variant="ghost" onClick={() => setDisburseModalOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmDisburse}
                disabled={disburseSalary.isPending}
              >
                {t('payroll.modal.confirmDisburse')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Edit Staff Salary Profile */}
      <Modal
        open={editProfileModalOpen}
        onClose={() => setEditProfileModalOpen(false)}
        title={t('payroll.modal.editProfileTitle')}
      >
        {selectedProfile && (
          <div className="max-h-[70vh] space-y-4 overflow-y-auto py-2 pr-1">
            <div className="rounded-lg bg-slate-50 p-3 text-sm font-medium text-slate-800">
              {selectedProfile.employeeName} ({selectedProfile.staffId}) - {selectedProfile.designation}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t('payroll.earnings.basic')}>
                <Input
                  type="number"
                  value={editBasic}
                  onChange={(e) => setEditBasic(e.target.value)}
                />
              </Field>
              <Field label={t('payroll.earnings.houseRent')}>
                <Input
                  type="number"
                  value={editHouseRent}
                  onChange={(e) => setEditHouseRent(e.target.value)}
                />
              </Field>
              <Field label={t('payroll.earnings.medical')}>
                <Input
                  type="number"
                  value={editMedical}
                  onChange={(e) => setEditMedical(e.target.value)}
                />
              </Field>
              <Field label={t('payroll.earnings.conveyance')}>
                <Input
                  type="number"
                  value={editConveyance}
                  onChange={(e) => setEditConveyance(e.target.value)}
                />
              </Field>
              <Field label={t('payroll.earnings.special')}>
                <Input
                  type="number"
                  value={editSpecial}
                  onChange={(e) => setEditSpecial(e.target.value)}
                />
              </Field>
              <Field label={t('payroll.deductions.tax')}>
                <Input
                  type="number"
                  value={editTax}
                  onChange={(e) => setEditTax(e.target.value)}
                />
              </Field>
              <Field label={t('payroll.deductions.advance')}>
                <Input
                  type="number"
                  value={editAdvance}
                  onChange={(e) => setEditAdvance(e.target.value)}
                />
              </Field>
              <Field label={t('payroll.table.paymentChannel')}>
                <Select
                  value={editChannel}
                  onChange={(e) => setEditChannel(e.target.value as PaymentChannel)}
                >
                  <option value="bank_transfer">{t('payroll.channels.bank_transfer')}</option>
                  <option value="bkash">{t('payroll.channels.bkash')}</option>
                  <option value="nagad">{t('payroll.channels.nagad')}</option>
                  <option value="cash">{t('payroll.channels.cash')}</option>
                </Select>
              </Field>
            </div>

            {editChannel === 'bank_transfer' && (
              <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3">
                <div className="text-xs font-semibold uppercase text-slate-500">Bank Details</div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Bank Name">
                    <Input
                      value={editBankName}
                      onChange={(e) => setEditBankName(e.target.value)}
                    />
                  </Field>
                  <Field label="Branch Name">
                    <Input
                      value={editBranchName}
                      onChange={(e) => setEditBranchName(e.target.value)}
                    />
                  </Field>
                  <Field label="Account Number">
                    <Input
                      value={editAccountNo}
                      onChange={(e) => setEditAccountNo(e.target.value)}
                    />
                  </Field>
                  <Field label="Routing Number">
                    <Input
                      value={editRoutingNo}
                      onChange={(e) => setEditRoutingNo(e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            )}

            {(editChannel === 'bkash' || editChannel === 'nagad') && (
              <Field label="MFS Mobile Number">
                <Input
                  value={editMfsNumber}
                  onChange={(e) => setEditMfsNumber(e.target.value)}
                  placeholder="017XXXXXXXX"
                />
              </Field>
            )}

            <div className="flex justify-end gap-2 pt-3">
              <Button variant="ghost" onClick={() => setEditProfileModalOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveProfile}
                disabled={updateProfile.isPending}
              >
                {t('payroll.modal.saveStructure')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Interactive Payslip Preview */}
      <Modal
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title={t('payroll.modal.payslipPreviewTitle')}
      >
        {selectedSlipForPreview && (
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    {lang === 'bn' ? selectedSlipForPreview.employeeNameBn : selectedSlipForPreview.employeeName}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {selectedSlipForPreview.designation} · {selectedSlipForPreview.staffId}
                  </p>
                </div>
                <Badge
                  tone={selectedSlipForPreview.status === 'disbursed' ? 'success' : 'info'}
                >
                  {t(`payroll.status.${selectedSlipForPreview.status}`)}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-200 pt-3 text-xs">
                <div>
                  <div className="font-semibold text-emerald-800">EARNINGS</div>
                  <div className="mt-1 space-y-0.5 text-slate-600">
                    <div>Basic: {formatTaka(selectedSlipForPreview.earnings.basicPay, lang)}</div>
                    <div>House Rent: {formatTaka(selectedSlipForPreview.earnings.houseRent, lang)}</div>
                    <div>Medical: {formatTaka(selectedSlipForPreview.earnings.medicalAllowance, lang)}</div>
                    <div>Conveyance: {formatTaka(selectedSlipForPreview.earnings.conveyanceAllowance, lang)}</div>
                    <div>Bonus: {formatTaka(selectedSlipForPreview.earnings.festivalBonus, lang)}</div>
                  </div>
                  <div className="mt-2 font-bold text-slate-900">
                    Gross: {formatTaka(selectedSlipForPreview.grossEarnings, lang)}
                  </div>
                </div>

                <div>
                  <div className="font-semibold text-rose-800">DEDUCTIONS</div>
                  <div className="mt-1 space-y-0.5 text-slate-600">
                    <div>GPF: {formatTaka(selectedSlipForPreview.deductions.providentFund, lang)}</div>
                    <div>Welfare: {formatTaka(selectedSlipForPreview.deductions.welfareTrust, lang)}</div>
                    <div>Retirement: {formatTaka(selectedSlipForPreview.deductions.retirementFund, lang)}</div>
                    <div>Tax: {formatTaka(selectedSlipForPreview.deductions.incomeTax, lang)}</div>
                    <div>Leave/Absence: {formatTaka(selectedSlipForPreview.deductions.unpaidLeaveDeduction, lang)}</div>
                  </div>
                  <div className="mt-2 font-bold text-rose-700">
                    Total: -{formatTaka(selectedSlipForPreview.totalDeductions, lang)}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-center">
                <span className="text-xs font-medium text-emerald-800">NET TAKE-HOME PAYABLE: </span>
                <span className="text-base font-extrabold text-emerald-900">
                  {formatTaka(selectedSlipForPreview.netPayable, lang)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setPreviewModalOpen(false)}>
                {t('common.close')}
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  downloadPayslipPdf(selectedSlipForPreview)
                  setPreviewModalOpen(false)
                }}
              >
                <Download className="mr-1.5 h-4 w-4" />
                {t('payroll.actions.downloadPayslip')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
