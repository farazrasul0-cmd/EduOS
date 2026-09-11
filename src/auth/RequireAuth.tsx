import type { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from './context'
import type { UserRole } from '@/types/models'

function FullScreenLoader() {
  return (
    <div className="grid h-screen place-items-center bg-app">
      <Loader2 className="animate-spin text-primary" size={28} />
    </div>
  )
}

/** Gate for the main app: requires a session AND a school (else onboarding). */
export function RequireAuth() {
  const { loading, session, profile } = useAuth()
  if (loading) return <FullScreenLoader />
  if (!session) return <Navigate to="/login" replace />
  if (!profile?.school_id) return <Navigate to="/onboarding" replace />
  return <Outlet />
}

/** Route-level authorization. RLS remains the source of truth for data. */
export function RequireRole({ roles }: { roles: UserRole[] }) {
  const { loading, profile } = useAuth()
  if (loading) return <FullScreenLoader />
  if (!profile || !roles.includes(profile.role)) return <Navigate to="/" replace />
  return <Outlet />
}

/** For /login: bounce already-authenticated users onward. */
export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { loading, session, profile } = useAuth()
  if (loading) return <FullScreenLoader />
  if (session) return <Navigate to={profile?.school_id ? '/' : '/onboarding'} replace />
  return <>{children}</>
}

/** For /onboarding: requires a session; bounce out if a school already exists. */
export function RequireOnboarding({ children }: { children: ReactNode }) {
  const { loading, session, profile } = useAuth()
  if (loading) return <FullScreenLoader />
  if (!session) return <Navigate to="/login" replace />
  if (profile?.school_id) return <Navigate to="/" replace />
  return <>{children}</>
}
