import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { SidebarNavItem } from './sidebar-nav'
import { Bookmark } from 'lucide-react'

const mockUsePathname = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>
      {children as React.ReactNode}
    </a>
  ),
}))

describe('SidebarNavItem', () => {
  it('renders link with label and correct href', () => {
    mockUsePathname.mockReturnValue('/other')
    const { container } = render(
      <SidebarNavItem href="/dashboard" label="All Knowledge" icon={Bookmark} />,
    )
    const link = container.querySelector('a')
    expect(link).toHaveAttribute('href', '/dashboard')
    expect(link).toHaveTextContent('All Knowledge')
  })

  it('applies active styles when pathname matches', () => {
    mockUsePathname.mockReturnValue('/dashboard')
    const { container } = render(
      <SidebarNavItem href="/dashboard" label="All Knowledge" icon={Bookmark} />,
    )
    const link = container.querySelector('a')
    expect(link?.className).toContain('bg-accent')
    expect(link?.className).not.toContain('text-muted-foreground')
  })

  it('applies inactive styles when pathname does not match', () => {
    mockUsePathname.mockReturnValue('/dashboard/favorites')
    const { container } = render(
      <SidebarNavItem href="/dashboard" label="All Knowledge" icon={Bookmark} />,
    )
    const link = container.querySelector('a')
    expect(link?.className).toContain('text-muted-foreground')
    expect(link?.className).not.toContain('bg-accent text-accent-foreground')
  })
})
