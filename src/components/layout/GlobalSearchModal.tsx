import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Search,
  Users,
  Banknote,
  ClipboardList,
  CalendarCheck,
  Clock,
  FileText,
  Award,
  Calendar,
  MessageSquare,
  Settings,
  LayoutDashboard,
  ArrowRight,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useStudents } from '@/data/students'
import { useInvoices } from '@/data/fees'
import { useExams } from '@/data/exams'
import { formatTaka } from '@/lib/utils'

interface SearchItem {
  id: string
  category: 'students' | 'invoices' | 'exams' | 'navigation'
  title: string
  subtitle?: string
  icon: LucideIcon
  path: string
}

interface GlobalSearchModalProps {
  open: boolean
  onClose: () => void
}

export function GlobalSearchModal({ open, onClose }: GlobalSearchModalProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const studentsQuery = useStudents()
  const invoicesQuery = useInvoices()
  const examsQuery = useExams()

  const pages: SearchItem[] = useMemo(
    () => [
      { id: 'page-dash', category: 'navigation', title: t('nav.dashboard'), icon: LayoutDashboard, path: '/' },
      { id: 'page-stud', category: 'navigation', title: t('nav.students'), icon: Users, path: '/students' },
      { id: 'page-att', category: 'navigation', title: t('nav.attendance'), icon: CalendarCheck, path: '/attendance' },
      { id: 'page-time', category: 'navigation', title: t('nav.timetable'), icon: Clock, path: '/timetable' },
      { id: 'page-asn', category: 'navigation', title: t('nav.assignments'), icon: FileText, path: '/assignments' },
      { id: 'page-exam', category: 'navigation', title: t('nav.exams'), icon: ClipboardList, path: '/exams' },
      { id: 'page-res', category: 'navigation', title: t('nav.results'), icon: Award, path: '/results' },
      { id: 'page-fees', category: 'navigation', title: t('nav.fees'), icon: Banknote, path: '/fees' },
      { id: 'page-cal', category: 'navigation', title: t('nav.calendar'), icon: Calendar, path: '/calendar' },
      { id: 'page-msg', category: 'navigation', title: t('nav.parent'), icon: MessageSquare, path: '/messages' },
      { id: 'page-set', category: 'navigation', title: t('nav.settings'), icon: Settings, path: '/settings' },
    ],
    [t],
  )

  const results: SearchItem[] = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      // When empty, show quick jump pages
      return pages
    }

    const items: SearchItem[] = []

    // 1. Matched navigation pages
    for (const p of pages) {
      if (p.title.toLowerCase().includes(q)) {
        items.push(p)
      }
    }

    // 2. Matched students
    for (const s of studentsQuery.data ?? []) {
      const matchName = s.full_name?.toLowerCase().includes(q)
      const matchRoll = s.roll_no?.toLowerCase().includes(q)
      const matchClass = s.class_name?.toLowerCase().includes(q)
      if (matchName || matchRoll || matchClass) {
        items.push({
          id: `student-${s.id}`,
          category: 'students',
          title: s.full_name,
          subtitle: `${s.class_name ?? ''} ${s.roll_no ? `· Roll ${s.roll_no}` : ''}`.trim(),
          icon: Users,
          path: `/students/${s.id}`,
        })
      }
    }

    // 3. Matched invoices
    for (const inv of invoicesQuery.data ?? []) {
      const matchNo = inv.invoice_no?.toLowerCase().includes(q)
      const matchStudent = inv.student_name?.toLowerCase().includes(q)
      if (matchNo || matchStudent) {
        items.push({
          id: `invoice-${inv.id}`,
          category: 'invoices',
          title: inv.invoice_no,
          subtitle: `${inv.student_name ?? ''} · ${formatTaka(inv.amount)}`,
          icon: Banknote,
          path: '/fees',
        })
      }
    }

    // 4. Matched exams
    for (const ex of examsQuery.data ?? []) {
      const matchName = ex.name?.toLowerCase().includes(q)
      const matchSubject = ex.subject_name?.toLowerCase().includes(q)
      if (matchName || matchSubject) {
        items.push({
          id: `exam-${ex.id}`,
          category: 'exams',
          title: ex.name,
          subtitle: ex.subject_name ?? undefined,
          icon: ClipboardList,
          path: '/exams',
        })
      }
    }

    return items.slice(0, 15) // Top 15 matches for quick scanning
  }, [query, pages, studentsQuery.data, invoicesQuery.data, examsQuery.data])

  const handleClose = useCallback(() => {
    setQuery('')
    setActiveIndex(0)
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((prev) => (prev + 1) % (results.length || 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((prev) => (prev - 1 + results.length) % (results.length || 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (results[activeIndex]) {
          navigate(results[activeIndex].path)
          handleClose()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, results, activeIndex, navigate, handleClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal
      className="fixed inset-0 z-[110] flex items-start justify-center bg-[rgba(15,23,42,0.4)] p-4 pt-16 sm:pt-24"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Search header */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
          <Search size={18} className="text-fg-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIndex(0)
            }}
            placeholder={t('search.placeholder')}
            className="w-full bg-transparent text-sm text-fg-1 outline-none placeholder:text-fg-4"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="grid h-6 w-6 place-items-center rounded text-fg-3 hover:bg-neutral-100"
            >
              <X size={14} />
            </button>
          )}
          <kbd className="hidden rounded border border-border bg-app px-2 py-0.5 text-[11px] font-medium text-fg-3 sm:inline-block">
            {t('search.shortcutHint')}
          </kbd>
        </div>

        {/* Results list */}
        <div className="flex-1 overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="py-10 text-center text-sm text-fg-3">
              {t('search.noResults', { query })}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {results.map((item, idx) => {
                const Icon = item.icon
                const isActive = idx === activeIndex
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      navigate(item.path)
                      onClose()
                    }}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      isActive ? 'bg-primary text-white' : 'text-fg-2 hover:bg-neutral-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${
                          isActive ? 'bg-white/20 text-white' : 'bg-app text-fg-2'
                        }`}
                      >
                        <Icon size={16} />
                      </span>
                      <div className="truncate">
                        <div className={`truncate text-sm font-medium ${isActive ? 'text-white' : 'text-fg-1'}`}>
                          {item.title}
                        </div>
                        {item.subtitle && (
                          <div className={`truncate text-xs ${isActive ? 'text-white/80' : 'text-fg-3'}`}>
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] uppercase tracking-wider ${
                          isActive ? 'text-white/70' : 'text-fg-4'
                        }`}
                      >
                        {t(`search.${item.category}`)}
                      </span>
                      {isActive && <ArrowRight size={14} className="text-white shrink-0" />}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center justify-between border-t border-border bg-neutral-50 px-4 py-2.5 text-xs text-fg-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-surface px-1 py-0.5 text-[10px]">↑</kbd>
              <kbd className="rounded border border-border bg-surface px-1 py-0.5 text-[10px]">↓</kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 text-[10px]">↵</kbd>
              <span>select</span>
            </span>
          </div>
          <div>EduOS Command</div>
        </div>
      </div>
    </div>
  )
}
