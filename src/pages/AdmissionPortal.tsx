import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  Download,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  School,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input, Select } from '@/components/ui/form'
import { LanguageToggle } from '@/components/layout/LanguageToggle'
import {
  ADMISSION_CLASSES,
  validateBirthCertificate,
  validateBangladeshPhone,
  type Gender,
  type Religion,
  type AdmissionApplicant,
} from '@/lib/admissions'
import { BLOOD_GROUPS } from '@/lib/student-id-card'
import { createAdmissionAdmitCardPdf } from '@/lib/admissions-pdf'
import { useSubmitAdmission } from '@/data/admissions'

export default function AdmissionPortal() {
  const { t } = useTranslation()
  const submitAdmission = useSubmitAdmission()

  const [submittedApplicant, setSubmittedApplicant] = useState<AdmissionApplicant | null>(null)
  const [formError, setFormError] = useState('')

  // Form Fields
  const [studentName, setStudentName] = useState('')
  const [studentNameBn, setStudentNameBn] = useState('')
  const [dob, setDob] = useState('2014-01-01')
  const [gender, setGender] = useState<Gender>('male')
  const [religion, setReligion] = useState<Religion>('islam')
  const [bloodGroup, setBloodGroup] = useState('O+')
  const [birthCertificateNo, setBirthCertificateNo] = useState('')
  const [appliedClass, setAppliedClass] = useState<string>(ADMISSION_CLASSES[5]) // Default Class 6
  const [previousSchool, setPreviousSchool] = useState('')
  const [previousGpa, setPreviousGpa] = useState('')

  // Guardian Fields
  const [guardianName, setGuardianName] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [guardianEmail, setGuardianEmail] = useState('')
  const [guardianOccupation, setGuardianOccupation] = useState('')
  const [presentAddress, setPresentAddress] = useState('')

  function resetForm() {
    setSubmittedApplicant(null)
    setFormError('')
    setStudentName('')
    setStudentNameBn('')
    setDob('2014-01-01')
    setGender('male')
    setReligion('islam')
    setBloodGroup('O+')
    setBirthCertificateNo('')
    setAppliedClass(ADMISSION_CLASSES[5])
    setPreviousSchool('')
    setPreviousGpa('')
    setGuardianName('')
    setGuardianPhone('')
    setGuardianEmail('')
    setGuardianOccupation('')
    setPresentAddress('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    if (!studentName.trim()) {
      setFormError(t('admissions.portal.validation.nameRequired'))
      return
    }

    if (!validateBirthCertificate(birthCertificateNo)) {
      setFormError(t('admissions.portal.validation.birthCertInvalid'))
      return
    }

    if (!guardianName.trim() || !guardianPhone.trim()) {
      setFormError(t('admissions.portal.validation.guardianRequired'))
      return
    }

    if (!validateBangladeshPhone(guardianPhone)) {
      setFormError(t('admissions.portal.validation.phoneInvalid'))
      return
    }

    try {
      const created = await submitAdmission.mutateAsync({
        schoolId: 'sch-1',
        studentName: studentName.trim(),
        studentNameBn: studentNameBn.trim() || undefined,
        gender,
        dob: dob || '2014-01-01',
        religion,
        bloodGroup,
        appliedClass,
        academicYear: '2026',
        previousSchool: previousSchool.trim() || undefined,
        previousGpa: previousGpa.trim() || undefined,
        guardianName: guardianName.trim(),
        guardianPhone: guardianPhone.trim(),
        guardianEmail: guardianEmail.trim() || undefined,
        guardianOccupation: guardianOccupation.trim() || undefined,
        presentAddress: presentAddress.trim() || 'Dhaka, Bangladesh',
        birthCertificateNo: birthCertificateNo.trim(),
      })

      setSubmittedApplicant(created)
    } catch {
      setFormError(t('common.error'))
    }
  }

  function downloadSlip() {
    if (!submittedApplicant) return
    const bytes = createAdmissionAdmitCardPdf(submittedApplicant, {
      schoolName: t('app.school'),
      eiin: '108234',
      address: 'Dhaka, Bangladesh',
    })
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `admission-slip-${submittedApplicant.applicationNo}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-fg-1">
      {/* Top navigation header */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-white shadow-xs">
              <School size={22} />
            </div>
            <div>
              <div className="font-bold text-fg-1">{t('app.school')}</div>
              <div className="text-xs text-fg-3">
                {t('admissions.portal.title')} · Session 2026
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-fg-2 hover:text-primary"
            >
              <ArrowLeft size={14} />
              {t('admissions.portal.backToLogin')}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Success View */}
        {submittedApplicant ? (
          <Card className="border-emerald-200 bg-emerald-50/20 p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-emerald-950">
                {t('admissions.portal.successTitle')}
              </h2>
              <p className="mt-1 max-w-lg text-sm text-slate-600">
                {t('admissions.portal.successSub')}
              </p>

              <div className="mt-6 w-full max-w-md rounded-xl border border-emerald-300 bg-white p-5 shadow-xs">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {t('admissions.portal.appNo')}
                </div>
                <div className="mt-1 font-mono text-3xl font-extrabold text-emerald-700">
                  {submittedApplicant.applicationNo}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-left text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400">Student: </span>
                    <strong className="text-slate-800">{submittedApplicant.studentName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Class: </span>
                    <strong className="text-slate-800">{submittedApplicant.appliedClass}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Guardian: </span>
                    <strong className="text-slate-800">{submittedApplicant.guardianName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Phone: </span>
                    <strong className="text-slate-800">{submittedApplicant.guardianPhone}</strong>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button
                  variant="primary"
                  icon={<Download size={16} />}
                  onClick={downloadSlip}
                >
                  {t('admissions.portal.printSlip')}
                </Button>
                <Button
                  variant="secondary"
                  icon={<RotateCcw size={15} />}
                  onClick={resetForm}
                >
                  {t('admissions.portal.applyAnother')}
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          /* Application Form */
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-tint/30 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles size={13} />
                <span>Admissions 2026 Open</span>
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {t('admissions.portal.title')}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {t('admissions.portal.sub')}
              </p>
            </div>

            {formError && (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {formError}
              </div>
            )}

            <form noValidate onSubmit={handleSubmit} className="space-y-6">
              {/* Section 1: Student Information */}
              <Card title={t('admissions.portal.stepStudent')}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label={t('admissions.portal.studentName')} required>
                    <Input
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="e.g. Tanvir Hasan"
                      required
                    />
                  </Field>

                  <Field label={t('admissions.portal.studentNameBn')}>
                    <Input
                      value={studentNameBn}
                      onChange={(e) => setStudentNameBn(e.target.value)}
                      placeholder="যেমন তানভীর হাসান"
                    />
                  </Field>

                  <Field label={t('admissions.portal.dob')} required>
                    <Input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      required
                    />
                  </Field>

                  <Field label={t('admissions.portal.gender')} required>
                    <Select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as Gender)}
                    >
                      <option value="male">{t('admissions.portal.male')}</option>
                      <option value="female">{t('admissions.portal.female')}</option>
                      <option value="other">{t('admissions.portal.other')}</option>
                    </Select>
                  </Field>

                  <Field label={t('admissions.portal.religion')} required>
                    <Select
                      value={religion}
                      onChange={(e) => setReligion(e.target.value as Religion)}
                    >
                      <option value="islam">{t('admissions.portal.religions.islam')}</option>
                      <option value="hinduism">{t('admissions.portal.religions.hinduism')}</option>
                      <option value="buddhism">{t('admissions.portal.religions.buddhism')}</option>
                      <option value="christianity">{t('admissions.portal.religions.christianity')}</option>
                      <option value="other">{t('admissions.portal.religions.other')}</option>
                    </Select>
                  </Field>

                  <Field label={t('admissions.portal.bloodGroup')}>
                    <Select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                    >
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field
                    label={t('admissions.portal.birthCertificate')}
                    hint="Exactly 17 numeric digits"
                    className="sm:col-span-2"
                    required
                  >
                    <Input
                      value={birthCertificateNo}
                      onChange={(e) => setBirthCertificateNo(e.target.value)}
                      placeholder="e.g. 20142692518012345"
                      maxLength={17}
                      required
                    />
                  </Field>
                </div>
              </Card>

              {/* Section 2: Academic Background */}
              <Card title={t('admissions.portal.stepAcademic')}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label={t('admissions.portal.appliedClass')} required>
                    <Select
                      value={appliedClass}
                      onChange={(e) => setAppliedClass(e.target.value)}
                    >
                      {ADMISSION_CLASSES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label={t('admissions.portal.previousGpa')}>
                    <Input
                      value={previousGpa}
                      onChange={(e) => setPreviousGpa(e.target.value)}
                      placeholder="e.g. 5.00 or 85%"
                    />
                  </Field>

                  <Field
                    label={t('admissions.portal.previousSchool')}
                    className="sm:col-span-2"
                  >
                    <Input
                      value={previousSchool}
                      onChange={(e) => setPreviousSchool(e.target.value)}
                      placeholder="e.g. Govt. Laboratory High School"
                    />
                  </Field>
                </div>
              </Card>

              {/* Section 3: Guardian Details */}
              <Card title={t('admissions.portal.stepGuardian')}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label={t('admissions.portal.guardianName')} required>
                    <Input
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      placeholder="e.g. Md. Kabir Hossain"
                      required
                    />
                  </Field>

                  <Field
                    label={t('admissions.portal.guardianPhone')}
                    hint="e.g. 01712345678"
                    required
                  >
                    <Input
                      value={guardianPhone}
                      onChange={(e) => setGuardianPhone(e.target.value)}
                      placeholder="01712345678"
                      required
                    />
                  </Field>

                  <Field label={t('admissions.portal.guardianEmail')}>
                    <Input
                      type="email"
                      value={guardianEmail}
                      onChange={(e) => setGuardianEmail(e.target.value)}
                      placeholder="parent@example.com"
                    />
                  </Field>

                  <Field label={t('admissions.portal.guardianOccupation')}>
                    <Input
                      value={guardianOccupation}
                      onChange={(e) => setGuardianOccupation(e.target.value)}
                      placeholder="e.g. Teacher, Business, Service"
                    />
                  </Field>

                  <Field
                    label={t('admissions.portal.presentAddress')}
                    className="sm:col-span-2"
                    required
                  >
                    <Input
                      value={presentAddress}
                      onChange={(e) => setPresentAddress(e.target.value)}
                      placeholder="House, Road, Area, Dhaka"
                      required
                    />
                  </Field>
                </div>
              </Card>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="h-11 px-6 text-base"
                  disabled={submitAdmission.isPending}
                  icon={<FileText size={18} />}
                >
                  {submitAdmission.isPending
                    ? t('admissions.portal.submitting')
                    : t('admissions.portal.submit')}
                </Button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
