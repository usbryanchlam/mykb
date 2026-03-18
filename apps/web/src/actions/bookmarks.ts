'use server'

import { apiFetch } from '@/lib/api-client'
import type { Bookmark, PaginatedResponse, ApiResponse } from '@mykb/shared'

export interface ListBookmarksParams {
  readonly page?: number
  readonly limit?: number
  readonly sort?: string
  readonly order?: 'asc' | 'desc'
  readonly is_favorite?: boolean
  readonly is_archived?: boolean
}

export async function listBookmarks(
  params: ListBookmarksParams = {},
): Promise<PaginatedResponse<Bookmark>> {
  const qs = new URLSearchParams()
  if (params.page !== undefined) qs.set('page', String(params.page))
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.sort !== undefined) qs.set('sort', params.sort)
  if (params.order !== undefined) qs.set('order', params.order)
  if (params.is_favorite !== undefined) qs.set('is_favorite', String(params.is_favorite))
  if (params.is_archived !== undefined) qs.set('is_archived', String(params.is_archived))

  const queryString = qs.toString()
  const path = queryString ? `/api/bookmarks?${queryString}` : '/api/bookmarks'
  const res = await apiFetch(path)

  if (!res.ok) {
    throw new Error(`Failed to fetch bookmarks: ${res.status}`)
  }

  return res.json() as Promise<PaginatedResponse<Bookmark>>
}

export async function toggleFavorite(id: number): Promise<ApiResponse<Bookmark>> {
  const res = await apiFetch(`/api/bookmarks/${id}/favorite`, { method: 'PATCH' })

  if (!res.ok) {
    throw new Error(`Failed to toggle favorite: ${res.status}`)
  }

  return res.json() as Promise<ApiResponse<Bookmark>>
}

export async function toggleArchive(id: number): Promise<ApiResponse<Bookmark>> {
  const res = await apiFetch(`/api/bookmarks/${id}/archive`, { method: 'PATCH' })

  if (!res.ok) {
    throw new Error(`Failed to toggle archive: ${res.status}`)
  }

  return res.json() as Promise<ApiResponse<Bookmark>>
}

export async function deleteBookmark(id: number): Promise<ApiResponse<null>> {
  const res = await apiFetch(`/api/bookmarks/${id}`, { method: 'DELETE' })

  if (!res.ok) {
    throw new Error(`Failed to delete bookmark: ${res.status}`)
  }

  return res.json() as Promise<ApiResponse<null>>
}
