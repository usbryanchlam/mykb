'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import type { Bookmark } from '@mykb/shared'
import { useAuth } from '@/hooks/use-auth'
import { getBookmark, toggleFavorite, toggleArchive, deleteBookmark } from '@/actions/bookmarks'
import { BookmarkDetail } from '@/components/bookmarks/bookmark-detail'

export default function BookmarkDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { role } = useAuth()

  const [bookmark, setBookmark] = useState<Bookmark | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const bookmarkId = Number(params.id)
  const canEdit = role === 'admin' || role === 'editor'

  const fetchBookmark = useCallback(() => {
    if (Number.isNaN(bookmarkId) || bookmarkId <= 0) {
      setError('Invalid bookmark ID.')
      setInitialLoading(false)
      return
    }

    startTransition(async () => {
      try {
        const result = await getBookmark(bookmarkId)
        setBookmark(result.data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load bookmark.')
      } finally {
        setInitialLoading(false)
      }
    })
  }, [bookmarkId])

  useEffect(() => {
    fetchBookmark()
  }, [fetchBookmark])

  const handleToggleFavorite = useCallback(() => {
    startTransition(async () => {
      try {
        await toggleFavorite(bookmarkId)
        fetchBookmark()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to toggle favorite.')
      }
    })
  }, [bookmarkId, fetchBookmark])

  const handleToggleArchive = useCallback(() => {
    startTransition(async () => {
      try {
        await toggleArchive(bookmarkId)
        fetchBookmark()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to toggle archive.')
      }
    })
  }, [bookmarkId, fetchBookmark])

  const handleDelete = useCallback(() => {
    startTransition(async () => {
      try {
        await deleteBookmark(bookmarkId)
        router.push('/dashboard')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete bookmark.')
      }
    })
  }, [bookmarkId, router])

  if (initialLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading bookmark...</p>
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

  if (!bookmark) {
    return null
  }

  return (
    <BookmarkDetail
      bookmark={bookmark}
      canEdit={canEdit}
      onToggleFavorite={handleToggleFavorite}
      onToggleArchive={handleToggleArchive}
      onDelete={handleDelete}
      onRescrape={fetchBookmark}
    />
  )
}
