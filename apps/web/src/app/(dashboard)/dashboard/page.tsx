'use client'

import { useState } from 'react'
import { Bookmark as BookmarkIcon, Plus } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useBookmarks } from '@/hooks/use-bookmarks'
import { BookmarkPageLayout } from '@/components/bookmarks/bookmark-page-layout'
import { AddBookmarkDialog } from '@/components/bookmarks/add-bookmark-dialog'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const { role } = useAuth()
  const canEdit = role === 'admin' || role === 'editor'
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
        title="All Knowledge"
        loadingText="Loading knowledge..."
        emptyIcon={<BookmarkIcon className="size-12 text-muted-foreground" />}
        emptyTitle="No knowledge yet"
        emptyDescription="Start building your knowledge base by adding your first item."
        canEdit={canEdit}
        emptyAction={
          canEdit ? (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
              Add Knowledge
            </Button>
          ) : undefined
        }
        headerActions={
          canEdit ? (
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
              Add Knowledge
            </Button>
          ) : undefined
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
