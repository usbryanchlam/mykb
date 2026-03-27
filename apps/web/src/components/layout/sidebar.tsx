import { Bookmark, Star, Archive, FolderOpen, Tags, Search, Sparkles, Shield } from 'lucide-react'
import { SidebarNavItem } from '@/components/layout/sidebar-nav'

const navItems = [
  { href: '/dashboard', label: 'All Bookmarks', icon: Bookmark },
  { href: '/dashboard/favorites', label: 'Favorites', icon: Star },
  { href: '/dashboard/archive', label: 'Archive', icon: Archive },
  { href: '/dashboard/collections', label: 'Collections', icon: FolderOpen },
  { href: '/dashboard/tags', label: 'Tags', icon: Tags },
  { href: '/dashboard/smart-lists', label: 'Smart Lists', icon: Sparkles },
  { href: '/dashboard/search', label: 'Search', icon: Search },
  { href: '/dashboard/admin', label: 'Admin', icon: Shield },
] as const

export function Sidebar() {
  return (
    <aside
      aria-label="Main navigation"
      className="flex w-64 flex-col border-r border-border bg-sidebar"
    >
      <div className="px-6 py-5">
        <span className="text-lg font-semibold text-sidebar-foreground">MyKB</span>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => (
          <SidebarNavItem key={item.href} href={item.href} label={item.label} icon={item.icon} />
        ))}
      </nav>
    </aside>
  )
}
