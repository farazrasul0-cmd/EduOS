import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'

interface State {
  failed: boolean
}

class ErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught application error', error, info.componentStack)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function RecoveryScreen() {
  const { t } = useTranslation()
  return (
    <main className="grid min-h-screen place-items-center bg-app p-6">
      <section className="w-full max-w-md rounded-lg border border-border bg-surface p-7 text-center shadow-md">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-danger-tint text-danger">
          <AlertTriangle size={24} />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-fg-1">{t('common.appErrorTitle')}</h1>
        <p className="mt-2 text-sm text-fg-3">{t('common.appErrorBody')}</p>
        <Button className="mt-5" variant="primary" icon={<RotateCw size={16} />} onClick={() => window.location.reload()}>
          {t('common.reload')}
        </Button>
      </section>
    </main>
  )
}

export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary fallback={<RecoveryScreen />}>{children}</ErrorBoundary>
}
