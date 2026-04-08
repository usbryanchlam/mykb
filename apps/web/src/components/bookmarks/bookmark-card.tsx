'use client'

import type { Bookmark } from '@mykb/shared'
import { Globe } from 'lucide-react'
import Link from 'next/link'
import { BookmarkActions } from '@/components/bookmarks/bookmark-actions'
import { StatusBadge } from '@/components/bookmarks/status-badge'
import { TagBadge } from '@/components/bookmarks/tag-badge'
import { getDomain, formatRelativeDate, isSafeUrl, isSafeFaviconUrl } from '@/lib/bookmark-utils'

interface BookmarkCardProps {
  readonly bookmark: Bookmark
  readonly canEdit?: boolean
  readonly onToggleFavorite: (id: number) => void
  readonly onToggleArchive: (id: number) => void
  readonly onDelete: (id: number) => void
}

export function BookmarkCard({
  bookmark,
  canEdit = true,
  onToggleFavorite,
  onToggleArchive,
  onDelete,
}: BookmarkCardProps) {
  const domain = getDomain(bookmark.url)
  const title = bookmark.title ?? domain
  const safeHref = isSafeUrl(bookmark.url) ? bookmark.url : '#'
  const showScrapeStatus =
    bookmark.scrapeStatus !== 'completed' && bookmark.scrapeStatus !== 'pending'
  const showSafetyStatus = bookmark.safetyStatus === 'flagged'

  return (
    <article className="group flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isSafeFaviconUrl(bookmark.faviconUrl) ? (
            <img src={bookmark.faviconUrl} alt="" className="size-4 rounded-sm" loading="lazy" />
          ) : (
            <Globe className="size-4" />
          )}
          <span className="truncate">{domain}</span>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatRelativeDate(bookmark.createdAt)}
        </span>
      </div>

      <div className="min-w-0">
        <Link href={`/dashboard/bookmarks/${bookmark.id}`} className="hover:underline">
          <h3 className="truncate text-sm font-medium">{title}</h3>
        </Link>
        {bookmark.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{bookmark.description}</p>
        )}
      </div>

      {(showScrapeStatus || showSafetyStatus) && (
        <div className="flex items-center gap-1.5">
          {showScrapeStatus && <StatusBadge status={bookmark.scrapeStatus} label="Scrape" />}
          {showSafetyStatus && <StatusBadge status={bookmark.safetyStatus} label="Safety" />}
        </div>
      )}

      {bookmark.tags && bookmark.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {bookmark.tags.slice(0, 5).map((tag) => (
            <TagBadge key={tag.id} tag={tag} />
          ))}
          {bookmark.tags.length > 5 && (
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              +{bookmark.tags.length - 5}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <a
          href={safeHref}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate text-xs text-muted-foreground hover:text-foreground hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {bookmark.url}
        </a>
        {canEdit && (
          <div className="opacity-0 transition-opacity group-hover:opacity-100">
            <BookmarkActions
              isFavorite={bookmark.isFavorite}
              isArchived={bookmark.isArchived}
              url={bookmark.url}
              onToggleFavorite={() => onToggleFavorite(bookmark.id)}
              onToggleArchive={() => onToggleArchive(bookmark.id)}
              onDelete={() => onDelete(bookmark.id)}
            />
          </div>
        )}
      </div>
    </article>
  )
}
