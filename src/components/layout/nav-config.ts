import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarDays,
  FileText,
  ClipboardList,
  Award,
  Banknote,
  Calendar,
  MessagesSquare,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import type { UserRole } from '@/types/models'

export interface NavItem {
  id: string
  /** i18n key for the label */
  labelKey: string
  icon: LucideIcon
  path: string
  count?: number
  roles: UserRole[]
}

export interface NavGroup {
  /** i18n key for the section heading */
  sectionKey: string
  items: NavItem[]
}

export const NAV: NavGroup[] = [
  {
    sectionKey: 'nav.sections.teach',
    items: [
      { id: 'dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, path: '/', roles: ['owner', 'admin', 'teacher', 'parent', 'student'] },
      { id: 'students', labelKey: 'nav.students', icon: Users, path: '/students', roles: ['owner', 'admin', 'teacher'] },
      { id: 'attendance', labelKey: 'nav.attendance', icon: CalendarCheck, path: '/attendance', roles: ['owner', 'admin', 'teacher'] },
      { id: 'timetable', labelKey: 'nav.timetable', icon: CalendarDays, path: '/timetable', roles: ['owner', 'admin', 'teacher', 'parent', 'student'] },
      { id: 'assignments', labelKey: 'nav.assignments', icon: FileText, path: '/assignments', roles: ['owner', 'admin', 'teacher', 'parent', 'student'] },
      { id: 'exams', labelKey: 'nav.exams', icon: ClipboardList, path: '/exams', roles: ['owner', 'admin', 'teacher', 'parent', 'student'] },
      { id: 'results', labelKey: 'nav.results', icon: Award, path: '/results', roles: ['owner', 'admin', 'teacher', 'parent', 'student'] },
    ],
  },
  {
    sectionKey: 'nav.sections.operate',
    items: [
      // Banknote (not indian-rupee): Bangladesh / Taka, and lucide has no Taka glyph.
      { id: 'fees', labelKey: 'nav.fees', icon: Banknote, path: '/fees', roles: ['owner', 'admin', 'parent', 'student'] },
      { id: 'calendar', labelKey: 'nav.calendar', icon: Calendar, path: '/calendar', roles: ['owner', 'admin', 'teacher', 'parent', 'student'] },
      { id: 'parent', labelKey: 'nav.parent', icon: MessagesSquare, path: '/messages', roles: ['owner', 'admin', 'teacher', 'parent'] },
      { id: 'settings', labelKey: 'nav.settings', icon: Settings, path: '/settings', roles: ['owner', 'admin', 'teacher', 'parent', 'student'] },
    ],
  },
]
