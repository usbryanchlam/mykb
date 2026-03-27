'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

interface ErrorPageProps {
  readonly error: Error & { digest?: string }
  readonly reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('Unhandled error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <main className="flex flex-col items-center gap-4 px-4 text-center">
        <AlertTriangle className="size-16 text-destructive" />
        <h1 className="text-4xl font-bold">Something went wrong</h1>
        <p className="max-w-md text-muted-foreground">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
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
      </main>
    </div>
  )
}
