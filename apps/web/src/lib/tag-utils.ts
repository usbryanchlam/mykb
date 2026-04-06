import type { Tag } from '@mykb/shared'

export interface TagWithCount extends Tag {
  readonly $extras?: { readonly bookmarks_count?: string | number }
}

export function getTagBookmarksCount(tag: TagWithCount): number {
  return Number(tag.$extras?.bookmarks_count ?? 0)
}
