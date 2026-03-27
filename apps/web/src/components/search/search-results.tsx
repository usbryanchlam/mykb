'use client'

import DOMPurify from 'isomorphic-dompurify'
import type { SearchResult } from '@/actions/search'
import { Globe } from 'lucide-react'
import Link from 'next/link'
import { getDomain, formatRelativeDate, isSafeFaviconUrl } from '@/lib/bookmark-utils'

const SNIPPET_CONFIG = { ALLOWED_TAGS: ['mark'], ALLOWED_ATTR: [] as string[] }

interface SearchResultsProps {
  readonly results: readonly SearchResult[]
}

export function SearchResults({ results }: SearchResultsProps) {
  return (
    <div className="flex flex-col gap-2">
      {results.map((result) => (
        <SearchResultCard key={result.id} result={result} />
      ))}
    </div>
  )
}

function SearchResultCard({ result }: { readonly result: SearchResult }) {
  const domain = getDomain(result.url)
  const title = result.title ?? domain

  return (
    <Link
      href={`/dashboard/bookmarks/${result.id}`}
      className="flex flex-col gap-1.5 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {isSafeFaviconUrl(result.faviconUrl) ? (
          <img src={result.faviconUrl} alt="" className="size-4 rounded-sm" loading="lazy" />
        ) : (
          <Globe className="size-4" />
        )}
        <span className="truncate">{domain}</span>
        <span className="ml-auto shrink-0">{formatRelativeDate(result.createdAt)}</span>
      </div>
      <h3 className="text-sm font-medium">{title}</h3>
      {result.snippet && (
        <p
          className="line-clamp-2 text-xs text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: sanitizeSnippet(result.snippet) }}
        />
      )}
    </Link>
  )
}

/**
 * Sanitize search snippets — only allow bare <mark> tags from FTS5.
 * Uses DOMPurify to strip all other HTML, attributes, and entities.
 */
function sanitizeSnippet(snippet: string): string {
  return DOMPurify.sanitize(snippet, SNIPPET_CONFIG)
}
