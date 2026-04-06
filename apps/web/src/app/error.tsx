'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { ADMIN_EMAIL } from '@/lib/constants'

interface ErrorPageProps {
  readonly error: Error & { digest?: string }
  readonly reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Unhandled error:', error)
    }
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <main className="flex flex-col items-center gap-4 px-4 text-center">
        <AlertTriangle className="size-16 text-destructive" />
        <h1 className="text-4xl font-bold">Something Went Wrong</h1>
        <p className="max-w-lg text-muted-foreground">
          The service is temporarily unavailable. If the problem persists, please contact the
          administrator at{' '}
          <a
            href={`mailto:${ADMIN_EMAIL}`}
            className="text-primary underline hover:text-primary/80"
          >
            {ADMIN_EMAIL}
          </a>
          .
        </p>
        <div className="mt-2 flex gap-3">
          <button
            onClick={reset}
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="rounded-md border border-border px-6 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  )
}
