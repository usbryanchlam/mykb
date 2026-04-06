'use client'

import { useEffect, useState, useTransition } from 'react'
import { FolderOpen, Plus } from 'lucide-react'
import { listCollections, deleteCollection } from '@/actions/collections'
import { getBookmarksCount, type CollectionWithCount } from '@/lib/collection-utils'
import { CollectionCard } from '@/components/collections/collection-card'
import { CreateCollectionDialog } from '@/components/collections/create-collection-dialog'
import { Button } from '@/components/ui/button'

export default function CollectionsPage() {
  const [collections, setCollections] = useState<readonly CollectionWithCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function fetchCollections() {
    startTransition(async () => {
      try {
        const res = await listCollections()
        setCollections(res.data)
        setLoadError(null)
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load collections.')
      } finally {
        setIsLoading(false)
      }
    })
  }

  useEffect(() => {
    fetchCollections()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleDelete(id: number) {
    setActionError(null)
    startTransition(async () => {
      try {
        await deleteCollection(id)
        setCollections(collections.filter((c) => c.id !== id))
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Failed to delete collection.')
      }
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted-foreground">Loading collections...</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-destructive">{loadError}</p>
      </div>
    )
  }

  if (collections.length === 0 && !dialogOpen) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <FolderOpen className="size-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No collections yet</h2>
        <p className="max-w-sm text-muted-foreground">
          Organize your bookmarks by creating collections.
        </p>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          New Collection
        </Button>
        <CreateCollectionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={fetchCollections}
        />
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Collections</h1>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            New Collection
          </Button>
        </div>
        {actionError && <p className="text-sm text-destructive">{actionError}</p>}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => (
            <CollectionCard
              key={c.id}
              id={c.id}
              name={c.name}
              description={c.description}
              icon={c.icon}
              bookmarksCount={getBookmarksCount(c)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>
      <CreateCollectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchCollections}
      />
    </>
  )
}
