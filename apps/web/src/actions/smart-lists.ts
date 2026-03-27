'use server'

import { apiFetch } from '@/lib/api-client'
import type { SmartList, FilterQuery, Bookmark, ApiResponse, PaginatedResponse } from '@mykb/shared'

export async function listSmartLists(): Promise<ApiResponse<SmartList[]>> {
  const res = await apiFetch('/api/smart-lists')
  if (!res.ok) {
    if (res.status === 401) throw new Error('Please sign in to continue.')
    throw new Error('Failed to load smart lists.')
  }
  return res.json() as Promise<ApiResponse<SmartList[]>>
}

export async function getSmartList(id: number): Promise<ApiResponse<SmartList>> {
  const res = await apiFetch(`/api/smart-lists/${id}`)
  if (!res.ok) {
    if (res.status === 404) throw new Error('Smart list not found.')
    throw new Error('Failed to load smart list.')
  }
  return res.json() as Promise<ApiResponse<SmartList>>
}

export async function createSmartList(data: {
  name: string
  description?: string
  filter_query: FilterQuery
}): Promise<ApiResponse<SmartList>> {
  const res = await apiFetch('/api/smart-lists', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    if (res.status === 422) throw new Error('Invalid smart list data.')
    throw new Error('Failed to create smart list.')
  }
  return res.json() as Promise<ApiResponse<SmartList>>
}

export async function deleteSmartList(id: number): Promise<ApiResponse<null>> {
  const res = await apiFetch(`/api/smart-lists/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete smart list.')
  return res.json() as Promise<ApiResponse<null>>
}

export async function resolveSmartListBookmarks(
  id: number,
  page: number = 1,
): Promise<PaginatedResponse<Bookmark>> {
  const res = await apiFetch(`/api/smart-lists/${id}/bookmarks?page=${page}`)
  if (!res.ok) {
    if (res.status === 404) throw new Error('Smart list not found.')
    throw new Error('Failed to load bookmarks.')
  }
  return res.json() as Promise<PaginatedResponse<Bookmark>>
}
