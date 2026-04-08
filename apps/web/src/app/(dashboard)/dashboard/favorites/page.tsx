'use client'

import { Star } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useBookmarks } from '@/hooks/use-bookmarks'
import { BookmarkPageLayout } from '@/components/bookmarks/bookmark-page-layout'

export default function FavoritesPage() {
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
  } = useBookmarks({ isFavorite: true })

  return (
    <BookmarkPageLayout
      title="Favorites"
      loadingText="Loading favorites..."
      emptyIcon={<Star className="size-12 text-muted-foreground" />}
      emptyTitle="No favorites yet"
      emptyDescription="Star your bookmarks to find them quickly here."
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
