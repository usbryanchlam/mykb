'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { Loader2, Plus, Sparkles, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type { SmartList, FilterQuery } from '@mykb/shared'
import { listSmartLists, createSmartList, deleteSmartList } from '@/actions/smart-lists'
import { useAuth } from '@/hooks/use-auth'
import { FilterBuilder } from '@/components/smart-lists/filter-builder'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function SmartListsPage() {
  const { role } = useAuth()
  const canEdit = role === 'admin' || role === 'editor'
  const [smartLists, setSmartLists] = useState<readonly SmartList[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)
  const [, startTransition] = useTransition()

  const fetchLists = useCallback(() => {
    startTransition(async () => {
      try {
        const res = await listSmartLists()
        setSmartLists(res.data)
        setLoadError(null)
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load smart lists.')
      } finally {
        setIsLoading(false)
      }
    })
  }, [])

  useEffect(() => {
    fetchLists()
  }, [fetchLists])

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    const { id } = deleteTarget
    setDeleteTarget(null)
    setActionError(null)
    startTransition(async () => {
      try {
        await deleteSmartList(id)
        setSmartLists(smartLists.filter((s) => s.id !== id))
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Failed to delete.')
      }
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading smart lists...</p>
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

  if (smartLists.length === 0 && !dialogOpen) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <Sparkles className="size-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No smart lists yet</h2>
        <p className="max-w-sm text-muted-foreground">
          Create filtered views of your bookmarks based on tags, favorites, dates, and more.
        </p>
        {canEdit && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            New Smart List
          </Button>
        )}
        <CreateSmartListDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={fetchLists}
        />
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Smart Lists</h1>
          {canEdit && (
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
              New Smart List
            </Button>
          )}
        </div>
        {actionError && <p className="text-sm text-destructive">{actionError}</p>}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {smartLists.map((sl) => (
            <div
              key={sl.id}
              className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-start justify-between">
                <Link
                  href={`/dashboard/smart-lists/${sl.id}`}
                  className="flex min-w-0 flex-1 items-center gap-2"
                >
                  <Sparkles className="size-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-medium">{sl.name}</h3>
                    {sl.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {sl.description}
                      </p>
                    )}
                  </div>
                </Link>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ id: sl.id, name: sl.name })}
                    className="ml-2 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    aria-label={`Delete smart list ${sl.name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
              <FilterSummary filter={sl.filterQuery} />
            </div>
          ))}
        </div>
      </div>
      <CreateSmartListDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchLists}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title={deleteTarget ? `Delete "${deleteTarget.name}"` : ''}
        description="This smart list will be permanently deleted."
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}

function formatLocalDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function FilterSummary({ filter }: { readonly filter: FilterQuery }) {
  const parts: string[] = []
  if (filter.isFavorite === true) parts.push('favorites')
  if (filter.isFavorite === false) parts.push('non-favorites')
  if (filter.isArchived === true) parts.push('archived')
  if (filter.isArchived === false) parts.push('not archived')
  if (filter.tags && filter.tags.length > 0) parts.push(`tags: ${filter.tags.join(', ')}`)
  if (filter.dateFrom) parts.push(`from ${formatLocalDate(filter.dateFrom)}`)
  if (filter.dateTo) parts.push(`until ${formatLocalDate(filter.dateTo)}`)

  if (parts.length === 0)
    return <span className="text-xs text-muted-foreground">All bookmarks</span>

  return <span className="text-xs text-muted-foreground">{parts.join(' · ')}</span>
}

function CreateSmartListDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onSuccess: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [filterQuery, setFilterQuery] = useState<FilterQuery>({})
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function resetForm() {
    setName('')
    setDescription('')
    setFilterQuery({})
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setError(null)
    startTransition(async () => {
      try {
        await createSmartList({
          name: name.trim(),
          ...(description.trim() && { description: description.trim() }),
          filter_query: filterQuery,
        })
        resetForm()
        onOpenChange(false)
        onSuccess()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create smart list.')
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetForm()
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Smart List</DialogTitle>
          <DialogDescription>Define filters to create a dynamic bookmark view.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="sl-name">Name</Label>
            <Input
              id="sl-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Recent Favorites"
              maxLength={100}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="sl-desc">
              Description <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="sl-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short description"
              maxLength={500}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Filters</Label>
            <FilterBuilder value={filterQuery} onChange={setFilterQuery} />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
