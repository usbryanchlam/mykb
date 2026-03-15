import { auth0 } from '@/lib/auth0'
import { redirect } from 'next/navigation'

export default async function Home() {
  const session = await auth0.getSession()

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <main className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight">MyKB</h1>
        <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
          Your personal knowledge base for bookmarking, summarizing, and organizing web content.
        </p>
        <a
          href="/auth/login"
          className="rounded-full bg-foreground px-6 py-3 text-background transition-colors hover:bg-zinc-700 dark:hover:bg-zinc-300"
        >
          Sign in with Google
        </a>
      </main>
    </div>
  )
}
