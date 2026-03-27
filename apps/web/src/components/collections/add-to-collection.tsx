'use client'

import { useEffect, useState, useTransition } from 'react'
import { FolderPlus } from 'lucide-react'
import {
  listCollections,
  addBookmarkToCollection,
  type CollectionWithCount,
} from '@/actions/collections'
import { Button } from '@/components/ui/button'

interface AddToCollectionProps {
  readonly bookmarkId: number
}

export function AddToCollection({ bookmarkId }: AddToCollectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [collections, setCollections] = useState<readonly CollectionWithCount[]>([])
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (isOpen) {
      startTransition(async () => {
        try {
          const res = await listCollections()
          setCollections(res.data)
        } catch {
          setError('Failed to load collections.')
        }
      })
    }
  }, [isOpen])

  function handleAdd(collectionId: number, collectionName: string) {
    setError(null)
    setMessage(null)
    startTransition(async () => {
      try {
        await addBookmarkToCollection(collectionId, bookmarkId)
        setMessage(`Added to "${collectionName}"`)
        setIsOpen(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add to collection.')
      }
    })
  }

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)} disabled={isPending}>
        <FolderPlus className="size-4" />
        Add to Collection
      </Button>

      {isOpen && (
        <div className="absolute left-0 z-10 mt-1 w-56 rounded-md border border-border bg-popover shadow-md">
          {collections.length === 0 && !isPending && (
            <p className="p-3 text-xs text-muted-foreground">No collections yet.</p>
          )}
          {collections.map((c) => (
            <button
              key={c.id}
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
              onClick={() => handleAdd(c.id, c.name)}
              disabled={isPending}
            >
              {c.name}
              <span className="ml-1 text-xs text-muted-foreground">({c.bookmarksCount})</span>
            </button>
          ))}
        </div>
      )}

      {message && <p className="mt-1 text-xs text-muted-foreground">{message}</p>}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}
