'use client'

import { useState } from 'react'
import { Bookmark as BookmarkIcon, Plus } from 'lucide-react'
import { useBookmarks } from '@/hooks/use-bookmarks'
import { BookmarkPageLayout } from '@/components/bookmarks/bookmark-page-layout'
import { AddBookmarkDialog } from '@/components/bookmarks/add-bookmark-dialog'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const {
    bookmarks,
    meta,
    page,
    isLoading,
    error,
    lastAction,
    setPage,
    refresh,
    handleToggleFavorite,
    handleToggleArchive,
    handleDelete,
  } = useBookmarks({ isArchived: false })

  return (
    <>
      <BookmarkPageLayout
        title="All Bookmarks"
        loadingText="Loading bookmarks..."
        emptyIcon={<BookmarkIcon className="size-12 text-muted-foreground" />}
        emptyTitle="No bookmarks yet"
        emptyDescription="Start building your knowledge base by adding your first bookmark."
        emptyAction={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            Add Bookmark
          </Button>
        }
        headerActions={
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            Add Bookmark
          </Button>
        }
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
      <AddBookmarkDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={refresh} />
    </>
  )
}
