import { ThemeToggle } from '@/components/layout/theme-toggle'
import { UserMenu } from '@/components/layout/user-menu'

export function DashboardHeader() {
  return (
    <header className="flex h-14 items-center justify-end gap-3 border-b border-border px-6">
      <ThemeToggle />
      <UserMenu />
    </header>
  )
}
