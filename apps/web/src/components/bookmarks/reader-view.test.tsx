import { describe, expect, it, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import type { Bookmark } from '@mykb/shared'
import { ReaderView } from './reader-view'

vi.mock('@/actions/bookmarks', () => ({
  getReaderContent: vi.fn(),
  rescrapeBookmark: vi.fn(),
  updateBookmarkContent: vi.fn(),
}))

function createBookmark(overrides: Partial<Bookmark> = {}): Bookmark {
  return {
    id: 1,
    userId: 1,
    url: 'https://example.com',
    title: 'Test',
    description: null,
    summary: null,
    content: null,
    plainText: null,
    faviconUrl: null,
    ogImageUrl: null,
    thumbnailKey: null,
    thumbnailUrl: null,
    screenshotKey: null,
    isFavorite: false,
    isArchived: false,
    scrapeStatus: 'pending',
    aiStatus: 'pending',
    safetyStatus: 'pending',
    safetyReasons: null,
    scrapeError: null,
    aiError: null,
    tags: [],
    createdAt: '2026-03-21T12:00:00Z',
    updatedAt: '2026-03-21T12:00:00Z',
    ...overrides,
  }
}

describe('ReaderView', () => {
  it('renders flagged warning when safetyStatus is flagged', () => {
    const { container } = render(
      <ReaderView
        bookmark={createBookmark({
          safetyStatus: 'flagged',
          safetyReasons: ['Malware detected'],
        })}
        onRescrape={vi.fn()}
      />,
    )

    expect(container.textContent).toContain('Content Flagged')
    expect(container.textContent).toContain('Malware detected')
  })

  it('renders pending state when scrapeStatus is pending', () => {
    const { container } = render(
      <ReaderView bookmark={createBookmark({ scrapeStatus: 'pending' })} onRescrape={vi.fn()} />,
    )

    expect(container.textContent).toContain('Waiting to scrape')
  })

  it('renders processing state when scrapeStatus is processing', () => {
    const { container } = render(
      <ReaderView bookmark={createBookmark({ scrapeStatus: 'processing' })} onRescrape={vi.fn()} />,
    )

    expect(container.textContent).toContain('Scraping content')
  })

  it('renders failed state with retry button when scrapeStatus is failed', () => {
    const { container } = render(
      <ReaderView
        bookmark={createBookmark({
          scrapeStatus: 'failed',
          scrapeError: 'Connection refused',
        })}
        onRescrape={vi.fn()}
      />,
    )

    expect(container.textContent).toContain('Failed to scrape')
    expect(container.textContent).toContain('Connection refused')
    const retryBtn = container.querySelector('button[data-slot="button"]')
    expect(retryBtn).toBeTruthy()
  })

  it('shows "Add content manually" button when scrape failed', () => {
    const { container } = render(
      <ReaderView bookmark={createBookmark({ scrapeStatus: 'failed' })} onRescrape={vi.fn()} />,
    )

    expect(container.textContent).toContain('Add content manually')
  })

  it('shows textarea when "Add content manually" is clicked on failed scrape', () => {
    const { container } = render(
      <ReaderView bookmark={createBookmark({ scrapeStatus: 'failed' })} onRescrape={vi.fn()} />,
    )

    const addBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Add content manually'),
    )
    expect(addBtn).toBeTruthy()
    fireEvent.click(addBtn!)

    const textarea = container.querySelector('textarea')
    expect(textarea).toBeTruthy()
    expect(textarea?.placeholder).toContain('Paste the article content')
  })

  it('shows Save and Cancel buttons when manual input is visible', () => {
    const { container } = render(
      <ReaderView bookmark={createBookmark({ scrapeStatus: 'failed' })} onRescrape={vi.fn()} />,
    )

    const addBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Add content manually'),
    )
    fireEvent.click(addBtn!)

    expect(container.textContent).toContain('Save')
    expect(container.textContent).toContain('Cancel')
  })

  it('hides textarea when Cancel is clicked', () => {
    const { container } = render(
      <ReaderView bookmark={createBookmark({ scrapeStatus: 'failed' })} onRescrape={vi.fn()} />,
    )

    const addBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Add content manually'),
    )
    fireEvent.click(addBtn!)
    expect(container.querySelector('textarea')).toBeTruthy()

    const cancelBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Cancel'),
    )
    fireEvent.click(cancelBtn!)
    expect(container.querySelector('textarea')).toBeNull()
  })

  it('renders safety reasons as list items when flagged', () => {
    const { container } = render(
      <ReaderView
        bookmark={createBookmark({
          safetyStatus: 'flagged',
          safetyReasons: ['Phishing', 'Malware'],
        })}
        onRescrape={vi.fn()}
      />,
    )

    const items = container.querySelectorAll('li')
    expect(items.length).toBe(2)
    expect(items[0].textContent).toBe('Phishing')
    expect(items[1].textContent).toBe('Malware')
  })
})
