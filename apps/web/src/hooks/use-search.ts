'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import type { PaginationMeta } from '@mykb/shared'
import { searchBookmarks, type SearchResult } from '@/actions/search'

const DEBOUNCE_MS = 300

interface UseSearchResult {
  readonly query: string
  readonly results: readonly SearchResult[]
  readonly meta: PaginationMeta | null
  readonly page: number
  readonly isLoading: boolean
  readonly error: string | null
  readonly setQuery: (query: string) => void
  readonly setPage: (page: number) => void
}

export function useSearch(initialQuery: string = ''): UseSearchResult {
  const [query, setQueryState] = useState(initialQuery)
  const [results, setResults] = useState<readonly SearchResult[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pageRef = useRef(1)

  const executeSearch = useCallback((searchQuery: string, searchPage: number) => {
    if (!searchQuery.trim()) {
      setResults([])
      setMeta(null)
      setError(null)
      return
    }

    startTransition(async () => {
      try {
        const res = await searchBookmarks(searchQuery, searchPage)
        setResults(res.data)
        setMeta(res.meta)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed.')
        setResults([])
        setMeta(null)
      }
    })
  }, [])

  // Reset page and debounce search when query changes
  const setQuery = useCallback(
    (newQuery: string) => {
      setQueryState(newQuery)
      setPage(1)
      pageRef.current = 1

      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(() => {
        executeSearch(newQuery, 1)
      }, DEBOUNCE_MS)
    },
    [executeSearch],
  )

  // Execute search on page change (not on query change — that's handled by setQuery)
  useEffect(() => {
    if (pageRef.current !== page) {
      pageRef.current = page
      executeSearch(query, page)
    }
  }, [page, query, executeSearch])

  // Initial search on mount if query is provided
  useEffect(() => {
    if (initialQuery.trim()) {
      executeSearch(initialQuery, 1)
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return {
    query,
    results,
    meta,
    page,
    isLoading: isPending,
    error,
    setQuery,
    setPage,
  }
}
