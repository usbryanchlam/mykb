import { auth0 } from '@/lib/auth0'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { ADMIN_EMAIL } from '@/lib/constants'

export default async function Home() {
  const session = await auth0.getSession()

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-start justify-center px-8 sm:px-16 lg:px-24">
        <div className="w-full max-w-4xl">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            Gather{' '}
            <span className="bg-gradient-to-r from-violet-600 to-purple-500 bg-clip-text text-transparent">
              knowledge
            </span>{' '}
            widely,
            <br />
            Anchor it{' '}
            <span className="bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">
              centrally.
            </span>
          </h1>

          <div className="mt-8 border-l-4 border-muted-foreground/20 pl-6">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">MyKB</h2>
            <p className="mt-2 max-w-lg text-lg text-muted-foreground">
              Your personal knowledge base for bookmarking, summarizing, and organizing web content.
            </p>
          </div>

          <div className="mt-10 rounded-lg border bg-muted/50 px-6 py-5">
            <p className="text-sm font-medium text-muted-foreground">Try the demo</p>
            <div className="mt-2 space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Email: </span>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
                  demo@example.com
                </code>
              </p>
              <p>
                <span className="text-muted-foreground">Password: </span>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
                  Demo2026!
                </code>
              </p>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Note: the demo account is read-only. For full access (add, edit, delete), please
              contact the administrator at{' '}
              <a
                href={`mailto:${ADMIN_EMAIL}`}
                className="text-primary underline hover:text-primary/80"
              >
                {ADMIN_EMAIL}
              </a>
              .
            </p>
            <a
              href="/auth/login"
              className="mt-4 inline-block rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
            >
              Try Demo
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
