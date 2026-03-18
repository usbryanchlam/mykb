'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import type { Bookmark, PaginationMeta } from '@mykb/shared'
import { PAGINATION } from '@mykb/shared'
import {
  listBookmarks,
  toggleFavorite,
  toggleArchive,
  deleteBookmark,
  type ListBookmarksParams,
} from '@/actions/bookmarks'

interface UseBookmarksOptions {
  readonly isFavorite?: boolean
  readonly isArchived?: boolean
}

interface UseBookmarksResult {
  readonly bookmarks: readonly Bookmark[]
  readonly meta: PaginationMeta | null
  readonly page: number
  readonly isLoading: boolean
  readonly error: string | null
  readonly setPage: (page: number) => void
  readonly refresh: () => void
  readonly handleToggleFavorite: (id: number) => void
  readonly handleToggleArchive: (id: number) => void
  readonly handleDelete: (id: number) => void
}

export function useBookmarks(options: UseBookmarksOptions = {}): UseBookmarksResult {
  const [bookmarks, setBookmarks] = useState<readonly Bookmark[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [initialLoading, setInitialLoading] = useState(true)

  const fetchBookmarks = useCallback(() => {
    const params: ListBookmarksParams = {
      page,
      limit: PAGINATION.DEFAULT_LIMIT,
      sort: 'created_at',
      order: 'desc',
      ...(options.isFavorite !== undefined && { is_favorite: options.isFavorite }),
      ...(options.isArchived !== undefined && { is_archived: options.isArchived }),
    }

    startTransition(async () => {
      try {
        const result = await listBookmarks(params)
        setBookmarks(result.data)
        setMeta(result.meta)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch bookmarks')
      } finally {
        setInitialLoading(false)
      }
    })
  }, [page, options.isFavorite, options.isArchived])

  useEffect(() => {
    fetchBookmarks()
  }, [fetchBookmarks])

  const handleToggleFavorite = useCallback(
    (id: number) => {
      setError(null)
      startTransition(async () => {
        try {
          await toggleFavorite(id)
          fetchBookmarks()
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to toggle favorite')
        }
      })
    },
    [fetchBookmarks],
  )

  const handleToggleArchive = useCallback(
    (id: number) => {
      setError(null)
      startTransition(async () => {
        try {
          await toggleArchive(id)
          fetchBookmarks()
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to toggle archive')
        }
      })
    },
    [fetchBookmarks],
  )

  const handleDelete = useCallback(
    (id: number) => {
      setError(null)
      startTransition(async () => {
        try {
          await deleteBookmark(id)
          fetchBookmarks()
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to delete bookmark')
        }
      })
    },
    [fetchBookmarks],
  )

  return {
    bookmarks,
    meta,
    page,
    isLoading: initialLoading || isPending,
    error,
    setPage,
    refresh: fetchBookmarks,
    handleToggleFavorite,
    handleToggleArchive,
    handleDelete,
  }
}
