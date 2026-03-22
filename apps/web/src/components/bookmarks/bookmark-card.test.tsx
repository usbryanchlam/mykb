import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import type { Bookmark } from '@mykb/shared'
import type { ReactNode } from 'react'
import { BookmarkCard } from './bookmark-card'

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

function createBookmark(overrides: Partial<Bookmark> = {}): Bookmark {
  return {
    id: 1,
    userId: 1,
    url: 'https://example.com/article',
    title: 'Test Article',
    description: 'A test description',
    summary: null,
    content: null,
    plainText: null,
    faviconUrl: null,
    ogImageUrl: null,
    thumbnailKey: null,
    screenshotKey: null,
    isFavorite: false,
    isArchived: false,
    scrapeStatus: 'pending',
    aiStatus: 'pending',
    safetyStatus: 'pending',
    safetyReasons: null,
    scrapeError: null,
    aiError: null,
    createdAt: '2026-03-21T12:00:00Z',
    updatedAt: '2026-03-21T12:00:00Z',
    ...overrides,
  }
}

describe('BookmarkCard', () => {
  const handlers = {
    onToggleFavorite: vi.fn(),
    onToggleArchive: vi.fn(),
    onDelete: vi.fn(),
  }

  it('renders title', () => {
    const { container } = render(<BookmarkCard bookmark={createBookmark()} {...handlers} />)

    const h3 = container.querySelector('h3')!
    expect(h3.textContent).toBe('Test Article')
  })

  it('renders domain', () => {
    const { container } = render(<BookmarkCard bookmark={createBookmark()} {...handlers} />)

    const domainSpan = container.querySelector('.truncate')
    expect(domainSpan?.textContent).toBe('example.com')
  })

  it('renders domain as title when title is null', () => {
    const { container } = render(
      <BookmarkCard bookmark={createBookmark({ title: null })} {...handlers} />,
    )

    const h3 = container.querySelector('h3')!
    expect(h3.textContent).toBe('example.com')
  })

  it('renders description when present', () => {
    const { container } = render(<BookmarkCard bookmark={createBookmark()} {...handlers} />)

    const desc = container.querySelector('p')!
    expect(desc.textContent).toBe('A test description')
  })

  it('does not render description when null', () => {
    const { container } = render(
      <BookmarkCard bookmark={createBookmark({ description: null })} {...handlers} />,
    )

    const paragraphs = container.querySelectorAll('.line-clamp-2')
    expect(paragraphs.length).toBe(0)
  })

  it('links title to detail page', () => {
    const { container } = render(
      <BookmarkCard bookmark={createBookmark({ id: 42 })} {...handlers} />,
    )

    const link = container.querySelector('a[href="/dashboard/bookmarks/42"]')
    expect(link).toBeTruthy()
    expect(link!.querySelector('h3')!.textContent).toBe('Test Article')
  })

  it('renders url as external link', () => {
    const { container } = render(<BookmarkCard bookmark={createBookmark()} {...handlers} />)

    const extLink = container.querySelector('a[target="_blank"]')!
    expect(extLink.textContent).toBe('https://example.com/article')
    expect(extLink.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('renders favicon when https url provided', () => {
    const { container } = render(
      <BookmarkCard
        bookmark={createBookmark({ faviconUrl: 'https://example.com/icon.png' })}
        {...handlers}
      />,
    )

    const img = container.querySelector('img[src="https://example.com/icon.png"]')
    expect(img).toBeTruthy()
  })
})
