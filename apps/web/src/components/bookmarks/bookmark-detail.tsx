'use client'

import { useState } from 'react'
import type { Bookmark, BookmarkTag } from '@mykb/shared'
import {
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  Globe,
  Pencil,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { BookmarkActions } from '@/components/bookmarks/bookmark-actions'
import { ReaderView } from '@/components/bookmarks/reader-view'
import { StatusBadge } from '@/components/bookmarks/status-badge'
import { TagManager } from '@/components/bookmarks/tag-manager'
import { AddToCollection } from '@/components/collections/add-to-collection'
import { Button } from '@/components/ui/button'
import { getDomain, isSafeUrl, isSafeFaviconUrl } from '@/lib/bookmark-utils'

interface BookmarkDetailProps {
  readonly bookmark: Bookmark
  readonly canEdit: boolean
  readonly onToggleFavorite: () => void
  readonly onToggleArchive: () => void
  readonly onDelete: () => void
  readonly onRescrape: () => void
}

function StatusRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <StatusBadge status={value} label={label} />
    </div>
  )
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function BookmarkDetail({
  bookmark,
  canEdit,
  onToggleFavorite,
  onToggleArchive,
  onDelete,
  onRescrape,
}: BookmarkDetailProps) {
  const [tags, setTags] = useState<readonly BookmarkTag[]>(bookmark.tags ?? [])
  const domain = getDomain(bookmark.url)
  const title = bookmark.title ?? domain
  const safeHref = isSafeUrl(bookmark.url) ? bookmark.url : '#'

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 overflow-hidden">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/dashboard" />}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
      </div>

      <div className="flex min-w-0 flex-col gap-4 rounded-lg border border-border bg-card p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {isSafeFaviconUrl(bookmark.faviconUrl) ? (
              <img
                src={bookmark.faviconUrl}
                alt=""
                className="size-6 shrink-0 rounded-sm"
                loading="lazy"
              />
            ) : (
              <Globe className="size-6 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold">{title}</h1>
              <a
                href={safeHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                <span className="truncate">{domain}</span>
                <ExternalLink className="size-3 shrink-0" />
              </a>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href={`/dashboard/bookmarks/${bookmark.id}/edit`} />}
              >
                <Pencil className="size-4" />
                Edit
              </Button>
            )}
            <BookmarkActions
              isFavorite={bookmark.isFavorite}
              isArchived={bookmark.isArchived}
              url={bookmark.url}
              onToggleFavorite={onToggleFavorite}
              onToggleArchive={onToggleArchive}
              onDelete={onDelete}
            />
          </div>
        </div>

        {bookmark.description && (
          <div>
            <h2 className="mb-1 text-sm font-medium text-muted-foreground">Description</h2>
            <p className="break-words text-sm">{bookmark.description}</p>
          </div>
        )}

        {bookmark.summary && (
          <div className="rounded-md border border-purple-200 bg-purple-50 p-3 dark:border-purple-900 dark:bg-purple-950/30">
            <div className="mb-1 flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-sm font-medium text-purple-800 dark:text-purple-300">
                AI Summary
              </h2>
            </div>
            <p className="break-words text-sm text-purple-900 dark:text-purple-200">
              {bookmark.summary}
            </p>
          </div>
        )}

        <TagManager bookmarkId={bookmark.id} tags={tags} canEdit={canEdit} onTagsChange={setTags} />

        {canEdit && <AddToCollection bookmarkId={bookmark.id} />}

        <div>
          <h2 className="mb-1 text-sm font-medium text-muted-foreground">URL</h2>
          <a
            href={safeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            {bookmark.url}
          </a>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-4">
          <h2 className="mb-2 text-sm font-medium">Dates</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="size-4" />
            <span>Created {formatDate(bookmark.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4" />
            <span>Updated {formatDate(bookmark.updatedAt)}</span>
          </div>
        </div>

        <div className="flex flex-col rounded-lg border border-border bg-card p-4">
          <h2 className="mb-2 text-sm font-medium">Status</h2>
          <div className="flex flex-col divide-y divide-border">
            <StatusRow label="Scrape" value={bookmark.scrapeStatus} />
            <StatusRow label="AI" value={bookmark.aiStatus} />
            <StatusRow label="Safety" value={bookmark.safetyStatus} />
          </div>
        </div>
      </div>

      <ReaderView bookmark={bookmark} onRescrape={onRescrape} />

      {bookmark.safetyStatus === 'flagged' &&
        bookmark.safetyReasons &&
        bookmark.safetyReasons.length > 0 && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-red-500" />
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400">Safety Flagged</h3>
              <ul className="mt-1 list-inside list-disc text-sm text-red-700 dark:text-red-300">
                {bookmark.safetyReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

      {bookmark.safetyStatus === 'safe' && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
          <ShieldCheck className="size-5 text-green-500" />
          <span className="text-sm text-green-800 dark:text-green-400">
            Content verified as safe
          </span>
        </div>
      )}

      {(bookmark.scrapeError || bookmark.aiError) && (
        <div className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
          {bookmark.scrapeError && (
            <p className="text-sm text-red-700 dark:text-red-300">
              <span className="font-medium">Scrape error:</span>{' '}
              {bookmark.scrapeError.length > 200
                ? `${bookmark.scrapeError.slice(0, 200)}...`
                : bookmark.scrapeError}
            </p>
          )}
          {bookmark.aiError && (
            <p className="text-sm text-red-700 dark:text-red-300">
              <span className="font-medium">AI error:</span>{' '}
              {bookmark.aiError.length > 200
                ? `${bookmark.aiError.slice(0, 200)}...`
                : bookmark.aiError}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
