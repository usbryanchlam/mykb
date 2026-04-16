'use client'

import { useEffect, useState, useTransition } from 'react'
import { useParams } from 'next/navigation'
import type { Bookmark } from '@mykb/shared'
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { getSmartList, resolveSmartListBookmarks } from '@/actions/smart-lists'
import { useAuth } from '@/hooks/use-auth'
import { toggleFavorite, toggleArchive, deleteBookmark } from '@/actions/bookmarks'
import { BookmarkGrid } from '@/components/bookmarks/bookmark-grid'
import { Pagination } from '@/components/bookmarks/pagination'
import { Button } from '@/components/ui/button'
import type { SmartList, PaginationMeta } from '@mykb/shared'

export default function SmartListDetailPage() {
  const { role } = useAuth()
  const canEdit = role === 'admin' || role === 'editor'
  const params = useParams<{ id: string }>()
  const listId = Number(params.id)

  const [smartList, setSmartList] = useState<SmartList | null>(null)
  const [bookmarks, setBookmarks] = useState<readonly Bookmark[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function fetchData(p: number = 1) {
    startTransition(async () => {
      try {
        const [listRes, bmRes] = await Promise.all([
          getSmartList(listId),
          resolveSmartListBookmarks(listId, p),
        ])
        setSmartList(listRes.data)
        setBookmarks(bmRes.data)
        setMeta(bmRes.meta)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load smart list.')
      } finally {
        setIsLoading(false)
      }
    })
  }

  useEffect(() => {
    if (listId > 0) fetchData(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId, page])

  function handleToggleFavorite(id: number) {
    startTransition(async () => {
      try {
        await toggleFavorite(id)
        fetchData(page)
      } catch {
        // Silently handled
      }
    })
  }

  function handleToggleArchive(id: number) {
    startTransition(async () => {
      try {
        await toggleArchive(id)
        fetchData(page)
      } catch {
        // Silently handled
      }
    })
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      try {
        await deleteBookmark(id)
        fetchData(page)
      } catch {
        // Silently handled
      }
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/dashboard/smart-lists" />}
        >
          <ArrowLeft className="size-4" />
          Smart Lists
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Sparkles className="size-6 text-muted-foreground" />
        <div>
          <h1 className="text-lg font-semibold">{smartList?.name}</h1>
          {smartList?.description && (
            <p className="text-sm text-muted-foreground">{smartList.description}</p>
          )}
        </div>
      </div>

      {bookmarks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <Sparkles className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No items match these filters.</p>
        </div>
      ) : (
        <>
          <BookmarkGrid
            bookmarks={bookmarks}
            canEdit={canEdit}
            onToggleFavorite={handleToggleFavorite}
            onToggleArchive={handleToggleArchive}
            onDelete={handleDelete}
          />
          {meta && <Pagination meta={meta} page={page} onPageChange={setPage} />}
        </>
      )}
    </div>
  )
}
