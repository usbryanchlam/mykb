import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <main className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">Page not found</p>
        <Link
          href="/"
          className="rounded-full bg-foreground px-6 py-3 text-background transition-colors hover:bg-zinc-700 dark:hover:bg-zinc-300"
        >
          Go home
        </Link>
      </main>
    </div>
  )
}
