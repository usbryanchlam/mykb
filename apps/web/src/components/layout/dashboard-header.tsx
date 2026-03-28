import { SearchBar } from '@/components/search/search-bar'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { UserMenu } from '@/components/layout/user-menu'

export function DashboardHeader() {
  return (
    <header
      aria-label="Application header"
      className="flex h-14 items-center gap-3 border-b border-border px-4 pl-12 md:pl-6"
    >
      <div className="min-w-0 flex-1">
        <SearchBar />
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
