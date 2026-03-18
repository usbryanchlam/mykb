'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PaginationMeta } from '@mykb/shared'
import { Button } from '@/components/ui/button'

interface PaginationProps {
  readonly meta: PaginationMeta
  readonly page: number
  readonly onPageChange: (page: number) => void
}

export function Pagination({ meta, page, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(meta.total / meta.limit)

  if (totalPages <= 1) return null

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2 pt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" />
        <span>Previous</span>
      </Button>

      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <span>Next</span>
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  )
}
