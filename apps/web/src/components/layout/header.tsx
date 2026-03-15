import { ThemeToggle } from '@/components/layout/theme-toggle'

export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4">
      <span className="text-lg font-semibold">MyKB</span>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <a
          href="/auth/login"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          Sign in
        </a>
      </div>
    </header>
  )
}
