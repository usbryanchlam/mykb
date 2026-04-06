'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ShieldX } from 'lucide-react'
import { ADMIN_EMAIL } from '@/lib/constants'

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
        <p className="max-w-lg text-muted-foreground">
          You don&apos;t have permission to access this page. If you believe this is an error,
          please contact the administrator at{' '}
          <a
            href={`mailto:${ADMIN_EMAIL}`}
            className="text-primary underline hover:text-primary/80"
          >
            {ADMIN_EMAIL}
          </a>
          .
        </p>
        <Link
          href="/"
          className="mt-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Back to Home
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <ShieldX className="size-16 text-muted-foreground" />
      <h1 className="text-2xl font-bold">Something Went Wrong</h1>
      <p className="max-w-lg text-muted-foreground">
        The service is temporarily unavailable. If the problem persists, please contact the
        administrator at{' '}
        <a href={`mailto:${ADMIN_EMAIL}`} className="text-primary underline hover:text-primary/80">
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
    </div>
  )
}
