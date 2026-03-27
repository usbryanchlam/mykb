import { SearchBar } from '@/components/search/search-bar'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { UserMenu } from '@/components/layout/user-menu'

export function DashboardHeader() {
  return (
    <header
      aria-label="Application header"
      className="flex h-14 items-center justify-between gap-3 border-b border-border px-6"
    >
      <SearchBar />
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
