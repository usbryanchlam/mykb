'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import type { Bookmark } from '@mykb/shared'
import { useAuth } from '@/hooks/use-auth'
import { getBookmark } from '@/actions/bookmarks'
import { BookmarkEditForm } from '@/components/bookmarks/bookmark-edit-form'

export default function BookmarkEditPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { role, isLoading: authLoading } = useAuth()

  const [bookmark, setBookmark] = useState<Bookmark | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [, startTransition] = useTransition()

  const bookmarkId = Number(params.id)
  const canEdit = role === 'admin' || role === 'editor'

  useEffect(() => {
    if (authLoading) return

    if (!canEdit) {
      router.replace(`/dashboard/bookmarks/${params.id}`)
      return
    }

    if (Number.isNaN(bookmarkId) || bookmarkId <= 0) {
      setError('Invalid ID.')
      setInitialLoading(false)
      return
    }

    startTransition(async () => {
      try {
        const result = await getBookmark(bookmarkId)
        setBookmark(result.data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load item.')
      } finally {
        setInitialLoading(false)
      }
    })
  }, [authLoading, canEdit, bookmarkId, router, params.id])

  const handleSuccess = useCallback(
    (_updated: Bookmark) => {
      router.push(`/dashboard/bookmarks/${bookmarkId}`)
    },
    [bookmarkId, router],
  )

  if (initialLoading || authLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!canEdit) {
    return null
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

  return <BookmarkEditForm bookmark={bookmark} onSuccess={handleSuccess} />
}
