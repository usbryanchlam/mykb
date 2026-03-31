'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { Loader2, Minus, Plus, RefreshCw, ShieldAlert } from 'lucide-react'
import DOMPurify from 'isomorphic-dompurify'
import { getReaderContent, rescrapeBookmark } from '@/actions/bookmarks'
import { Button } from '@/components/ui/button'
import type { Bookmark } from '@mykb/shared'

interface ReaderViewProps {
  readonly bookmark: Bookmark
  readonly onRescrape: () => void
}

const FONT_SIZES = [14, 16, 18, 20, 22] as const
const DEFAULT_FONT_INDEX = 1

export function ReaderView({ bookmark, onRescrape }: ReaderViewProps) {
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fontIndex, setFontIndex] = useState(DEFAULT_FONT_INDEX)
  const [initialLoading, setInitialLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const fetchContent = useCallback(() => {
    startTransition(async () => {
      try {
        const result = await getReaderContent(bookmark.id)
        setContent(result.data.content)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load content.')
      } finally {
        setInitialLoading(false)
      }
    })
  }, [bookmark.id])

  useEffect(() => {
    if (bookmark.scrapeStatus === 'completed' && bookmark.safetyStatus !== 'flagged') {
      fetchContent()
    } else {
      setInitialLoading(false)
    }
  }, [bookmark.scrapeStatus, bookmark.safetyStatus, fetchContent])

  const handleRescrape = useCallback(() => {
    startTransition(async () => {
      try {
        await rescrapeBookmark(bookmark.id)
        onRescrape()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to rescrape.')
      }
    })
  }, [bookmark.id, onRescrape])

  const decreaseFontSize = useCallback(() => {
    setFontIndex((i) => Math.max(0, i - 1))
  }, [])

  const increaseFontSize = useCallback(() => {
    setFontIndex((i) => Math.min(FONT_SIZES.length - 1, i + 1))
  }, [])

  if (bookmark.safetyStatus === 'flagged') {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/30">
        <ShieldAlert className="size-8 text-red-500" />
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-400">Content Flagged</h3>
        <p className="max-w-md text-sm text-red-700 dark:text-red-300">
          This bookmark has been flagged for safety concerns. Reader view is not available.
        </p>
        {bookmark.safetyReasons && bookmark.safetyReasons.length > 0 && (
          <ul className="mt-2 list-inside list-disc text-left text-sm text-red-600 dark:text-red-400">
            {bookmark.safetyReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  if (bookmark.scrapeStatus === 'pending' || bookmark.scrapeStatus === 'processing') {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-6 text-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {bookmark.scrapeStatus === 'pending'
            ? 'Waiting to scrape content...'
            : 'Scraping content...'}
        </p>
      </div>
    )
  }

  if (bookmark.scrapeStatus === 'failed') {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-sm text-destructive">
          Failed to scrape content.
          {bookmark.scrapeError && (
            <span className="block mt-1 text-muted-foreground">
              {bookmark.scrapeError.length > 200
                ? `${bookmark.scrapeError.slice(0, 200)}...`
                : bookmark.scrapeError}
            </span>
          )}
        </p>
        <Button variant="outline" size="sm" onClick={handleRescrape} disabled={isPending}>
          <RefreshCw className={`size-4 ${isPending ? 'animate-spin' : ''}`} />
          Retry
        </Button>
      </div>
    )
  }

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-6">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading reader view...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">No content available.</p>
        <Button variant="outline" size="sm" onClick={handleRescrape} disabled={isPending}>
          <RefreshCw className={`size-4 ${isPending ? 'animate-spin' : ''}`} />
          Rescrape
        </Button>
      </div>
    )
  }

  const sanitizedHtml = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      'p',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'blockquote',
      'pre',
      'code',
      'em',
      'strong',
      'a',
      'img',
      'br',
      'hr',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'figure',
      'figcaption',
      'span',
      'div',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title'],
    ALLOWED_URI_REGEXP: /^https:\/\//i,
    ALLOW_DATA_ATTR: false,
  })

  // Open all links in new tab with safe rel attribute
  const safeHtml = sanitizedHtml.replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Reader View</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={decreaseFontSize}
            disabled={fontIndex === 0}
            aria-label="Decrease font size"
          >
            <Minus className="size-3" />
          </Button>
          <span className="text-xs text-muted-foreground">{FONT_SIZES[fontIndex]}px</span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={increaseFontSize}
            disabled={fontIndex === FONT_SIZES.length - 1}
            aria-label="Increase font size"
          >
            <Plus className="size-3" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleRescrape} disabled={isPending}>
            <RefreshCw className={`size-4 ${isPending ? 'animate-spin' : ''}`} />
            Rescrape
          </Button>
        </div>
      </div>

      <article
        className="prose prose-sm dark:prose-invert max-w-none overflow-hidden rounded-lg border border-border bg-card p-6 [&_figure]:max-w-full [&_img]:max-w-full [&_pre]:overflow-x-auto [&_table]:overflow-x-auto"
        style={{ fontSize: `${FONT_SIZES[fontIndex]}px` }}
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    </div>
  )
}
