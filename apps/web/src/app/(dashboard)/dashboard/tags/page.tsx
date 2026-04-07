'use client'

import { useEffect, useState, useTransition } from 'react'
import { Tags, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { listTags, deleteTag } from '@/actions/tags'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { getTagBookmarksCount, type TagWithCount } from '@/lib/tag-utils'

export default function TagsPage() {
  const [tags, setTags] = useState<readonly TagWithCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TagWithCount | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      try {
        const res = await listTags()
        setTags(res.data)
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load tags.')
      } finally {
        setIsLoading(false)
      }
    })
  }, [])

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    const { id } = deleteTarget
    setDeleteTarget(null)
    setActionError(null)
    startTransition(async () => {
      try {
        await deleteTag(id)
        setTags(tags.filter((t) => t.id !== id))
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Failed to delete tag.')
      }
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted-foreground">Loading tags...</p>
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

  if (tags.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <Tags className="size-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No tags yet</h2>
        <p className="max-w-sm text-muted-foreground">
          Tags will appear here when you add them to bookmarks or when AI generates them
          automatically.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <h1 className="text-lg font-semibold">Tags</h1>
        {actionError && <p className="text-sm text-destructive">{actionError}</p>}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="group flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50"
            >
              <Link
                href={`/dashboard/tags/${tag.slug}`}
                className="flex min-w-0 flex-1 items-center gap-2"
              >
                <span
                  className={`inline-block size-2 rounded-full ${tag.isAiGenerated ? 'bg-purple-500' : 'bg-blue-500'}`}
                />
                <span className="truncate text-sm font-medium">{tag.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {getTagBookmarksCount(tag)}{' '}
                  {getTagBookmarksCount(tag) === 1 ? 'bookmark' : 'bookmarks'}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setDeleteTarget(tag)}
                className="ml-2 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                disabled={isPending}
                aria-label={`Delete tag ${tag.name}`}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title={deleteTarget ? `Delete tag "${deleteTarget.name}"` : ''}
        description="This will remove the tag from all bookmarks."
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}
