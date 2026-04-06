import type { Collection } from '@mykb/shared'

export interface CollectionWithCount extends Collection {
  readonly $extras?: { readonly bookmarks_count?: string | number }
}

export function getBookmarksCount(collection: CollectionWithCount): number {
  return Number(collection.$extras?.bookmarks_count ?? 0)
}
