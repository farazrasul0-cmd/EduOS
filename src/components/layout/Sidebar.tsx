import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronsLeft, ChevronsRight } from 'lucide-react'
import { NAV } from './nav-config'
import { cn } from '@/lib/utils'
import { useAuth } from '@/auth/context'
import { useSchool } from '@/data/school'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  /** Called when a nav link is clicked (used to close the mobile drawer). */
  onNavigate?: () => void
}

export function Sidebar({ collapsed, onToggle, onNavigate }: SidebarProps) {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const { data: school } = useSchool(profile?.school_id)
  const schoolName = school?.name ?? t('app.school')

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-border bg-surface transition-[width]',
        collapsed ? 'w-[72px]' : 'w-60',
      )}
    >
      {/* Brand */}
      <div className="flex h-[60px] items-center gap-2.5 border-b border-border px-4">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary font-bold text-white">
          E
        </div>
        {!collapsed && (
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="font-semibold text-fg-1">{t('app.name')}</span>
            <span className="truncate text-[11px] text-fg-3">{schoolName}</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {NAV.map((group) => ({ ...group, items: group.items.filter((item) => profile && item.roles.includes(profile.role)) }))
          .filter((group) => group.items.length > 0)
          .map((group) => (
          <div key={group.sectionKey} className="mb-4">
            {!collapsed && (
              <div className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-fg-3">
                {t(group.sectionKey)}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onNavigate}
                  title={collapsed ? t(item.labelKey) : undefined}
                  className={({ isActive }) =>
                    cn(
                      'flex h-9 items-center gap-3 rounded-sm px-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-tint text-primary'
                        : 'text-fg-2 hover:bg-neutral-100',
                      collapsed && 'justify-center',
                    )
                  }
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && (
                    <span className="flex-1 truncate">{t(item.labelKey)}</span>
                  )}
                  {!collapsed && item.count != null && (
                    <span className="rounded-full bg-neutral-100 px-1.5 text-[11px] text-fg-3">
                      {item.count}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex h-11 items-center gap-3 border-t border-border px-4 text-sm text-fg-3 hover:bg-neutral-100"
      >
        {collapsed ? (
          <ChevronsRight size={18} />
        ) : (
          <>
            <ChevronsLeft size={18} />
            <span>{t('nav.collapse')}</span>
          </>
        )}
      </button>
    </aside>
  )
}
