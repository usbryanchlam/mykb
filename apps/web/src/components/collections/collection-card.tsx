'use client'

import { useState } from 'react'
import { FolderOpen, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface CollectionCardProps {
  readonly id: number
  readonly name: string
  readonly description: string | null
  readonly icon: string | null
  readonly bookmarksCount: number
  readonly canEdit?: boolean
  readonly onDelete: (id: number) => void
}

export function CollectionCard({
  id,
  name,
  description,
  icon,
  bookmarksCount,
  canEdit = true,
  onDelete,
}: CollectionCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <div className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50">
      <div className="flex items-start justify-between">
        <Link
          href={`/dashboard/collections/${id}`}
          className="flex min-w-0 flex-1 items-center gap-2"
        >
          <FolderOpen className="size-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <h3 className="truncate text-sm font-medium">{name}</h3>
            {description && (
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </Link>
        {canEdit && (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="ml-2 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
            aria-label={`Delete collection ${name}`}
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
      <span className="text-xs text-muted-foreground">
        {bookmarksCount} {bookmarksCount === 1 ? 'item' : 'items'}
      </span>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete "${name}"`}
        description="Items in this collection will not be deleted."
        onConfirm={() => {
          setConfirmOpen(false)
          onDelete(id)
        }}
      />
    </div>
  )
}
