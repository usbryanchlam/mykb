'use client'

import { useSearchParams } from 'next/navigation'
import { Loader2, Search } from 'lucide-react'
import { useSearch } from '@/hooks/use-search'
import { SearchResults } from '@/components/search/search-results'
import { Pagination } from '@/components/bookmarks/pagination'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Search</h1>
      <SearchContent key={initialQuery} initialQuery={initialQuery} />
    </div>
  )
}

function SearchContent({ initialQuery }: { readonly initialQuery: string }) {
  const { query, results, meta, page, isLoading, error, setPage } = useSearch(initialQuery)

  return (
    <>
      {isLoading && (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Searching...
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!isLoading && !error && query.trim() && results.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <Search className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No results found for &ldquo;{query}&rdquo;
          </p>
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">
            {meta?.total ?? results.length} result{(meta?.total ?? results.length) !== 1 ? 's' : ''}{' '}
            for &ldquo;{query}&rdquo;
          </p>
          <SearchResults results={results} />
          {meta && <Pagination meta={meta} page={page} onPageChange={setPage} />}
        </>
      )}

      {!query.trim() && !isLoading && (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <Search className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Type to search your bookmarks by title, description, content, or tags.
          </p>
          <p className="text-xs text-muted-foreground">
            Press <kbd className="rounded border border-border bg-muted px-1 font-mono">⌘K</kbd>{' '}
            from anywhere to search.
          </p>
        </div>
      )}
    </>
  )
}
