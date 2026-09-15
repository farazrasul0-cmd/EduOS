import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BookOpen,
  BookMarked,
  AlertTriangle,
  CheckCircle,
  Plus,
  Download,
  CheckCheck,
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
import { formatNumber } from '@/lib/utils'
import type { AppLanguage } from '@/i18n'
import type {
  Book,
  BookLoan,
  BookCategory,
  BorrowerType,
} from '@/lib/library'
import {
  BOOK_CATEGORIES,
  getNctbCurriculumBooks,
  computeDistributionProgress,
} from '@/lib/library'
import {
  createBookDistributionReportPdf,
  createLibraryOverdueNoticePdf,
} from '@/lib/library-pdf'
import {
  useBooks,
  useAddBook,
  useBookLoans,
  useIssueBook,
  useReturnBook,
  useRenewBook,
  useSettleFine,
  useNctbDistributions,
  useToggleNctbSubject,
  useDistributeAllToClass,
} from '@/data/library'

export default function Library() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'en') as AppLanguage
  const toast = useToast()

  const booksQuery = useBooks()
  const loansQuery = useBookLoans()
  const nctbQuery = useNctbDistributions()

  const addBook = useAddBook()
  const issueBook = useIssueBook()
  const returnBook = useReturnBook()
  const renewBook = useRenewBook()
  const settleFine = useSettleFine()
  const toggleNctbSubject = useToggleNctbSubject()
  const distributeAllToClass = useDistributeAllToClass()

  const [activeTab, setActiveTab] = useState('catalog')
  const [catalogQuery, setCatalogQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [nctbClass, setNctbClass] = useState<string>('Class 6-A')

  // Modals state
  const [addBookModalOpen, setAddBookModalOpen] = useState(false)
  const [issueModalOpen, setIssueModalOpen] = useState(false)
  const [returnModalOpen, setReturnModalOpen] = useState(false)

  // Selected item state for modals
  const [selectedBookForIssue, setSelectedBookForIssue] = useState<Book | null>(null)
  const [selectedLoanForReturn, setSelectedLoanForReturn] = useState<BookLoan | null>(null)

  // Add Book Form state
  const [newTitle, setNewTitle] = useState('')
  const [newTitleBn, setNewTitleBn] = useState('')
  const [newAuthor, setNewAuthor] = useState('')
  const [newAuthorBn, setNewAuthorBn] = useState('')
  const [newCategory, setNewCategory] = useState<BookCategory>('fiction')
  const [newShelf, setNewShelf] = useState('')
  const [newCopies, setNewCopies] = useState('3')
  const [newLanguage, setNewLanguage] = useState<'bengali' | 'english' | 'arabic'>('bengali')

  // Issue Book Form state
  const [issueBookId, setIssueBookId] = useState('')
  const [borrowerType, setBorrowerType] = useState<BorrowerType>('student')
  const [borrowerName, setBorrowerName] = useState('')
  const [borrowerRollOrDesignation, setBorrowerRollOrDesignation] = useState('')
  const [borrowerClass, setBorrowerClass] = useState('Class 7-A')
  const [borrowerPhone, setBorrowerPhone] = useState('')
  const [loanDays, setLoanDays] = useState('14')

  // Return Book Form state
  const [markFinePaid, setMarkFinePaid] = useState(false)
  const [waiveFine, setWaiveFine] = useState(false)

  // Derived lists
  const books = useMemo(() => booksQuery.data ?? [], [booksQuery.data])
  const loans = useMemo(() => loansQuery.data ?? [], [loansQuery.data])
  const nctbDistributions = useMemo(() => nctbQuery.data ?? [], [nctbQuery.data])

  // KPIs
  const totalBooks = books.reduce((sum, b) => sum + b.totalCopies, 0)
  const activeLoansCount = loans.filter((l) => l.status === 'issued' || l.status === 'overdue').length
  const overdueLoans = useMemo(() => loans.filter((l) => l.status === 'overdue'), [loans])
  const overdueCount = overdueLoans.length
  const totalFines = loans.reduce((sum, l) => sum + (l.finePaid || l.fineWaived ? 0 : l.fineAccrued), 0)
  const nctbProgress = useMemo(
    () => computeDistributionProgress(nctbDistributions, nctbClass),
    [nctbDistributions, nctbClass],
  )

  // Filtered Catalog
  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const matchCat = selectedCategory === 'all' || b.category === selectedCategory
      const q = catalogQuery.toLowerCase().trim()
      const matchQuery =
        !q ||
        b.title.toLowerCase().includes(q) ||
        (b.titleBn && b.titleBn.includes(q)) ||
        b.author.toLowerCase().includes(q) ||
        (b.authorBn && b.authorBn.includes(q)) ||
        b.accessionNo.toLowerCase().includes(q)
      return matchCat && matchQuery
    })
  }, [books, selectedCategory, catalogQuery])

  // Handlers
  async function handleAddBook(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim() || !newAuthor.trim()) return
    try {
      await addBook.mutateAsync({
        schoolId: 'sch-1',
        title: newTitle.trim(),
        titleBn: newTitleBn.trim() || undefined,
        author: newAuthor.trim(),
        authorBn: newAuthorBn.trim() || undefined,
        category: newCategory,
        shelfLocation: newShelf.trim() || 'General Rack',
        totalCopies: Number(newCopies) || 1,
        language: newLanguage,
      })
      toast.success(t('library.notifications.bookAdded'))
      setAddBookModalOpen(false)
      setNewTitle('')
      setNewTitleBn('')
      setNewAuthor('')
      setNewAuthorBn('')
      setNewShelf('')
    } catch {
      toast.error(t('common.error'))
    }
  }

  function openIssueModal(book?: Book) {
    if (book) {
      setSelectedBookForIssue(book)
      setIssueBookId(book.id)
    } else {
      setSelectedBookForIssue(null)
      setIssueBookId(books[0]?.id || '')
    }
    setBorrowerName('')
    setBorrowerRollOrDesignation('')
    setBorrowerPhone('')
    setIssueModalOpen(true)
  }

  async function handleIssueSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!issueBookId || !borrowerName.trim()) return
    try {
      await issueBook.mutateAsync({
        bookId: issueBookId,
        borrowerType,
        borrowerId: `borrower-${Date.now()}`,
        borrowerName: borrowerName.trim(),
        borrowerRollOrDesignation: borrowerRollOrDesignation.trim() || '01',
        borrowerClass: borrowerType === 'student' ? borrowerClass : undefined,
        borrowerPhone: borrowerPhone.trim() || undefined,
        loanDays: Number(loanDays) || 14,
      })
      toast.success(t('library.notifications.bookIssued'))
      setIssueModalOpen(false)
    } catch {
      toast.error(t('common.error'))
    }
  }

  function openReturnModal(loan: BookLoan) {
    setSelectedLoanForReturn(loan)
    setMarkFinePaid(false)
    setWaiveFine(false)
    setReturnModalOpen(true)
  }

  async function handleConfirmReturn() {
    if (!selectedLoanForReturn) return
    try {
      await returnBook.mutateAsync({
        loanId: selectedLoanForReturn.id,
        finePaid: markFinePaid,
        waiveFine,
      })
      toast.success(t('library.notifications.bookReturned'))
      setReturnModalOpen(false)
    } catch {
      toast.error(t('common.error'))
    }
  }

  async function handleRenew(loanId: string) {
    try {
      await renewBook.mutateAsync(loanId)
      toast.success(t('library.notifications.bookRenewed'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  async function handleSettleFine(loanId: string, waive: boolean) {
    try {
      await settleFine.mutateAsync({ loanId, waive })
      toast.success(t('library.notifications.fineSettled'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  async function handleDistributeAll() {
    try {
      await distributeAllToClass.mutateAsync(nctbClass)
      toast.success(t('library.notifications.allDistributed'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  function downloadNctbReport() {
    const classRecords = nctbDistributions.filter((d) => d.className === nctbClass)
    const bytes = createBookDistributionReportPdf(classRecords, nctbClass, {
      schoolName: t('app.school'),
      eiin: '108234',
      address: 'Dhaka, Bangladesh',
    })
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `nctb-distribution-${nctbClass.replace(/\s+/g, '-').toLowerCase()}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }

  function downloadOverdueReport() {
    const bytes = createLibraryOverdueNoticePdf(overdueLoans, {
      schoolName: t('app.school'),
      eiin: '108234',
      address: 'Dhaka, Bangladesh',
    })
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `library-overdue-notice-${new Date().toISOString().slice(0, 10)}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHeader
        title={t('library.title')}
        sub={t('library.sub')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => setAddBookModalOpen(true)}
            >
              {t('library.catalog.addBook')}
            </Button>
            <Button
              variant="secondary"
              icon={<BookMarked size={16} />}
              onClick={() => openIssueModal()}
            >
              {t('library.circulation.issueNew')}
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPI
          icon={BookOpen}
          label={t('library.kpis.totalBooks')}
          value={formatNumber(totalBooks, lang)}
        />
        <KPI
          icon={BookMarked}
          label={t('library.kpis.activeLoans')}
          value={formatNumber(activeLoansCount, lang)}
        />
        <KPI
          icon={AlertTriangle}
          label={t('library.kpis.overdueCount')}
          value={formatNumber(overdueCount, lang)}
          delta={totalFines > 0 ? `৳${formatNumber(totalFines, lang)}` : undefined}
          deltaTone={overdueCount > 0 ? 'down' : 'neutral'}
        />
        <KPI
          icon={CheckCircle}
          label={t('library.kpis.nctbDistributed')}
          value={`${formatNumber(nctbProgress.percentDistributed, lang)}%`}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="mb-4">
        <Segmented
          value={activeTab}
          onChange={setActiveTab}
          options={[
            { value: 'catalog', label: t('library.tabs.catalog') },
            { value: 'circulation', label: t('library.tabs.circulation') },
            { value: 'nctb', label: t('library.tabs.nctb') },
            { value: 'overdue', label: t('library.tabs.overdue') },
          ]}
        />
      </div>

      {/* TAB 1: Book Catalog */}
      {activeTab === 'catalog' && (
        <TableWrap>
          <Toolbar>
            <SearchInput
              value={catalogQuery}
              onChange={(e) => setCatalogQuery(e.target.value)}
              placeholder={t('library.catalog.searchPlaceholder')}
            />
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by category"
              className="w-48"
            >
              <option value="all">{t('library.catalog.allCategories')}</option>
              {BOOK_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {t(`library.categories.${cat}`)}
                </option>
              ))}
            </Select>
          </Toolbar>

          {filteredBooks.length === 0 ? (
            <div className="p-8 text-center text-fg-3">
              <BookOpen size={36} className="mx-auto mb-2 opacity-40" />
              <p>{t('common.noResults')}</p>
            </div>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>{t('library.catalog.accessionNo')}</TH>
                  <TH>{t('library.catalog.bookTitle')}</TH>
                  <TH>{t('library.catalog.author')}</TH>
                  <TH>{t('library.catalog.category')}</TH>
                  <TH>{t('library.catalog.shelf')}</TH>
                  <TH>{t('library.catalog.available')}</TH>
                  <TH className="text-right">{t('library.catalog.actions')}</TH>
                </TR>
              </THead>
              <TBody>
                {filteredBooks.map((book) => {
                  const isAvailable = book.availableCopies > 0
                  return (
                    <TR key={book.id}>
                      <TD>
                        <span className="font-mono text-xs font-semibold text-fg-2">
                          {book.accessionNo}
                        </span>
                      </TD>
                      <TD>
                        <div className="font-medium text-fg-1">{book.title}</div>
                        {book.titleBn && (
                          <div className="text-xs text-fg-3">{book.titleBn}</div>
                        )}
                      </TD>
                      <TD>
                        <div className="text-fg-2">{book.author}</div>
                        {book.authorBn && (
                          <div className="text-xs text-fg-4">{book.authorBn}</div>
                        )}
                      </TD>
                      <TD>
                        <Badge tone="neutral">
                          {t(`library.categories.${book.category}`)}
                        </Badge>
                      </TD>
                      <TD className="text-xs text-fg-3">{book.shelfLocation}</TD>
                      <TD>
                        <Badge tone={isAvailable ? 'success' : 'danger'}>
                          {formatNumber(book.availableCopies, lang)} / {formatNumber(book.totalCopies, lang)}
                        </Badge>
                      </TD>
                      <TD className="text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={!isAvailable}
                          onClick={() => openIssueModal(book)}
                        >
                          {t('library.catalog.issue')}
                        </Button>
                      </TD>
                    </TR>
                  )
                })}
              </TBody>
            </Table>
          )}
        </TableWrap>
      )}

      {/* TAB 2: Circulation Desk */}
      {activeTab === 'circulation' && (
        <TableWrap>
          <Toolbar>
            <div className="text-sm font-semibold text-fg-2">
              {t('library.circulation.book')} & {t('library.circulation.borrower')}
            </div>
          </Toolbar>

          {loans.length === 0 ? (
            <div className="p-8 text-center text-fg-3">
              <BookMarked size={36} className="mx-auto mb-2 opacity-40" />
              <p>{t('common.noResults')}</p>
            </div>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>{t('library.circulation.book')}</TH>
                  <TH>{t('library.circulation.borrower')}</TH>
                  <TH>{t('library.circulation.issueDate')}</TH>
                  <TH>{t('library.circulation.dueDate')}</TH>
                  <TH>{t('library.catalog.status')}</TH>
                  <TH>{t('library.circulation.fine')}</TH>
                  <TH className="text-right">{t('library.catalog.actions')}</TH>
                </TR>
              </THead>
              <TBody>
                {loans.map((loan) => {
                  const isReturned = loan.status === 'returned'
                  const isOverdue = loan.status === 'overdue'

                  return (
                    <TR key={loan.id}>
                      <TD className="font-medium text-fg-1">{loan.bookTitle}</TD>
                      <TD>
                        <div className="text-fg-1">{loan.borrowerName}</div>
                        <div className="text-xs text-fg-3">
                          {loan.borrowerClass || loan.borrowerRollOrDesignation}
                          {loan.borrowerPhone && ` · ${loan.borrowerPhone}`}
                        </div>
                      </TD>
                      <TD className="text-xs text-fg-3">{loan.issueDate}</TD>
                      <TD className="text-xs font-semibold text-fg-2">{loan.dueDate}</TD>
                      <TD>
                        <Badge
                          tone={
                            isReturned
                              ? 'success'
                              : isOverdue
                              ? 'danger'
                              : 'info'
                          }
                        >
                          {loan.status.toUpperCase()}
                        </Badge>
                      </TD>
                      <TD>
                        {loan.fineAccrued > 0 ? (
                          <span
                            className={`font-semibold ${
                              loan.finePaid || loan.fineWaived
                                ? 'text-emerald-600 line-through'
                                : 'text-rose-600'
                            }`}
                          >
                            ৳{formatNumber(loan.fineAccrued, lang)}
                            {loan.fineWaived && ' (Waived)'}
                          </span>
                        ) : (
                          '—'
                        )}
                      </TD>
                      <TD className="text-right">
                        {!isReturned ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleRenew(loan.id)}
                            >
                              {t('library.circulation.renewAction')}
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => openReturnModal(loan)}
                            >
                              {t('library.circulation.returnAction')}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-emerald-600 font-medium">
                            Returned {loan.returnDate}
                          </span>
                        )}
                      </TD>
                    </TR>
                  )
                })}
              </TBody>
            </Table>
          )}
        </TableWrap>
      )}

      {/* TAB 3: NCTB Free Textbook Distribution Register */}
      {activeTab === 'nctb' && (
        <div>
          <Toolbar className="mb-3 rounded-md border-b">
            <div className="flex flex-wrap items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-fg-3">
                  {t('library.nctb.selectClass')}:
                </span>
                <Select
                  value={nctbClass}
                  onChange={(e) => setNctbClass(e.target.value)}
                  aria-label="Select NCTB class"
                  className="w-40"
                >
                  <option value="Class 6-A">Class 6-A</option>
                  <option value="Class 7-A">Class 7-A</option>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<CheckCheck size={15} />}
                  onClick={handleDistributeAll}
                >
                  {t('library.nctb.distributeAll')}
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Download size={15} />}
                  onClick={downloadNctbReport}
                >
                  {t('library.nctb.downloadReport')}
                </Button>
              </div>
            </div>
          </Toolbar>

          {/* Student Roster & Textbook Checklist Table */}
          <TableWrap>
            <Table>
              <THead>
                <TR>
                  <TH className="w-16">{t('library.nctb.roll')}</TH>
                  <TH>{t('library.nctb.studentName')}</TH>
                  <TH>{t('library.nctb.distributedStatus')}</TH>
                  <TH className="w-40">{t('library.catalog.status')}</TH>
                  <TH className="w-36 text-center">{t('library.nctb.signed')}</TH>
                </TR>
              </THead>
              <TBody>
                {nctbDistributions
                  .filter((d) => d.className === nctbClass)
                  .map((item) => {
                    const curriculum = getNctbCurriculumBooks(item.className)
                    const totalCount = curriculum.length
                    const receivedCount = item.distributedSubjectKeys.length
                    const isAll = receivedCount >= totalCount

                    return (
                      <TR key={item.id}>
                        <TD className="font-mono font-semibold text-fg-2">{item.rollNo}</TD>
                        <TD>
                          <div className="font-medium text-fg-1">{item.studentName}</div>
                          {item.studentNameBn && (
                            <div className="text-xs text-fg-3">{item.studentNameBn}</div>
                          )}
                        </TD>
                        <TD>
                          <div className="flex flex-wrap gap-1.5 py-1">
                            {curriculum.map((subj) => {
                              const checked = item.distributedSubjectKeys.includes(subj.subjectKey)
                              return (
                                <button
                                  key={subj.subjectKey}
                                  type="button"
                                  onClick={() =>
                                    toggleNctbSubject.mutate({
                                      distributionId: item.id,
                                      subjectKey: subj.subjectKey,
                                    })
                                  }
                                  className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                                    checked
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : 'bg-neutral-100 text-fg-3 border border-border hover:bg-neutral-200'
                                  }`}
                                >
                                  {checked && <CheckCircle size={10} />}
                                  {lang === 'bn' ? subj.subjectBn : subj.subjectEn}
                                </button>
                              )
                            })}
                          </div>
                        </TD>
                        <TD>
                          <Badge tone={isAll ? 'success' : receivedCount > 0 ? 'warning' : 'neutral'}>
                            {isAll
                              ? t('library.nctb.allComplete')
                              : `${receivedCount}/${totalCount} ${t('library.nctb.partially')}`}
                          </Badge>
                        </TD>
                        <TD className="text-center">
                          {item.guardianSigned ? (
                            <Badge tone="success">✓ Signed</Badge>
                          ) : (
                            <Badge tone="neutral">Pending</Badge>
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

      {/* TAB 4: Overdue & Fines Ledger */}
      {activeTab === 'overdue' && (
        <TableWrap>
          <Toolbar className="justify-between">
            <div className="text-sm font-semibold text-fg-2">
              {t('library.tabs.overdue')} · Total Overdue: {overdueLoans.length}
            </div>
            <Button
              size="sm"
              variant="secondary"
              icon={<Download size={14} />}
              onClick={downloadOverdueReport}
            >
              {t('library.overdue.downloadNotice')}
            </Button>
          </Toolbar>

          {overdueLoans.length === 0 ? (
            <div className="p-8 text-center text-fg-3">
              <CheckCircle size={36} className="mx-auto mb-2 text-emerald-500 opacity-60" />
              <p>No overdue book loans recorded.</p>
            </div>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>{t('library.circulation.book')}</TH>
                  <TH>{t('library.circulation.borrower')}</TH>
                  <TH>{t('library.circulation.dueDate')}</TH>
                  <TH>{t('library.circulation.fine')}</TH>
                  <TH>{t('library.catalog.status')}</TH>
                  <TH className="text-right">{t('library.catalog.actions')}</TH>
                </TR>
              </THead>
              <TBody>
                {overdueLoans.map((loan) => (
                  <TR key={loan.id}>
                    <TD className="font-medium text-fg-1">{loan.bookTitle}</TD>
                    <TD>
                      <div className="text-fg-1">{loan.borrowerName}</div>
                      <div className="text-xs text-fg-3">
                        {loan.borrowerClass || loan.borrowerRollOrDesignation} · {loan.borrowerPhone}
                      </div>
                    </TD>
                    <TD className="text-xs font-semibold text-rose-600">{loan.dueDate}</TD>
                    <TD className="font-semibold text-rose-700">
                      ৳{formatNumber(loan.fineAccrued, lang)}
                    </TD>
                    <TD>
                      <Badge tone={loan.finePaid ? 'success' : loan.fineWaived ? 'neutral' : 'danger'}>
                        {loan.finePaid
                          ? t('library.overdue.paid')
                          : loan.fineWaived
                          ? t('library.overdue.waived')
                          : t('library.overdue.unpaid')}
                      </Badge>
                    </TD>
                    <TD className="text-right">
                      {!loan.finePaid && !loan.fineWaived && (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleSettleFine(loan.id, true)}
                          >
                            {t('library.overdue.waiveFine')}
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleSettleFine(loan.id, false)}
                          >
                            {t('library.overdue.settleFine')}
                          </Button>
                        </div>
                      )}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </TableWrap>
      )}

      {/* Modal 1: Add New Book to Catalog */}
      <Modal
        open={addBookModalOpen}
        onClose={() => setAddBookModalOpen(false)}
        title={t('library.modal.addBookTitle')}
      >
        <form onSubmit={handleAddBook} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t('library.modal.titleField')} required>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Gitanjali"
                required
              />
            </Field>

            <Field label={t('library.modal.titleBnField')}>
              <Input
                value={newTitleBn}
                onChange={(e) => setNewTitleBn(e.target.value)}
                placeholder="যেমন গীতাঞ্জলি"
              />
            </Field>

            <Field label={t('library.modal.authorField')} required>
              <Input
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                placeholder="e.g. Rabindranath Tagore"
                required
              />
            </Field>

            <Field label={t('library.modal.authorBnField')}>
              <Input
                value={newAuthorBn}
                onChange={(e) => setNewAuthorBn(e.target.value)}
                placeholder="যেমন রবীন্দ্রনাথ ঠাকুর"
              />
            </Field>

            <Field label={t('library.modal.categoryField')} required>
              <Select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as BookCategory)}
              >
                {BOOK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {t(`library.categories.${cat}`)}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label={t('library.modal.shelfField')} required>
              <Input
                value={newShelf}
                onChange={(e) => setNewShelf(e.target.value)}
                placeholder="e.g. Almirah A-1, Shelf 2"
                required
              />
            </Field>

            <Field label={t('library.modal.copiesField')} required>
              <Input
                type="number"
                min="1"
                max="100"
                value={newCopies}
                onChange={(e) => setNewCopies(e.target.value)}
                required
              />
            </Field>

            <Field label="Language">
              <Select
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value as 'bengali' | 'english' | 'arabic')}
              >
                <option value="bengali">Bangla (বাংলা)</option>
                <option value="english">English</option>
                <option value="arabic">Arabic</option>
              </Select>
            </Field>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAddBookModalOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary">
              {t('library.modal.confirmAdd')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Issue Book to Student or Teacher */}
      <Modal
        open={issueModalOpen}
        onClose={() => setIssueModalOpen(false)}
        title={t('library.modal.issueTitle')}
        sub={
          selectedBookForIssue
            ? `${selectedBookForIssue.title} (${selectedBookForIssue.accessionNo})`
            : undefined
        }
      >
        <form onSubmit={handleIssueSubmit} className="space-y-4">
          <Field label={t('library.modal.selectBook')} required>
            <Select
              value={issueBookId}
              onChange={(e) => setIssueBookId(e.target.value)}
            >
              {books.map((b) => (
                <option
                  key={b.id}
                  value={b.id}
                  disabled={b.availableCopies <= 0}
                >
                  {b.title} ({b.accessionNo}) — {b.availableCopies} available
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t('library.modal.selectBorrowerType')} required>
              <Select
                value={borrowerType}
                onChange={(e) => setBorrowerType(e.target.value as BorrowerType)}
              >
                <option value="student">{t('library.modal.student')}</option>
                <option value="teacher">{t('library.modal.teacher')}</option>
              </Select>
            </Field>

            <Field label={t('library.modal.borrowerName')} required>
              <Input
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
                placeholder="e.g. Tanvir Hasan"
                required
              />
            </Field>

            {borrowerType === 'student' ? (
              <>
                <Field label={t('library.modal.classField')} required>
                  <Select
                    value={borrowerClass}
                    onChange={(e) => setBorrowerClass(e.target.value)}
                  >
                    <option value="Class 6-A">Class 6-A</option>
                    <option value="Class 7-A">Class 7-A</option>
                    <option value="Class 8-A">Class 8-A</option>
                  </Select>
                </Field>
                <Field label={t('library.modal.rollOrDesignation')} required>
                  <Input
                    value={borrowerRollOrDesignation}
                    onChange={(e) => setBorrowerRollOrDesignation(e.target.value)}
                    placeholder="e.g. 05"
                    required
                  />
                </Field>
              </>
            ) : (
              <Field label={t('library.modal.rollOrDesignation')} required>
                <Input
                  value={borrowerRollOrDesignation}
                  onChange={(e) => setBorrowerRollOrDesignation(e.target.value)}
                  placeholder="e.g. Assistant Teacher (Math)"
                  required
                />
              </Field>
            )}

            <Field label={t('library.modal.phoneField')}>
              <Input
                value={borrowerPhone}
                onChange={(e) => setBorrowerPhone(e.target.value)}
                placeholder="01712345678"
              />
            </Field>

            <Field label={t('library.modal.loanDuration')} required>
              <Select
                value={loanDays}
                onChange={(e) => setLoanDays(e.target.value)}
              >
                <option value="7">7 Days</option>
                <option value="14">14 Days (Standard)</option>
                <option value="30">30 Days (Extended)</option>
              </Select>
            </Field>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIssueModalOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary">
              {t('library.modal.confirmIssue')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Return Book & Settle Fine */}
      <Modal
        open={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        title={t('library.modal.returnTitle')}
      >
        {selectedLoanForReturn && (
          <div className="space-y-4">
            <div className="rounded-md border border-border bg-neutral-50 p-3 text-sm">
              <div className="font-semibold text-fg-1">
                {selectedLoanForReturn.bookTitle}
              </div>
              <div className="mt-1 text-xs text-fg-3">
                Borrower: {selectedLoanForReturn.borrowerName} (
                {selectedLoanForReturn.borrowerClass ||
                  selectedLoanForReturn.borrowerRollOrDesignation}
                )
              </div>
              <div className="mt-1 text-xs text-fg-3">
                Due Date: {selectedLoanForReturn.dueDate}
              </div>
            </div>

            {selectedLoanForReturn.fineAccrued > 0 && (
              <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm">
                <div className="font-semibold text-rose-800">
                  {t('library.modal.accruedFine')}: ৳{selectedLoanForReturn.fineAccrued}
                </div>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-fg-2">
                    <input
                      type="checkbox"
                      checked={markFinePaid}
                      disabled={waiveFine}
                      onChange={(e) => setMarkFinePaid(e.target.checked)}
                      className="rounded text-primary"
                    />
                    <span>{t('library.modal.markPaid')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-fg-2">
                    <input
                      type="checkbox"
                      checked={waiveFine}
                      onChange={(e) => {
                        setWaiveFine(e.target.checked)
                        if (e.target.checked) setMarkFinePaid(false)
                      }}
                      className="rounded text-primary"
                    />
                    <span>{t('library.modal.waiveFine')}</span>
                  </label>
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setReturnModalOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleConfirmReturn}
              >
                {t('library.modal.confirmReturn')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
