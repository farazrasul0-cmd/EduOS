import { useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Upload, UserPlus, SlidersHorizontal, MoreHorizontal, User, Camera, Trash2, Loader2, FileSpreadsheet, Download,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Segmented } from '@/components/ui/Segmented'
import { Modal } from '@/components/ui/Modal'
import { Empty } from '@/components/ui/Empty'
import { Field, Input, Select, SearchInput } from '@/components/ui/form'
import { Toolbar, TableWrap, Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { avatarColor, initials, formatNumber } from '@/lib/utils'
import { useAuth } from '@/auth/context'
import { useStudents, useClasses, useAddStudent, useImportStudents, uploadAvatar } from '@/data/students'
import type { AppLanguage } from '@/i18n'
import { studentFormSchema, validateAvatar } from '@/lib/student-validation'
import { parseStudentCsv, csvErrorReport, type CsvPreview } from '@/lib/student-csv'

interface Photo {
  url: string
  name: string
  size: string
  file: File
}

export default function Students() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'en') as AppLanguage
  const { profile } = useAuth()

  const studentsQuery = useStudents()
  const classesQuery = useClasses()
  const addStudent = useAddStudent()
  const importStudents = useImportStudents()

  const [q, setQ] = useState('')
  const [cls, setCls] = useState('all')
  const [open, setOpen] = useState(false)
  const [photo, setPhoto] = useState<Photo | null>(null)
  const [form, setForm] = useState({ full_name: '', roll_no: '', dob: '', class_id: '' })
  const [addError, setAddError] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const csvRef = useRef<HTMLInputElement>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [csvName, setCsvName] = useState('')
  const [csvPreview, setCsvPreview] = useState<CsvPreview | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  const students = studentsQuery.data ?? []
  const classes = classesQuery.data ?? []

  function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const invalid = validateAvatar(f)
    if (invalid) {
      setPhoto(null)
      setPhotoError(t(`students.validation.avatar.${invalid}`))
      e.target.value = ''
      return
    }
    setPhotoError(null)
    setPhoto({ url: URL.createObjectURL(f), name: f.name, size: `${Math.round(f.size / 1024)} KB`, file: f })
  }
  function resetModal() {
    setPhoto(null)
    setForm({ full_name: '', roll_no: '', dob: '', class_id: '' })
    setAddError(null)
    setPhotoError(null)
    setOpen(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function onAdd(e: FormEvent) {
    e.preventDefault()
    if (!profile?.school_id) return
    setAddError(null)
    const parsed = studentFormSchema.safeParse(form)
    if (!parsed.success) {
      setAddError(t('students.validation.invalid'))
      return
    }
    try {
      const avatar_url = photo ? await uploadAvatar(profile.school_id, photo.file) : null
      await addStudent.mutateAsync({
        school_id: profile.school_id,
        full_name: parsed.data.full_name,
        class_id: parsed.data.class_id,
        roll_no: parsed.data.roll_no,
        dob: parsed.data.dob,
        avatar_url,
      })
      resetModal()
    } catch (err) {
      setAddError(err instanceof Error ? err.message : t('auth.error'))
    }
  }

  const rows = students.filter(
    (s) =>
      (cls === 'all' || s.class_id === cls) &&
      (q === '' ||
        s.full_name.toLowerCase().includes(q.toLowerCase()) ||
        (s.roll_no ?? '').toLowerCase().includes(q.toLowerCase())),
  )

  const classOptions = [
    { label: t('students.allClasses'), value: 'all' },
    ...classes.map((c) => ({ label: c.name, value: c.id })),
  ]

  async function onPickCsv(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !profile?.school_id) return
    setImportError(null)
    setCsvName(file.name)
    try {
      setCsvPreview(parseStudentCsv(await file.text(), profile.school_id, classes, students))
    } catch {
      setCsvPreview(null)
      setImportError(t('students.import.readError'))
    }
  }

  function closeImport() {
    setImportOpen(false)
    setCsvPreview(null)
    setCsvName('')
    setImportError(null)
    if (csvRef.current) csvRef.current.value = ''
  }

  async function runImport() {
    if (!csvPreview?.valid.length) return
    setImportError(null)
    try {
      await importStudents.mutateAsync(csvPreview.valid)
      closeImport()
    } catch (error) {
      setImportError(error instanceof Error ? error.message : t('common.error'))
    }
  }

  function downloadErrors() {
    if (!csvPreview?.errors.length) return
    const url = URL.createObjectURL(new Blob([csvErrorReport(csvPreview.errors)], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'student-import-errors.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHeader
        title={t('students.title')}
        sub={t('students.sub')}
        actions={
          <>
            <Button variant="secondary" icon={<Upload size={16} />} onClick={() => setImportOpen(true)}>
              {t('actions.import')}
            </Button>
            <Button variant="primary" icon={<UserPlus size={16} />} onClick={() => setOpen(true)}>
              {t('actions.addStudent')}
            </Button>
          </>
        }
      />

      <Toolbar>
        <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('students.searchPlaceholder')} />
        {classOptions.length > 1 && <Segmented value={cls} onChange={setCls} options={classOptions} />}
        <span className="ml-auto text-[13px] text-fg-3">
          {t('students.ofTotal', {
            shown: formatNumber(rows.length, lang),
            total: formatNumber(students.length, lang),
          })}
        </span>
        <Button variant="secondary" size="sm" icon={<SlidersHorizontal size={14} />}>
          {t('actions.filters')}
        </Button>
      </Toolbar>

      <TableWrap className="rounded-t-none">
        <Table className="min-w-[700px]">
          <THead>
            <TR>
              <TH className="w-8">
                <input type="checkbox" />
              </TH>
              <TH>{t('students.table.student')}</TH>
              <TH>{t('students.table.roll')}</TH>
              <TH>{t('students.table.class')}</TH>
              <TH>{t('students.table.status')}</TH>
              <TH className="w-10" />
            </TR>
          </THead>
          <TBody>
            {studentsQuery.isPending ? (
              <TR>
                <TD className="py-10 text-center text-fg-3" colSpan={6}>
                  <Loader2 className="mx-auto animate-spin text-primary" size={22} />
                </TD>
              </TR>
            ) : studentsQuery.isError ? (
              <TR>
                <TD className="py-10 text-center" colSpan={6}>
                  <div className="text-sm text-danger">{t('common.error')}</div>
                  <Button variant="secondary" size="sm" className="mx-auto mt-3" onClick={() => void studentsQuery.refetch()}>
                    {t('common.retry')}
                  </Button>
                </TD>
              </TR>
            ) : rows.length === 0 ? (
              <TR>
                <TD className="py-4" colSpan={6}>
                  <Empty icon={UserPlus} title={t('students.empty')} sub={t('students.emptySub')} />
                </TD>
              </TR>
            ) : (
              rows.map((s) => (
                <TR key={s.id}>
                  <TD>
                    <input type="checkbox" />
                  </TD>
                  <TD>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={s.full_name} src={s.avatar_url} />
                      <Link to={`/students/${s.id}`} className="font-semibold hover:text-primary hover:underline">{s.full_name}</Link>
                    </div>
                  </TD>
                  <TD className="text-xs text-fg-3">{s.roll_no ?? '—'}</TD>
                  <TD>{s.class_name ?? '—'}</TD>
                  <TD>
                    <Badge tone={s.status === 'active' ? 'success' : 'neutral'}>
                      {s.status === 'active' ? t('students.statusActive') : s.status}
                    </Badge>
                  </TD>
                  <TD>
                    <button className="grid h-7 w-7 place-items-center rounded-sm text-fg-2 hover:bg-neutral-100">
                      <MoreHorizontal size={16} />
                    </button>
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </TableWrap>

      <Modal
        open={importOpen}
        onClose={closeImport}
        title={t('students.import.title')}
        sub={t('students.import.sub')}
        footer={<><Button variant="ghost" onClick={closeImport} disabled={importStudents.isPending}>{t('actions.cancel')}</Button><Button variant="primary" disabled={importStudents.isPending || !csvPreview?.valid.length} onClick={() => void runImport()}>{importStudents.isPending ? t('common.saving') : t('students.import.importCount', { count: csvPreview?.valid.length ?? 0 })}</Button></>}
      >
        <input ref={csvRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => void onPickCsv(event)} />
        <button type="button" onClick={() => csvRef.current?.click()} className="flex w-full flex-col items-center rounded-md border border-dashed border-border-strong bg-app px-4 py-7 text-center hover:border-primary">
          <FileSpreadsheet size={28} className="text-primary" />
          <span className="mt-2 text-sm font-semibold">{csvName || t('students.import.choose')}</span>
          <span className="mt-1 text-xs text-fg-3">{t('students.import.columns')}</span>
        </button>
        {csvPreview && <div className="mt-4">
          <div className="grid grid-cols-3 gap-3 text-center"><div className="rounded-sm bg-app p-3"><div className="text-xl font-semibold">{formatNumber(csvPreview.total, lang)}</div><div className="text-xs text-fg-3">{t('students.import.rows')}</div></div><div className="rounded-sm bg-success-tint p-3"><div className="text-xl font-semibold text-success">{formatNumber(csvPreview.valid.length, lang)}</div><div className="text-xs text-fg-3">{t('students.import.valid')}</div></div><div className="rounded-sm bg-danger-tint p-3"><div className="text-xl font-semibold text-danger">{formatNumber(csvPreview.errors.length, lang)}</div><div className="text-xs text-fg-3">{t('students.import.errors')}</div></div></div>
          {csvPreview.valid.length > 0 && <div className="mt-3 max-h-48 overflow-auto rounded-sm border border-divider"><table className="w-full text-sm"><tbody>{csvPreview.valid.slice(0, 50).map((row, index) => <tr key={`${row.full_name}-${index}`} className="border-b border-divider last:border-0"><td className="px-3 py-2 font-medium">{row.full_name}</td><td className="px-3 py-2 text-fg-3">{row.roll_no ?? '—'}</td><td className="px-3 py-2 text-fg-3">{classes.find((item) => item.id === row.class_id)?.name ?? '—'}</td></tr>)}</tbody></table></div>}
          {csvPreview.errors.length > 0 && <Button className="mt-3" variant="secondary" size="sm" icon={<Download size={14} />} onClick={downloadErrors}>{t('students.import.downloadErrors')}</Button>}
        </div>}
        {importError && <div className="mt-3 rounded-sm bg-danger-tint px-3 py-2 text-sm text-danger">{importError}</div>}
      </Modal>

      <Modal
        open={open}
        onClose={resetModal}
        title={t('students.modal.title')}
        sub={t('students.modal.sub')}
        footer={
          <>
            <Button variant="ghost" onClick={resetModal} disabled={addStudent.isPending}>
              {t('actions.cancel')}
            </Button>
            <Button variant="primary" onClick={onAdd} disabled={addStudent.isPending || !form.full_name.trim()}>
              {addStudent.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t('onboarding.working')}
                </>
              ) : (
                t('actions.addStudent')
              )}
            </Button>
          </>
        }
      >
        <form onSubmit={onAdd}>
          <div className="mb-4 flex items-center gap-4 border-b border-divider pb-4">
            <div className="relative">
              {photo ? (
                <img src={photo.url} alt="" className="h-[72px] w-[72px] rounded-full border border-border object-cover" />
              ) : form.full_name.trim() ? (
                <span
                  className="grid h-[72px] w-[72px] place-items-center rounded-full text-[26px] font-bold text-white"
                  style={{ background: avatarColor(form.full_name) }}
                >
                  {initials(form.full_name)}
                </span>
              ) : (
                <span className="grid h-[72px] w-[72px] place-items-center rounded-full border border-dashed border-border-strong bg-app text-fg-4">
                  <User size={28} />
                </span>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -right-0.5 -bottom-0.5 grid h-[26px] w-[26px] place-items-center rounded-full border-2 border-white bg-primary text-white shadow-sm"
              >
                <Camera size={13} />
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{t('students.modal.profilePhoto')}</div>
              <div className="mt-0.5 text-xs text-fg-3">
                {photo ? `${photo.name} · ${photo.size}` : t('students.modal.photoHint')}
              </div>
              <div className="mt-2.5 flex gap-2">
                <Button variant="secondary" size="sm" type="button" icon={<Upload size={14} />} onClick={() => fileRef.current?.click()}>
                  {photo ? t('actions.replace') : t('actions.upload')}
                </Button>
                {photo && (
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    icon={<Trash2 size={14} />}
                    onClick={() => {
                      setPhoto(null)
                      if (fileRef.current) fileRef.current.value = ''
                    }}
                  >
                    {t('actions.remove')}
                  </Button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={onPickPhoto} />
              {photoError && <div className="mt-2 text-xs text-danger">{photoError}</div>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label={t('students.modal.fullName')}>
              <Input
                placeholder={t('students.modal.fullNamePlaceholder')}
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                required
              />
            </Field>
            <Field label={t('students.modal.rollNo')}>
              <Input
                placeholder={t('students.modal.autoAssigned')}
                value={form.roll_no}
                onChange={(e) => setForm((f) => ({ ...f, roll_no: e.target.value }))}
              />
            </Field>
            <Field label={t('students.modal.dob')}>
              <Input type="date" value={form.dob} onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))} />
            </Field>
            <Field label={t('students.modal.class')}>
              <Select value={form.class_id} onChange={(e) => setForm((f) => ({ ...f, class_id: e.target.value }))}>
                <option value="">—</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field className="sm:col-span-2" label={t('students.modal.parentEmail')} hint={t('students.modal.parentEmailHint')}>
              <Input type="email" placeholder={t('students.modal.parentEmailPlaceholder')} />
            </Field>
          </div>

          {addError && (
            <div className="mt-3 rounded-sm bg-danger-tint px-3 py-2 text-[13px] text-danger">{addError}</div>
          )}
        </form>
      </Modal>
    </div>
  )
}
