'use client'

import type { Bookmark } from '@mykb/shared'
import { BookmarkCard } from '@/components/bookmarks/bookmark-card'

interface BookmarkGridProps {
  readonly bookmarks: readonly Bookmark[]
  readonly onToggleFavorite: (id: number) => void
  readonly onToggleArchive: (id: number) => void
  readonly onDelete: (id: number) => void
}

export function BookmarkGrid({
  bookmarks,
  onToggleFavorite,
  onToggleArchive,
  onDelete,
}: BookmarkGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {bookmarks.map((bookmark) => (
        <BookmarkCard
          key={bookmark.id}
          bookmark={bookmark}
          onToggleFavorite={onToggleFavorite}
          onToggleArchive={onToggleArchive}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
