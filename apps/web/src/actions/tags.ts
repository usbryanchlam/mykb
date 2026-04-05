'use server'

import { apiFetch } from '@/lib/api-client'
import type { Tag, ApiResponse } from '@mykb/shared'

export interface TagWithCount extends Tag {
  readonly $extras?: { readonly bookmarks_count?: string | number }
}

export function getTagBookmarksCount(tag: TagWithCount): number {
  return Number(tag.$extras?.bookmarks_count ?? 0)
}

export async function listTags(): Promise<ApiResponse<TagWithCount[]>> {
  const res = await apiFetch('/api/tags')

  if (!res.ok) {
    if (res.status === 401) throw new Error('Please sign in to continue.')
    throw new Error('Failed to load tags.')
  }

  return res.json() as Promise<ApiResponse<TagWithCount[]>>
}

export async function createTag(name: string): Promise<ApiResponse<Tag>> {
  const res = await apiFetch('/api/tags', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })

  if (!res.ok) {
    if (res.status === 409) throw new Error('Tag already exists.')
    if (res.status === 422) throw new Error('Invalid tag name.')
    throw new Error('Failed to create tag.')
  }

  return res.json() as Promise<ApiResponse<Tag>>
}

export async function addTagsToBookmark(
  bookmarkId: number,
  tags: readonly string[],
): Promise<ApiResponse<Tag[]>> {
  const res = await apiFetch(`/api/bookmarks/${bookmarkId}/tags`, {
    method: 'POST',
    body: JSON.stringify({ tags }),
  })

  if (!res.ok) {
    if (res.status === 404) throw new Error('Bookmark not found.')
    throw new Error('Failed to add tags.')
  }

  return res.json() as Promise<ApiResponse<Tag[]>>
}

export async function removeTagFromBookmark(
  bookmarkId: number,
  tagId: number,
): Promise<ApiResponse<null>> {
  const res = await apiFetch(`/api/bookmarks/${bookmarkId}/tags/${tagId}`, {
    method: 'DELETE',
  })

  if (!res.ok) {
    if (res.status === 404) throw new Error('Tag or bookmark not found.')
    throw new Error('Failed to remove tag.')
  }

  return res.json() as Promise<ApiResponse<null>>
}

export async function deleteTag(id: number): Promise<ApiResponse<null>> {
  const res = await apiFetch(`/api/tags/${id}`, { method: 'DELETE' })

  if (!res.ok) {
    if (res.status === 404) throw new Error('Tag not found.')
    throw new Error('Failed to delete tag.')
  }

  return res.json() as Promise<ApiResponse<null>>
}
