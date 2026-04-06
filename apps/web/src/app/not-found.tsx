import { FileQuestion } from 'lucide-react'
import Link from 'next/link'
import { ADMIN_EMAIL } from '@/lib/constants'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <main className="flex flex-col items-center gap-4 px-4 text-center">
        <FileQuestion className="size-16 text-muted-foreground" />
        <h1 className="text-4xl font-bold">Page Not Found</h1>
        <p className="max-w-lg text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. If you believe this
          is an error, please contact the administrator at{' '}
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
      </main>
    </div>
  )
}
