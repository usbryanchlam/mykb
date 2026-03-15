import { auth0 } from '@/lib/auth0'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'

export default async function Home() {
  const session = await auth0.getSession()

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight">MyKB</h1>
        <p className="max-w-md text-lg text-muted-foreground">
          Your personal knowledge base for bookmarking, summarizing, and organizing web content.
        </p>
        <a
          href="/auth/login"
          className="rounded-full bg-primary px-8 py-3 text-lg font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          Sign in with Google
        </a>
      </main>
    </div>
  )
}
