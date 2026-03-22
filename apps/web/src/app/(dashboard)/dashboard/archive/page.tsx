'use client'

import { Archive } from 'lucide-react'
import { useBookmarks } from '@/hooks/use-bookmarks'
import { BookmarkPageLayout } from '@/components/bookmarks/bookmark-page-layout'

export default function ArchivePage() {
  const {
    bookmarks,
    meta,
    page,
    isLoading,
    error,
    lastAction,
    setPage,
    handleToggleFavorite,
    handleToggleArchive,
    handleDelete,
  } = useBookmarks({ isArchived: true })

  return (
    <BookmarkPageLayout
      title="Archive"
      loadingText="Loading archive..."
      emptyIcon={<Archive className="size-12 text-muted-foreground" />}
      emptyTitle="Archive is empty"
      emptyDescription="Archived bookmarks will appear here."
      bookmarks={bookmarks}
      meta={meta}
      page={page}
      isLoading={isLoading}
      error={error}
      lastAction={lastAction}
      onPageChange={setPage}
      onToggleFavorite={handleToggleFavorite}
      onToggleArchive={handleToggleArchive}
      onDelete={handleDelete}
    />
  )
}
