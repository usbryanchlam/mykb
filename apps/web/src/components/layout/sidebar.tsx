'use client'

import { useState } from 'react'
import {
  Bookmark,
  Star,
  Archive,
  FolderOpen,
  Tags,
  Search,
  Sparkles,
  Shield,
  Menu,
  X,
} from 'lucide-react'
import { SidebarNavItem } from '@/components/layout/sidebar-nav'
import { useAuth } from '@/hooks/use-auth'

const navItems = [
  { href: '/dashboard', label: 'All Bookmarks', icon: Bookmark },
  { href: '/dashboard/favorites', label: 'Favorites', icon: Star },
  { href: '/dashboard/archive', label: 'Archive', icon: Archive },
  { href: '/dashboard/collections', label: 'Collections', icon: FolderOpen },
  { href: '/dashboard/tags', label: 'Tags', icon: Tags },
  { href: '/dashboard/smart-lists', label: 'Smart Lists', icon: Sparkles },
  { href: '/dashboard/search', label: 'Search', icon: Search },
] as const

export function Sidebar() {
  const { role } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-3 top-3 z-40 rounded-md border border-border bg-background p-1.5 md:hidden"
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        aria-controls="sidebar-nav"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="sidebar-nav"
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-sidebar transition-transform md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5">
          <span className="text-lg font-semibold text-sidebar-foreground">MyKB</span>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-md p-1 md:hidden"
            aria-label="Close navigation menu"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3" onClick={() => setIsOpen(false)}>
          {navItems.map((item) => (
            <SidebarNavItem key={item.href} href={item.href} label={item.label} icon={item.icon} />
          ))}
          {role === 'admin' && (
            <SidebarNavItem href="/dashboard/admin" label="Admin" icon={Shield} />
          )}
        </nav>
      </aside>
    </>
  )
}
