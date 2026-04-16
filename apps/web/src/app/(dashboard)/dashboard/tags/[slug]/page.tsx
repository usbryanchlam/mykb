'use client'

import { useParams } from 'next/navigation'
import { Tag } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useBookmarks } from '@/hooks/use-bookmarks'
import { BookmarkPageLayout } from '@/components/bookmarks/bookmark-page-layout'

export default function TagBookmarksPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug
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
  } = useBookmarks({ tag: slug })

  return (
    <BookmarkPageLayout
      title={`Tag: ${decodeURIComponent(slug)}`}
      loadingText="Loading knowledge..."
      emptyIcon={<Tag className="size-12 text-muted-foreground" />}
      emptyTitle="No items with this tag"
      emptyDescription="Items tagged with this tag will appear here."
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
