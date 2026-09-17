import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'

interface State {
  failed: boolean
  error: Error | null
}

class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { failed: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught application error', error, info.componentStack)
  }

  render() {
    return this.state.failed ? <RecoveryScreen error={this.state.error} /> : this.props.children
  }
}

function RecoveryScreen({ error }: { error: Error | null }) {
  const { t } = useTranslation()

  const handleReset = () => {
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch {}
    window.location.href = '/login'
  }

  return (
    <main className="grid min-h-screen place-items-center bg-app p-6">
      <section className="w-full max-w-md rounded-lg border border-border bg-surface p-7 text-center shadow-md">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-danger-tint text-danger">
          <AlertTriangle size={24} />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-fg-1">{t('common.appErrorTitle')}</h1>
        <p className="mt-2 text-sm text-fg-3">{t('common.appErrorBody')}</p>

        {error?.message && (
          <div className="mt-3 rounded border border-danger/30 bg-danger-tint/50 p-2.5 text-left font-mono text-xs text-danger break-words max-h-32 overflow-y-auto">
            {error.message}
          </div>
        )}

        <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Button variant="secondary" icon={<RotateCw size={16} />} onClick={() => window.location.reload()}>
            {t('common.reload')}
          </Button>
          <Button variant="primary" onClick={handleReset}>
            Reset Session &amp; Login
          </Button>
        </div>
      </section>
    </main>
  )
}

export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}
