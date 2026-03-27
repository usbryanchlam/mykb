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

describe('Sidebar', () => {
  it('renders MyKB logo', () => {
    const { container } = render(<Sidebar />)
    expect(container).toHaveTextContent('MyKB')
  })

  it('renders all seven navigation items', () => {
    const { container } = render(<Sidebar />)
    const links = container.querySelectorAll('a')
    expect(links).toHaveLength(7)
  })

  it('renders correct hrefs for all nav items', () => {
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

  it('renders nav item labels', () => {
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
    const { container } = render(<Sidebar />)
    const aside = container.querySelector('aside')
    expect(aside).toHaveAttribute('aria-label', 'Main navigation')
  })
})
