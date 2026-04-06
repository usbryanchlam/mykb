import { ShieldX } from 'lucide-react'
import Link from 'next/link'
import { ADMIN_EMAIL } from '@/lib/constants'

export default async function AuthErrorPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <main className="flex flex-col items-center gap-4 px-4 text-center">
        <ShieldX className="size-16 text-destructive" />
        <h1 className="text-3xl font-bold">Unable to Sign In</h1>
        <p className="max-w-lg text-muted-foreground">
          This app is available to invited users only. If you&apos;d like access, please contact the
          administrator at{' '}
          <a
            href={`mailto:${ADMIN_EMAIL}`}
            className="text-primary underline hover:text-primary/80"
          >
            {ADMIN_EMAIL}
          </a>
          .
        </p>
        <p className="max-w-lg text-sm text-muted-foreground">
          You can also try the demo account — credentials are on the home page.
        </p>
        {error && process.env.NODE_ENV !== 'production' && (
          <p className="mt-1 text-xs text-muted-foreground/60">Error code: {error}</p>
        )}
        <div className="mt-4 flex gap-3">
          <Link
            href="/"
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Back to Home
          </Link>
          <Link
            href="/auth/login"
            className="rounded-md border border-border px-6 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            Try Again
          </Link>
        </div>
      </main>
    </div>
  )
}
