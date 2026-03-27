'use client'

import { useState, useTransition, useRef, useEffect, useMemo } from 'react'
import type { BookmarkTag, Tag } from '@mykb/shared'
import { Plus } from 'lucide-react'
import { TagBadge } from '@/components/bookmarks/tag-badge'
import { addTagsToBookmark, removeTagFromBookmark, listTags } from '@/actions/tags'

interface TagManagerProps {
  readonly bookmarkId: number
  readonly tags: readonly BookmarkTag[]
  readonly canEdit: boolean
  readonly onTagsChange: (tags: readonly BookmarkTag[]) => void
}

export function TagManager({ bookmarkId, tags, canEdit, onTagsChange }: TagManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [allTags, setAllTags] = useState<readonly Tag[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestions = useMemo(() => {
    if (!inputValue.trim()) return []
    const query = inputValue.toLowerCase()
    const existingSlugs = new Set(tags.map((t) => t.slug))
    return allTags
      .filter((t) => t.name.toLowerCase().includes(query) && !existingSlugs.has(t.slug))
      .slice(0, 5)
  }, [inputValue, allTags, tags])

  useEffect(() => {
    if (isAdding) {
      inputRef.current?.focus()
      startTransition(async () => {
        try {
          const res = await listTags()
          setAllTags(res.data)
        } catch {
          // Ignore — autocomplete just won't work
        }
      })
    }
  }, [isAdding])

  function handleRemove(tagId: number) {
    setError(null)
    startTransition(async () => {
      try {
        await removeTagFromBookmark(bookmarkId, tagId)
        onTagsChange(tags.filter((t) => t.id !== tagId))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove tag.')
      }
    })
  }

  function handleAdd(tagName: string) {
    const trimmed = tagName.trim()
    if (!trimmed) return
    setError(null)
    startTransition(async () => {
      try {
        const res = await addTagsToBookmark(bookmarkId, [trimmed])
        const newTags = res.data as BookmarkTag[]
        const existingIds = new Set(tags.map((t) => t.id))
        const merged = [...tags, ...newTags.filter((t) => !existingIds.has(t.id))]
        onTagsChange(merged)
        setInputValue('')
        setIsAdding(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add tag.')
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd(inputValue)
    } else if (e.key === 'Escape') {
      setIsAdding(false)
      setInputValue('')
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-muted-foreground">Tags</h2>
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <TagBadge key={tag.id} tag={tag} onRemove={canEdit ? handleRemove : undefined} />
        ))}
        {tags.length === 0 && !isAdding && (
          <span className="text-xs text-muted-foreground">No tags</span>
        )}
        {canEdit && !isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            disabled={isPending}
          >
            <Plus className="size-3" />
            Add tag
          </button>
        )}
      </div>

      {isAdding && (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              // Delay to allow click on suggestion
              setTimeout(() => {
                if (!inputValue.trim()) {
                  setIsAdding(false)
                }
              }, 200)
            }}
            placeholder="Type tag name..."
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isPending}
            maxLength={100}
          />
          {suggestions.length > 0 && (
            <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-md border border-border bg-popover shadow-md">
              {suggestions.map((tag) => (
                <li key={tag.id}>
                  <button
                    type="button"
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleAdd(tag.name)}
                  >
                    {tag.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
