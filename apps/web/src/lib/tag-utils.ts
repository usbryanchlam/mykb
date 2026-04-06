import type { Tag } from '@mykb/shared'

export interface TagWithCount extends Tag {
  readonly meta?: { readonly bookmarks_count?: string | number }
}

export function getTagBookmarksCount(tag: TagWithCount): number {
  return Number(tag.meta?.bookmarks_count ?? 0)
}
