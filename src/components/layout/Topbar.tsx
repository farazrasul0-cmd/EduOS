import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Menu, Search, CircleHelp, Bell, LogOut, Command } from 'lucide-react'
import { Notifications } from './Notifications'
import { LanguageToggle } from './LanguageToggle'
import { GlobalSearchModal } from './GlobalSearchModal'
import { HelpModal } from './HelpModal'
import { useNotifications } from '@/data/notifications'
import { useAuth } from '@/auth/context'
import { initials } from '@/lib/utils'

interface TopbarProps {
  /** i18n key of the current page (for the breadcrumb). */
  crumbKey: string
  onMenu: () => void
}

export function Topbar({ crumbKey, onMenu }: TopbarProps) {
  const { t } = useTranslation()
  const { profile, user, signOut } = useAuth()
  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const notificationsQuery = useNotifications()
  const unread = (notificationsQuery.data ?? []).filter((n) => !n.read).length

  const name = profile?.full_name?.trim() || user?.email || ''
  const avatarText = name ? initials(name) : '—'

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setNotifOpen(false)
        setUserOpen(false)
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <header className="flex h-[60px] items-center gap-3 border-b border-border bg-surface px-4">
      <button
        onClick={onMenu}
        className="grid h-9 w-9 place-items-center rounded-sm text-fg-2 hover:bg-neutral-100 lg:hidden"
        aria-label={t('topbar.help')}
      >
        <Menu size={20} />
      </button>

      <div className="hidden items-center gap-2 text-sm text-fg-3 md:flex">
        <span>{t('topbar.class')}</span>
        <span>/</span>
        <span className="font-medium text-fg-1">{t(crumbKey)}</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="hidden h-9 w-64 items-center justify-between rounded-md border border-border bg-app px-3 text-sm text-fg-3 transition-colors hover:border-border-strong sm:flex cursor-pointer"
        >
          <div className="flex items-center gap-2 truncate">
            <Search size={15} />
            <span className="truncate text-fg-4">{t('topbar.searchPlaceholder')}</span>
          </div>
          <kbd className="flex items-center gap-0.5 rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-mono text-fg-3">
            <Command size={10} />
            <span>K</span>
          </kbd>
        </button>

        <LanguageToggle />

        <button
          onClick={() => setHelpOpen(true)}
          className="grid h-9 w-9 place-items-center rounded-sm text-fg-2 hover:bg-neutral-100 transition-colors"
          aria-label={t('topbar.help')}
        >
          <CircleHelp size={18} />
        </button>

        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative grid h-9 w-9 place-items-center rounded-sm text-fg-2 hover:bg-neutral-100"
            aria-label={t('topbar.notifications')}
          >
            <Bell size={18} />
            {unread > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />}
          </button>
          {notifOpen && <Notifications onClose={() => setNotifOpen(false)} />}
        </div>

        {/* User menu */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => setUserOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-full bg-primary-tint text-[13px] font-semibold text-primary"
            aria-label={name}
          >
            {avatarText}
          </button>
          {userOpen && (
            <div className="absolute right-0 top-11 z-50 w-60 overflow-hidden rounded-md border border-border bg-surface shadow-md">
              <div className="border-b border-border px-4 py-3">
                <div className="truncate text-sm font-semibold text-fg-1">{name}</div>
                {user?.email && <div className="truncate text-xs text-fg-3">{user.email}</div>}
              </div>
              <button
                onClick={() => void signOut()}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-fg-2 hover:bg-neutral-100"
              >
                <LogOut size={16} />
                {t('auth.signOut')}
              </button>
            </div>
          )}
        </div>
      </div>

      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </header>
  )
}
