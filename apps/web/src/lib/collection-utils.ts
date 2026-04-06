import type { Collection } from '@mykb/shared'

export interface CollectionWithCount extends Collection {
  readonly meta?: { readonly bookmarks_count?: string | number }
}

export function getBookmarksCount(collection: CollectionWithCount): number {
  return Number(collection.meta?.bookmarks_count ?? 0)
}
