'use client'

import type { Bookmark } from '@mykb/shared'
import { Globe } from 'lucide-react'
import { BookmarkActions } from '@/components/bookmarks/bookmark-actions'

interface BookmarkCardProps {
  readonly bookmark: Bookmark
  readonly onToggleFavorite: (id: number) => void
  readonly onToggleArchive: (id: number) => void
  readonly onDelete: (id: number) => void
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function BookmarkCard({
  bookmark,
  onToggleFavorite,
  onToggleArchive,
  onDelete,
}: BookmarkCardProps) {
  const domain = getDomain(bookmark.url)
  const title = bookmark.title ?? domain

  return (
    <article className="group flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {bookmark.faviconUrl ? (
            <img src={bookmark.faviconUrl} alt="" className="size-4 rounded-sm" loading="lazy" />
          ) : (
            <Globe className="size-4" />
          )}
          <span className="truncate">{domain}</span>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatDate(bookmark.createdAt)}
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
          href={bookmark.url}
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
