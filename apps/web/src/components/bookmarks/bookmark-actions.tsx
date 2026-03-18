'use client'

import { Star, Archive, Trash2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { isSafeUrl } from '@/lib/bookmark-utils'

interface BookmarkActionsProps {
  readonly isFavorite: boolean
  readonly isArchived: boolean
  readonly url: string
  readonly onToggleFavorite: () => void
  readonly onToggleArchive: () => void
  readonly onDelete: () => void
}

export function BookmarkActions({
  isFavorite,
  isArchived,
  url,
  onToggleFavorite,
  onToggleArchive,
  onDelete,
}: BookmarkActionsProps) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={(e) => {
          e.stopPropagation()
          onToggleFavorite()
        }}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Star className={cn('size-3.5', isFavorite && 'fill-yellow-400 text-yellow-400')} />
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={(e) => {
          e.stopPropagation()
          onToggleArchive()
        }}
        aria-label={isArchived ? 'Unarchive' : 'Archive'}
        title={isArchived ? 'Unarchive' : 'Archive'}
      >
        <Archive className={cn('size-3.5', isArchived && 'text-blue-500')} />
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={(e) => {
          e.stopPropagation()
          if (isSafeUrl(url)) {
            window.open(url, '_blank', 'noopener,noreferrer')
          }
        }}
        aria-label="Open in new tab"
        title="Open in new tab"
        disabled={!isSafeUrl(url)}
      >
        <ExternalLink className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={(e) => {
          e.stopPropagation()
          if (window.confirm('Delete this bookmark? This cannot be undone.')) {
            onDelete()
          }
        }}
        aria-label="Delete bookmark"
        title="Delete bookmark"
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  )
}
