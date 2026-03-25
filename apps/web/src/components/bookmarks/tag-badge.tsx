import type { BookmarkTag } from '@mykb/shared'
import { Sparkles, X } from 'lucide-react'
import Link from 'next/link'

interface TagBadgeProps {
  readonly tag: BookmarkTag
  readonly onRemove?: (tagId: number) => void
}

export function TagBadge({ tag, onRemove }: TagBadgeProps) {
  const baseClasses =
    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors'
  const colorClasses = tag.isAiGenerated
    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'

  return (
    <span className={`${baseClasses} ${colorClasses}`}>
      {tag.isAiGenerated && <Sparkles className="size-3" />}
      <Link
        href={`/dashboard/tags/${tag.slug}`}
        className="hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {tag.name}
      </Link>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove(tag.id)
          }}
          className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
          aria-label={`Remove tag ${tag.name}`}
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  )
}
