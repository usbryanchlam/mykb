'use client'

import { LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ViewMode = 'grid' | 'list'

interface ViewToggleProps {
  readonly view: ViewMode
  readonly onViewChange: (view: ViewMode) => void
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div
      className="flex items-center gap-1 rounded-lg border border-border p-0.5"
      role="group"
      aria-label="View mode"
    >
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => onViewChange('grid')}
        aria-label="Grid view"
        aria-pressed={view === 'grid'}
        className={cn(view === 'grid' && 'bg-muted')}
      >
        <LayoutGrid className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => onViewChange('list')}
        aria-label="List view"
        aria-pressed={view === 'list'}
        className={cn(view === 'list' && 'bg-muted')}
      >
        <List className="size-3.5" />
      </Button>
    </div>
  )
}
