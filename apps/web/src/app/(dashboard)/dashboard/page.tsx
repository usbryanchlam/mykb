'use client'

import { useState } from 'react'
import { Bookmark as BookmarkIcon, Loader2 } from 'lucide-react'
import { useBookmarks } from '@/hooks/use-bookmarks'
import { BookmarkGrid } from '@/components/bookmarks/bookmark-grid'
import { BookmarkList } from '@/components/bookmarks/bookmark-list'
import { Pagination } from '@/components/bookmarks/pagination'
import { ViewToggle, type ViewMode } from '@/components/bookmarks/view-toggle'

export default function DashboardPage() {
  const [view, setView] = useState<ViewMode>('grid')
  const {
    bookmarks,
    meta,
    page,
    isLoading,
    error,
    setPage,
    handleToggleFavorite,
    handleToggleArchive,
    handleDelete,
  } = useBookmarks()

  if (isLoading && bookmarks.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading bookmarks...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <BookmarkIcon className="size-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No bookmarks yet</h2>
        <p className="max-w-sm text-muted-foreground">
          Start building your knowledge base by adding your first bookmark.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">All Bookmarks</h1>
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {view === 'grid' ? (
        <BookmarkGrid
          bookmarks={bookmarks}
          onToggleFavorite={handleToggleFavorite}
          onToggleArchive={handleToggleArchive}
          onDelete={handleDelete}
        />
      ) : (
        <BookmarkList
          bookmarks={bookmarks}
          onToggleFavorite={handleToggleFavorite}
          onToggleArchive={handleToggleArchive}
          onDelete={handleDelete}
        />
      )}

      {meta && <Pagination meta={meta} page={page} onPageChange={setPage} />}
    </div>
  )
}
