import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { OfflineBanner } from './OfflineBanner'
import { DemoBanner } from './DemoBanner'
import { NAV } from './nav-config'
import { cn } from '@/lib/utils'

function useCrumbKey(): string {
  const { pathname } = useLocation()
  const all = NAV.flatMap((g) => g.items)
  const match =
    all.find((i) => i.path === pathname) ??
    all.find((i) => i.path !== '/' && pathname.startsWith(i.path))
  return match?.labelKey ?? 'nav.dashboard'
}

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const crumbKey = useCrumbKey()

  return (
    <div className="flex h-screen overflow-hidden bg-app">
      {/* Sidebar — static on desktop, slide-in drawer on mobile */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 transition-transform lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          onNavigate={() => setMobileOpen(false)}
        />
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar crumbKey={crumbKey} onMenu={() => setMobileOpen(true)} />
        <OfflineBanner />
        <DemoBanner />
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
