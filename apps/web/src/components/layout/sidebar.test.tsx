import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Sidebar } from './sidebar'

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>
      {children as React.ReactNode}
    </a>
  ),
}))

const mockUseAuth = vi.fn()

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}))

describe('Sidebar', () => {
  it('renders MyKB logo', () => {
    mockUseAuth.mockReturnValue({ role: 'editor' })
    const { container } = render(<Sidebar />)
    expect(container).toHaveTextContent('MyKB')
  })

  it('renders seven navigation items for non-admin', () => {
    mockUseAuth.mockReturnValue({ role: 'editor' })
    const { container } = render(<Sidebar />)
    const links = container.querySelectorAll('a')
    expect(links).toHaveLength(7)
  })

  it('renders eight navigation items for admin', () => {
    mockUseAuth.mockReturnValue({ role: 'admin' })
    const { container } = render(<Sidebar />)
    const links = container.querySelectorAll('a')
    expect(links).toHaveLength(8)
  })

  it('renders correct hrefs for non-admin', () => {
    mockUseAuth.mockReturnValue({ role: 'editor' })
    const { container } = render(<Sidebar />)
    const links = container.querySelectorAll('a')
    const hrefs = Array.from(links).map((link) => link.getAttribute('href'))
    expect(hrefs).toEqual([
      '/dashboard',
      '/dashboard/favorites',
      '/dashboard/archive',
      '/dashboard/collections',
      '/dashboard/tags',
      '/dashboard/smart-lists',
      '/dashboard/search',
    ])
  })

  it('includes admin link for admin role', () => {
    mockUseAuth.mockReturnValue({ role: 'admin' })
    const { container } = render(<Sidebar />)
    const links = container.querySelectorAll('a')
    const hrefs = Array.from(links).map((link) => link.getAttribute('href'))
    expect(hrefs).toContain('/dashboard/admin')
  })

  it('does not show admin link for viewer role', () => {
    mockUseAuth.mockReturnValue({ role: 'viewer' })
    const { container } = render(<Sidebar />)
    const links = container.querySelectorAll('a')
    const hrefs = Array.from(links).map((link) => link.getAttribute('href'))
    expect(hrefs).not.toContain('/dashboard/admin')
  })

  it('renders nav item labels', () => {
    mockUseAuth.mockReturnValue({ role: 'editor' })
    const { container } = render(<Sidebar />)
    expect(container).toHaveTextContent('All Bookmarks')
    expect(container).toHaveTextContent('Favorites')
    expect(container).toHaveTextContent('Archive')
    expect(container).toHaveTextContent('Collections')
    expect(container).toHaveTextContent('Tags')
    expect(container).toHaveTextContent('Smart Lists')
    expect(container).toHaveTextContent('Search')
  })

  it('has main navigation aria-label', () => {
    mockUseAuth.mockReturnValue({ role: 'editor' })
    const { container } = render(<Sidebar />)
    const aside = container.querySelector('aside')
    expect(aside).toHaveAttribute('aria-label', 'Main navigation')
  })
})
