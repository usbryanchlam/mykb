'use client'

import { useEffect } from 'react'
import { ShieldX } from 'lucide-react'

interface ErrorPageProps {
  readonly error: Error & { digest?: string }
  readonly reset: () => void
}

export default function DashboardErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Dashboard error:', error)
    }
  }, [error])

  const typedError = error as Error & { status?: number }
  const isForbidden =
    typedError.status === 403 ||
    error.message.includes('permission') ||
    error.message.includes('Admin access required')

  if (isForbidden) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <ShieldX className="size-16 text-destructive" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="max-w-md text-muted-foreground">
          You don&apos;t have permission to access this page. Contact your administrator if you
          believe this is an error.
        </p>
        <a
          href="/dashboard"
          className="mt-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Back to Dashboard
        </a>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <ShieldX className="size-16 text-muted-foreground" />
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="max-w-md text-muted-foreground">An error occurred while loading this page.</p>
      <div className="mt-2 flex gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Try Again
        </button>
        <a
          href="/dashboard"
          className="rounded-md border border-border px-6 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          Back to Dashboard
        </a>
      </div>
    </div>
  )
}
