import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Download,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Printer,
  ShieldCheck,
  User,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/form'
import {
  type StudentIdCardData,
  BLOOD_GROUPS,
  formatBloodGroup,
  generateQrPattern,
  generateStudentId,
  generateBarcodeBars,
} from '@/lib/student-id-card'
import {
  createSingleStudentIdCardPdf,
  createBatchStudentIdCardsPdf,
} from '@/lib/student-id-card-pdf'
import { formatNumber } from '@/lib/utils'
import type { AppLanguage } from '@/i18n'

interface StudentIdCardModalProps {
  open: boolean
  onClose: () => void
  students: StudentIdCardData[]
  schoolName?: string
  eiin?: string
  academicYear?: string
}

export function StudentIdCardModal({
  open,
  onClose,
  students,
  schoolName = 'EduOS Model School',
  eiin = '108234',
  academicYear = '2026',
}: StudentIdCardModalProps) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'en') as AppLanguage

  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [batchSide, setBatchSide] = useState<'front' | 'back'>('front')

  // Editable overrides per session
  const [session, setSession] = useState(academicYear)
  const [validUntil, setValidUntil] = useState('31-12-2026')
  const [customBloodGroups, setCustomBloodGroups] = useState<Record<string, string>>({})
  const [customEmergencyPhones, setCustomEmergencyPhones] = useState<Record<string, string>>({})

  // Safeguard index
  const safeIndex = Math.min(Math.max(0, currentIndex), Math.max(0, students.length - 1))
  const rawStudent = students[safeIndex]

  // Enriched active student
  const activeStudent: StudentIdCardData | undefined = useMemo(() => {
    if (!rawStudent) return undefined
    return {
      ...rawStudent,
      schoolName: rawStudent.schoolName || schoolName,
      eiin: rawStudent.eiin || eiin,
      academicYear: session,
      validUntil: validUntil,
      studentId:
        rawStudent.studentId ||
        generateStudentId(rawStudent.rollNo, session, rawStudent.id),
      bloodGroup: customBloodGroups[rawStudent.id] ?? rawStudent.bloodGroup ?? 'O+',
      guardianPhone:
        customEmergencyPhones[rawStudent.id] ??
        rawStudent.guardianPhone ??
        '+880 1700-000000',
    }
  }, [
    rawStudent,
    schoolName,
    eiin,
    session,
    validUntil,
    customBloodGroups,
    customEmergencyPhones,
  ])

  // QR Pattern for active student
  const qrMatrix = useMemo(() => {
    if (!activeStudent) return []
    const url =
      activeStudent.verificationUrl ||
      `https://eduos.app/verify/${activeStudent.id}`
    return generateQrPattern(url)
  }, [activeStudent])

  // Barcode bars for active student
  const barcodeBars = useMemo(() => {
    if (!activeStudent) return []
    return generateBarcodeBars(activeStudent.studentId)
  }, [activeStudent])

  if (!open || !activeStudent) return null

  // All enriched students for batch PDF export
  const allEnrichedStudents: StudentIdCardData[] = students.map((s) => ({
    ...s,
    schoolName: s.schoolName || schoolName,
    eiin: s.eiin || eiin,
    academicYear: session,
    validUntil: validUntil,
    studentId: s.studentId || generateStudentId(s.rollNo, session, s.id),
    bloodGroup: customBloodGroups[s.id] ?? s.bloodGroup ?? 'O+',
    guardianPhone:
      customEmergencyPhones[s.id] ?? s.guardianPhone ?? '+880 1700-000000',
  }))

  function downloadSinglePdf() {
    if (!activeStudent) return
    const bytes = createSingleStudentIdCardPdf(activeStudent)
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `student-id-${activeStudent.studentName.toLowerCase().replace(/\s+/g, '-')}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }

  function downloadBatchPdf() {
    const bytes = createBatchStudentIdCardsPdf(allEnrichedStudents, {
      schoolName,
      eiin,
      academicYear: session,
      side: batchSide,
    })
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `batch-id-cards-${batchSide}-${allEnrichedStudents.length}-students.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        students.length > 1
          ? t('students.idCard.batchTitle', {
              count: formatNumber(students.length, lang),
            })
          : t('students.idCard.title')
      }
      sub={t('students.idCard.sub')}
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={<RotateCw size={14} />}
              onClick={() => setFlipped(!flipped)}
            >
              {flipped ? t('students.idCard.viewFront') : t('students.idCard.viewBack')}
            </Button>
            {students.length > 1 && (
              <div className="flex items-center gap-1.5 text-xs text-fg-3">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  aria-label="Previous student"
                >
                  <ChevronLeft size={16} />
                </Button>
                <span>
                  {formatNumber(safeIndex + 1, lang)} / {formatNumber(students.length, lang)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentIndex === students.length - 1}
                  onClick={() =>
                    setCurrentIndex((prev) => Math.min(students.length - 1, prev + 1))
                  }
                  aria-label="Next student"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={<Download size={14} />}
              onClick={downloadSinglePdf}
            >
              {t('students.idCard.downloadSingle')}
            </Button>
            {students.length > 1 && (
              <Button
                variant="primary"
                icon={<Printer size={14} />}
                onClick={downloadBatchPdf}
              >
                {t('students.idCard.downloadBatch', {
                  count: formatNumber(students.length, lang),
                })}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        {/* Realistic CR80 ID Card Visual Preview */}
        <div className="flex flex-col items-center justify-center">
          <div
            className="group relative w-full max-w-[360px] cursor-pointer select-none transition-all duration-300 hover:shadow-xl"
            onClick={() => setFlipped(!flipped)}
            title={t('students.idCard.clickToFlip')}
          >
            {/* Front of Card */}
            {!flipped ? (
              <div
                data-testid="id-card-front"
                className="relative flex aspect-[1.586/1] w-full flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-md"
              >
                {/* Header Navy Banner */}
                <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800 px-3.5 py-2 text-white">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-bold tracking-wide uppercase">
                      {activeStudent.schoolName}
                    </div>
                    <span className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                      EIIN: {activeStudent.eiin}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between text-[9px] text-blue-100">
                    <span>{t('students.idCard.headerBadge')}</span>
                    <span>{t('students.idCard.session')}: {activeStudent.academicYear}</span>
                  </div>
                </div>

                {/* Body Details */}
                <div className="flex flex-1 items-center gap-3 p-3">
                  {/* Photo Frame */}
                  <div className="flex h-[82px] w-[68px] shrink-0 flex-col items-center justify-center overflow-hidden rounded-md border-2 border-slate-200 bg-slate-100 shadow-inner">
                    {activeStudent.avatarUrl ? (
                      <img
                        src={activeStudent.avatarUrl}
                        alt={activeStudent.studentName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-slate-400">
                        <User size={28} />
                        <span className="text-[8px] font-semibold tracking-wider">PHOTO</span>
                      </div>
                    )}
                  </div>

                  {/* Student Details */}
                  <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <h3 className="truncate text-sm font-bold text-slate-900">
                      {activeStudent.studentName}
                    </h3>
                    <div className="mt-0.5 inline-block text-[11px] font-mono font-semibold text-indigo-700">
                      {activeStudent.studentId}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
                      <span>{t('students.table.class')}: <strong>{activeStudent.className || '—'}</strong></span>
                      <span>·</span>
                      <span>{t('students.table.roll')}: <strong>{activeStudent.rollNo || '—'}</strong></span>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                        {t('students.idCard.bloodGroup')}: {formatBloodGroup(activeStudent.bloodGroup)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-3 py-1 text-[9px] text-slate-500">
                  <span>{t('students.idCard.validUntil')}: {activeStudent.validUntil}</span>
                  <div className="flex items-center gap-1">
                    <ShieldCheck size={11} className="text-emerald-600" />
                    <span>EduOS Verified</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Back of Card */
              <div
                data-testid="id-card-back"
                className="relative flex aspect-[1.586/1] w-full flex-col justify-between overflow-hidden rounded-xl border border-slate-300 bg-white p-3 shadow-md"
              >
                {/* Header */}
                <div className="border-b border-slate-200 pb-1">
                  <span className="text-[10px] font-bold tracking-wider text-slate-700 uppercase">
                    {t('students.idCard.emergencyHeader')}
                  </span>
                </div>

                {/* Guardian & Emergency Info */}
                <div className="space-y-1 text-[10px] text-slate-600">
                  <div>
                    <span className="text-slate-400">{t('students.idCard.guardian')}: </span>
                    <strong className="text-slate-800">{activeStudent.guardianName || 'Parent / Legal Guardian'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">{t('students.idCard.emergencyContact')}: </span>
                    <strong className="text-slate-800">{activeStudent.guardianPhone}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">{t('students.idCard.address')}: </span>
                    <span>{activeStudent.schoolAddress || 'Dhaka, Bangladesh'}</span>
                  </div>
                </div>

                {/* Notice text */}
                <p className="text-[8.5px] leading-tight text-slate-500">
                  {t('students.idCard.termsNotice')}
                </p>

                {/* Footer with QR Matrix and Principal Signature */}
                <div className="flex items-end justify-between pt-1">
                  {/* SVG QR Code */}
                  <div className="flex items-center gap-2">
                    <svg
                      width="42"
                      height="42"
                      viewBox="0 0 21 21"
                      className="rounded border border-slate-200 bg-white p-0.5 shadow-xs"
                      aria-label="Student verification QR code"
                    >
                      {qrMatrix.map((row, r) =>
                        row.map((cell, c) =>
                          cell ? (
                            <rect
                              key={`${r}-${c}`}
                              x={c}
                              y={r}
                              width="1"
                              height="1"
                              fill="#0f172a"
                            />
                          ) : null,
                        ),
                      )}
                    </svg>
                    {/* Tiny Barcode graphic */}
                    <div className="hidden sm:flex flex-col">
                      <div className="flex h-4 items-end gap-[1px]">
                        {barcodeBars.slice(0, 24).map((w, i) => (
                          <span
                            key={i}
                            className="bg-slate-800"
                            style={{ width: `${w}px`, height: `${8 + (i % 5) * 2}px` }}
                          />
                        ))}
                      </div>
                      <span className="text-[7px] font-mono text-slate-400">
                        {activeStudent.studentId}
                      </span>
                    </div>
                  </div>

                  {/* Principal Sign */}
                  <div className="flex flex-col items-center">
                    <div className="h-4 w-24 border-b border-dashed border-slate-400" />
                    <span className="mt-0.5 text-[8.5px] font-medium text-slate-600">
                      {t('students.idCard.principalSign')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <span className="mt-2 text-xs text-fg-3">
            {t('students.idCard.flipHint')}
          </span>
        </div>

        {/* Customization & Settings Controls */}
        <div className="flex flex-col gap-3.5 border-t pt-4 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
          <h4 className="text-sm font-semibold text-fg-1">
            {t('students.idCard.customizeTitle')}
          </h4>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t('students.idCard.session')}>
              <Input
                value={session}
                onChange={(e) => setSession(e.target.value)}
                placeholder="2026"
              />
            </Field>

            <Field label={t('students.idCard.validUntil')}>
              <Input
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                placeholder="31-12-2026"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t('students.idCard.bloodGroup')}>
              <Select
                value={activeStudent.bloodGroup || 'O+'}
                onChange={(e) =>
                  setCustomBloodGroups((prev) => ({
                    ...prev,
                    [activeStudent.id]: e.target.value,
                  }))
                }
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label={t('students.idCard.emergencyContact')}>
              <Input
                value={activeStudent.guardianPhone || ''}
                onChange={(e) =>
                  setCustomEmergencyPhones((prev) => ({
                    ...prev,
                    [activeStudent.id]: e.target.value,
                  }))
                }
                placeholder="+880 1711-223344"
              />
            </Field>
          </div>

          {students.length > 1 && (
            <div className="mt-2 rounded-lg border border-divider bg-neutral-50/50 p-3">
              <span className="text-xs font-semibold text-fg-2">
                {t('students.idCard.batchPrintOptions')}
              </span>
              <div className="mt-2 flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-fg-2">
                  <input
                    type="radio"
                    name="batchSide"
                    checked={batchSide === 'front'}
                    onChange={() => setBatchSide('front')}
                  />
                  {t('students.idCard.printFronts')}
                </label>
                <label className="flex items-center gap-2 text-xs text-fg-2">
                  <input
                    type="radio"
                    name="batchSide"
                    checked={batchSide === 'back'}
                    onChange={() => setBatchSide('back')}
                  />
                  {t('students.idCard.printBacks')}
                </label>
              </div>
              <p className="mt-1.5 text-[11px] text-fg-3">
                {t('students.idCard.batchHint', {
                  count: formatNumber(students.length, lang),
                })}
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
