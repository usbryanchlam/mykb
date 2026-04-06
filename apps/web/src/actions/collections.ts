'use server'

import { apiFetch } from '@/lib/api-client'
import type { Collection, Bookmark, ApiResponse } from '@mykb/shared'
import type { CollectionWithCount } from '@/lib/collection-utils'

export async function listCollections(): Promise<ApiResponse<CollectionWithCount[]>> {
  const res = await apiFetch('/api/collections')
  if (!res.ok) {
    if (res.status === 401) throw new Error('Please sign in to continue.')
    throw new Error('Failed to load collections.')
  }
  return res.json() as Promise<ApiResponse<CollectionWithCount[]>>
}

export async function getCollection(id: number): Promise<ApiResponse<CollectionWithCount>> {
  const res = await apiFetch(`/api/collections/${id}`)
  if (!res.ok) {
    if (res.status === 401) throw new Error('Please sign in to continue.')
    if (res.status === 404) throw new Error('Collection not found.')
    throw new Error('Failed to load collection.')
  }
  return res.json() as Promise<ApiResponse<CollectionWithCount>>
}

export async function createCollection(data: {
  name: string
  description?: string
  icon?: string
}): Promise<ApiResponse<Collection>> {
  const res = await apiFetch('/api/collections', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    if (res.status === 422) throw new Error('Invalid collection name.')
    throw new Error('Failed to create collection.')
  }
  return res.json() as Promise<ApiResponse<Collection>>
}

export async function deleteCollection(id: number): Promise<ApiResponse<null>> {
  const res = await apiFetch(`/api/collections/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    if (res.status === 404) throw new Error('Collection not found.')
    throw new Error('Failed to delete collection.')
  }
  return res.json() as Promise<ApiResponse<null>>
}

export async function getCollectionBookmarks(id: number): Promise<ApiResponse<Bookmark[]>> {
  const res = await apiFetch(`/api/collections/${id}/bookmarks`)
  if (!res.ok) {
    if (res.status === 404) throw new Error('Collection not found.')
    throw new Error('Failed to load collection bookmarks.')
  }
  return res.json() as Promise<ApiResponse<Bookmark[]>>
}

export async function addBookmarkToCollection(
  collectionId: number,
  bookmarkId: number,
): Promise<ApiResponse<CollectionWithCount>> {
  const res = await apiFetch(`/api/collections/${collectionId}/bookmarks`, {
    method: 'POST',
    body: JSON.stringify({ bookmark_id: bookmarkId }),
  })
  if (!res.ok) {
    if (res.status === 404) throw new Error('Collection or bookmark not found.')
    throw new Error('Failed to add bookmark to collection.')
  }
  return res.json() as Promise<ApiResponse<CollectionWithCount>>
}

export async function removeBookmarkFromCollection(
  collectionId: number,
  bookmarkId: number,
): Promise<ApiResponse<null>> {
  const res = await apiFetch(`/api/collections/${collectionId}/bookmarks/${bookmarkId}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    throw new Error('Failed to remove bookmark from collection.')
  }
  return res.json() as Promise<ApiResponse<null>>
}
