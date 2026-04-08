'use client'

import { useState, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import type { Bookmark, PaginationMeta } from '@mykb/shared'
import { BookmarkGrid } from '@/components/bookmarks/bookmark-grid'
import { BookmarkList } from '@/components/bookmarks/bookmark-list'
import { Pagination } from '@/components/bookmarks/pagination'
import { ViewToggle, type ViewMode } from '@/components/bookmarks/view-toggle'

interface BookmarkPageLayoutProps {
  readonly title: string
  readonly loadingText: string
  readonly emptyIcon: ReactNode
  readonly emptyTitle: string
  readonly emptyDescription: string
  readonly emptyAction?: ReactNode
  readonly headerActions?: ReactNode
  readonly bookmarks: readonly Bookmark[]
  readonly meta: PaginationMeta | null
  readonly page: number
  readonly isLoading: boolean
  readonly error: string | null
  readonly lastAction: string | null
  readonly onPageChange: (page: number) => void
  readonly canEdit?: boolean
  readonly onToggleFavorite: (id: number) => void
  readonly onToggleArchive: (id: number) => void
  readonly onDelete: (id: number) => void
}

export function BookmarkPageLayout({
  title,
  loadingText,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyAction,
  headerActions,
  bookmarks,
  meta,
  page,
  isLoading,
  error,
  lastAction,
  canEdit = true,
  onPageChange,
  onToggleFavorite,
  onToggleArchive,
  onDelete,
}: BookmarkPageLayoutProps) {
  const [view, setView] = useState<ViewMode>('grid')

  if (isLoading && bookmarks.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{loadingText}</p>
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
        {emptyIcon}
        <h2 className="text-xl font-semibold">{emptyTitle}</h2>
        <p className="max-w-sm text-muted-foreground">{emptyDescription}</p>
        {emptyAction}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{title}</h1>
        <div className="flex items-center gap-2">
          <ViewToggle view={view} onViewChange={setView} />
          {headerActions}
        </div>
      </div>

      {lastAction && <p className="text-sm text-muted-foreground">{lastAction}</p>}

      {view === 'grid' ? (
        <BookmarkGrid
          bookmarks={bookmarks}
          canEdit={canEdit}
          onToggleFavorite={onToggleFavorite}
          onToggleArchive={onToggleArchive}
          onDelete={onDelete}
        />
      ) : (
        <BookmarkList
          bookmarks={bookmarks}
          canEdit={canEdit}
          onToggleFavorite={onToggleFavorite}
          onToggleArchive={onToggleArchive}
          onDelete={onDelete}
        />
      )}

      {meta && <Pagination meta={meta} page={page} onPageChange={onPageChange} />}
    </div>
  )
}
