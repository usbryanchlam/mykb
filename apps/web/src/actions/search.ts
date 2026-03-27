'use server'

import { apiFetch } from '@/lib/api-client'
import type { PaginationMeta } from '@mykb/shared'

export interface SearchResult {
  readonly id: number
  readonly url: string
  readonly title: string | null
  readonly description: string | null
  readonly summary: string | null
  readonly faviconUrl: string | null
  readonly isFavorite: boolean
  readonly isArchived: boolean
  readonly createdAt: string
  readonly snippet: string
  readonly rank: number
}

export interface SearchResponse {
  readonly success: boolean
  readonly data: readonly SearchResult[]
  readonly error: string | null
  readonly meta: PaginationMeta
}

const MAX_QUERY_LENGTH = 200

export async function searchBookmarks(
  query: string,
  page: number = 1,
  limit: number = 20,
): Promise<SearchResponse> {
  if (!query.trim()) throw new Error('Please enter a search term.')
  if (query.length > MAX_QUERY_LENGTH) throw new Error('Search query is too long.')
  if (page < 1 || !Number.isInteger(page)) throw new Error('Invalid page number.')
  if (limit < 1 || limit > 100) throw new Error('Invalid limit.')

  const qs = new URLSearchParams({
    q: query,
    page: String(page),
    limit: String(limit),
  })

  const res = await apiFetch(`/api/search?${qs.toString()}`)

  if (!res.ok) {
    if (res.status === 401) throw new Error('Please sign in to continue.')
    if (res.status === 422) throw new Error('Please enter a search term.')
    throw new Error('Search failed. Please try again.')
  }

  return res.json() as Promise<SearchResponse>
}
