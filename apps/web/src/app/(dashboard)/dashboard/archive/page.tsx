'use client'

import { Archive } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useBookmarks } from '@/hooks/use-bookmarks'
import { BookmarkPageLayout } from '@/components/bookmarks/bookmark-page-layout'

export default function ArchivePage() {
  const { role } = useAuth()
  const canEdit = role === 'admin' || role === 'editor'
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
      emptyDescription="Archived items will appear here."
      canEdit={canEdit}
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
