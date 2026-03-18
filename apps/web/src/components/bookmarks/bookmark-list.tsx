'use client'

import type { Bookmark } from '@mykb/shared'
import { Globe } from 'lucide-react'
import { BookmarkActions } from '@/components/bookmarks/bookmark-actions'

interface BookmarkListProps {
  readonly bookmarks: readonly Bookmark[]
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
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffDays < 1) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function BookmarkList({
  bookmarks,
  onToggleFavorite,
  onToggleArchive,
  onDelete,
}: BookmarkListProps) {
  return (
    <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
      {bookmarks.map((bookmark) => {
        const domain = getDomain(bookmark.url)
        const title = bookmark.title ?? domain

        return (
          <div
            key={bookmark.id}
            className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
          >
            <div className="flex shrink-0 items-center">
              {bookmark.faviconUrl ? (
                <img
                  src={bookmark.faviconUrl}
                  alt=""
                  className="size-5 rounded-sm"
                  loading="lazy"
                />
              ) : (
                <Globe className="size-5 text-muted-foreground" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-sm font-medium">{title}</h3>
                <span className="shrink-0 text-xs text-muted-foreground">{domain}</span>
              </div>
              {bookmark.description && (
                <p className="truncate text-xs text-muted-foreground">{bookmark.description}</p>
              )}
            </div>

            <span className="shrink-0 text-xs text-muted-foreground">
              {formatDate(bookmark.createdAt)}
            </span>

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
        )
      })}
    </div>
  )
}
