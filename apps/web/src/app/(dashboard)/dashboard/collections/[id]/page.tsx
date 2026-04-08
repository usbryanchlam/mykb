'use client'

import { useEffect, useState, useTransition } from 'react'
import { useParams } from 'next/navigation'
import type { Bookmark } from '@mykb/shared'
import { ArrowLeft, FolderOpen, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { getCollection, getCollectionBookmarks } from '@/actions/collections'
import { useAuth } from '@/hooks/use-auth'
import type { CollectionWithCount } from '@/lib/collection-utils'
import { toggleFavorite, toggleArchive, deleteBookmark } from '@/actions/bookmarks'
import { BookmarkGrid } from '@/components/bookmarks/bookmark-grid'
import { Button } from '@/components/ui/button'

export default function CollectionDetailPage() {
  const { role } = useAuth()
  const canEdit = role === 'admin' || role === 'editor'
  const params = useParams<{ id: string }>()
  const collectionId = Number(params.id)

  const [collection, setCollection] = useState<CollectionWithCount | null>(null)
  const [bookmarks, setBookmarks] = useState<readonly Bookmark[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function fetchData() {
    startTransition(async () => {
      try {
        const [collRes, bmRes] = await Promise.all([
          getCollection(collectionId),
          getCollectionBookmarks(collectionId),
        ])
        setCollection(collRes.data)
        setBookmarks(bmRes.data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load collection.')
      } finally {
        setIsLoading(false)
      }
    })
  }

  useEffect(() => {
    if (collectionId > 0) fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionId])

  function handleToggleFavorite(id: number) {
    startTransition(async () => {
      try {
        await toggleFavorite(id)
        fetchData()
      } catch {
        // Silently handled
      }
    })
  }

  function handleToggleArchive(id: number) {
    startTransition(async () => {
      try {
        await toggleArchive(id)
        fetchData()
      } catch {
        // Silently handled
      }
    })
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      try {
        await deleteBookmark(id)
        fetchData()
      } catch {
        // Silently handled
      }
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading collection...</p>
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
          render={<Link href="/dashboard/collections" />}
        >
          <ArrowLeft className="size-4" />
          Collections
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <FolderOpen className="size-6 text-muted-foreground" />
        <div>
          <h1 className="text-lg font-semibold">{collection?.name}</h1>
          {collection?.description && (
            <p className="text-sm text-muted-foreground">{collection.description}</p>
          )}
        </div>
      </div>

      {bookmarks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <FolderOpen className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No bookmarks in this collection yet.</p>
        </div>
      ) : (
        <BookmarkGrid
          bookmarks={bookmarks}
          canEdit={canEdit}
          onToggleFavorite={handleToggleFavorite}
          onToggleArchive={handleToggleArchive}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
