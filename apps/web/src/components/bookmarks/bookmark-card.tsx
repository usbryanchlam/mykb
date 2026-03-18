'use client'

import type { Bookmark } from '@mykb/shared'
import { Globe } from 'lucide-react'
import { BookmarkActions } from '@/components/bookmarks/bookmark-actions'
import { getDomain, formatRelativeDate, isSafeUrl, isSafeFaviconUrl } from '@/lib/bookmark-utils'

interface BookmarkCardProps {
  readonly bookmark: Bookmark
  readonly onToggleFavorite: (id: number) => void
  readonly onToggleArchive: (id: number) => void
  readonly onDelete: (id: number) => void
}

export function BookmarkCard({
  bookmark,
  onToggleFavorite,
  onToggleArchive,
  onDelete,
}: BookmarkCardProps) {
  const domain = getDomain(bookmark.url)
  const title = bookmark.title ?? domain
  const safeHref = isSafeUrl(bookmark.url) ? bookmark.url : '#'

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
        <h3 className="truncate text-sm font-medium">{title}</h3>
        {bookmark.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{bookmark.description}</p>
        )}
      </div>

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
      </div>
    </article>
  )
}
