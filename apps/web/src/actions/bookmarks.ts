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
  readonly tag?: string
}

function humanError(action: string, status: number): string {
  if (status === 401) return 'Please sign in to continue.'
  if (status === 403) return 'You do not have permission to perform this action.'
  if (status === 404) return 'Bookmark not found.'
  if (status >= 500) return 'Something went wrong. Please try again later.'
  return `Failed to ${action}. Please try again.`
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
  if (params.tag !== undefined) qs.set('tag', params.tag)

  const queryString = qs.toString()
  const path = queryString ? `/api/bookmarks?${queryString}` : '/api/bookmarks'
  const res = await apiFetch(path)

  if (!res.ok) {
    throw new Error(humanError('load bookmarks', res.status))
  }

  return res.json() as Promise<PaginatedResponse<Bookmark>>
}

export async function toggleFavorite(id: number): Promise<ApiResponse<Bookmark>> {
  const res = await apiFetch(`/api/bookmarks/${id}/favorite`, { method: 'PATCH' })

  if (!res.ok) {
    throw new Error(humanError('update favorite', res.status))
  }

  return res.json() as Promise<ApiResponse<Bookmark>>
}

export async function toggleArchive(id: number): Promise<ApiResponse<Bookmark>> {
  const res = await apiFetch(`/api/bookmarks/${id}/archive`, { method: 'PATCH' })

  if (!res.ok) {
    throw new Error(humanError('update archive', res.status))
  }

  return res.json() as Promise<ApiResponse<Bookmark>>
}

export interface CreateBookmarkInput {
  readonly url: string
  readonly title?: string
}

export async function createBookmark(input: CreateBookmarkInput): Promise<ApiResponse<Bookmark>> {
  const res = await apiFetch('/api/bookmarks', {
    method: 'POST',
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    if (res.status === 422) {
      const body = await res.json().catch(() => null)
      const detail = body?.errors?.[0]?.message
      throw new Error(detail ?? 'Invalid URL. Please check and try again.')
    }
    throw new Error(humanError('create bookmark', res.status))
  }

  return res.json() as Promise<ApiResponse<Bookmark>>
}

export async function getBookmark(id: number): Promise<ApiResponse<Bookmark>> {
  const res = await apiFetch(`/api/bookmarks/${id}`)

  if (!res.ok) {
    throw new Error(humanError('load bookmark', res.status))
  }

  return res.json() as Promise<ApiResponse<Bookmark>>
}

export interface UpdateBookmarkInput {
  readonly title?: string
  readonly description?: string
}

export async function updateBookmark(
  id: number,
  input: UpdateBookmarkInput,
): Promise<ApiResponse<Bookmark>> {
  const res = await apiFetch(`/api/bookmarks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    if (res.status === 422) {
      const body = await res.json().catch(() => null)
      const detail = body?.errors?.[0]?.message
      throw new Error(detail ?? 'Invalid input. Please check and try again.')
    }
    throw new Error(humanError('update bookmark', res.status))
  }

  return res.json() as Promise<ApiResponse<Bookmark>>
}

export interface ReaderContent {
  readonly content: string | null
  readonly plainText: string | null
  readonly status: string
}

export async function getReaderContent(id: number): Promise<ApiResponse<ReaderContent>> {
  const res = await apiFetch(`/api/bookmarks/${id}/reader`)

  if (res.status === 403) {
    throw new Error('Content has been flagged for safety concerns.')
  }

  if (!res.ok) {
    throw new Error(humanError('load reader content', res.status))
  }

  return res.json() as Promise<ApiResponse<ReaderContent>>
}

export async function rescrapeBookmark(id: number): Promise<ApiResponse<Bookmark>> {
  const res = await apiFetch(`/api/bookmarks/${id}/rescrape`, { method: 'POST' })

  if (res.status === 409) {
    throw new Error('Bookmark is currently being processed.')
  }

  if (!res.ok) {
    throw new Error(humanError('rescrape bookmark', res.status))
  }

  return res.json() as Promise<ApiResponse<Bookmark>>
}

export async function deleteBookmark(id: number): Promise<ApiResponse<null>> {
  const res = await apiFetch(`/api/bookmarks/${id}`, { method: 'DELETE' })

  if (!res.ok) {
    throw new Error(humanError('delete bookmark', res.status))
  }

  return res.json() as Promise<ApiResponse<null>>
}
