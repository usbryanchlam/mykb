import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { SearchResult } from '@/actions/search'
import { SearchResults } from './search-results'

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: ReactNode
    className?: string
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

function createResult(overrides: Partial<SearchResult> = {}): SearchResult {
  return {
    id: 1,
    url: 'https://example.com/article',
    title: 'Test Article',
    description: 'A test description',
    summary: null,
    faviconUrl: null,
    isFavorite: false,
    isArchived: false,
    createdAt: '2026-03-21T12:00:00Z',
    snippet: 'This is a <mark>test</mark> snippet',
    rank: -1.5,
    ...overrides,
  }
}

describe('SearchResults', () => {
  it('renders results with titles', () => {
    const results = [
      createResult({ id: 1, title: 'First Article' }),
      createResult({ id: 2, title: 'Second Article' }),
    ]
    const { container } = render(<SearchResults results={results} />)
    const headings = container.querySelectorAll('h3')
    expect(headings.length).toBe(2)
    expect(headings[0].textContent).toBe('First Article')
    expect(headings[1].textContent).toBe('Second Article')
  })

  it('links to bookmark detail page', () => {
    const results = [createResult({ id: 42 })]
    const { container } = render(<SearchResults results={results} />)
    const link = container.querySelector('a[href="/dashboard/bookmarks/42"]')
    expect(link).toBeTruthy()
  })

  it('renders snippet with highlighted marks', () => {
    const results = [createResult({ snippet: 'A <mark>highlighted</mark> term' })]
    const { container } = render(<SearchResults results={results} />)
    const mark = container.querySelector('mark')
    expect(mark).toBeTruthy()
    expect(mark?.textContent).toBe('highlighted')
  })

  it('renders domain from URL', () => {
    const results = [createResult({ url: 'https://developer.mozilla.org/guide' })]
    const { container } = render(<SearchResults results={results} />)
    expect(container.textContent).toContain('developer.mozilla.org')
  })

  it('uses domain as title when title is null', () => {
    const results = [createResult({ title: null, url: 'https://example.com/page' })]
    const { container } = render(<SearchResults results={results} />)
    const h3 = container.querySelector('h3')!
    expect(h3.textContent).toBe('example.com')
  })

  it('strips non-mark HTML from snippets', () => {
    const results = [createResult({ snippet: '<mark>safe</mark> <script>alert("xss")</script>' })]
    const { container } = render(<SearchResults results={results} />)
    const mark = container.querySelector('mark')
    expect(mark).toBeTruthy()
    const script = container.querySelector('script')
    expect(script).toBeNull()
  })

  it('strips attributes from mark tags to prevent XSS', () => {
    const results = [createResult({ snippet: '<mark onmouseover="alert(1)">term</mark>' })]
    const { container } = render(<SearchResults results={results} />)
    const mark = container.querySelector('mark')
    expect(mark).toBeTruthy()
    expect(mark?.getAttribute('onmouseover')).toBeNull()
    expect(mark?.textContent).toBe('term')
  })

  it('renders empty list for no results', () => {
    const { container } = render(<SearchResults results={[]} />)
    const links = container.querySelectorAll('a')
    expect(links.length).toBe(0)
  })
})
