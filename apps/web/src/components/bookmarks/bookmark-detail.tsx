'use client'

import type { Bookmark } from '@mykb/shared'
import {
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  Globe,
  Pencil,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import Link from 'next/link'
import { BookmarkActions } from '@/components/bookmarks/bookmark-actions'
import { Button } from '@/components/ui/button'
import { getDomain, isSafeUrl, isSafeFaviconUrl } from '@/lib/bookmark-utils'

interface BookmarkDetailProps {
  readonly bookmark: Bookmark
  readonly canEdit: boolean
  readonly onToggleFavorite: () => void
  readonly onToggleArchive: () => void
  readonly onDelete: () => void
}

function StatusBadge({ label, value }: { readonly label: string; readonly value: string }) {
  const colorMap: Record<string, string> = {
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    safe: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    flagged: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    skipped: 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400',
  }

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorMap[value] ?? colorMap.pending}`}
      >
        {value}
      </span>
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
}: BookmarkDetailProps) {
  const domain = getDomain(bookmark.url)
  const title = bookmark.title ?? domain
  const safeHref = isSafeUrl(bookmark.url) ? bookmark.url : '#'

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" render={<Link href="/dashboard" />}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {isSafeFaviconUrl(bookmark.faviconUrl) ? (
              <img src={bookmark.faviconUrl} alt="" className="size-6 rounded-sm" loading="lazy" />
            ) : (
              <Globe className="size-6 text-muted-foreground" />
            )}
            <div>
              <h1 className="text-xl font-semibold">{title}</h1>
              <a
                href={safeHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                {domain}
                <ExternalLink className="size-3" />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
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
            <p className="text-sm">{bookmark.description}</p>
          </div>
        )}

        {bookmark.summary && (
          <div>
            <h2 className="mb-1 text-sm font-medium text-muted-foreground">Summary</h2>
            <p className="text-sm">{bookmark.summary}</p>
          </div>
        )}

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
            <StatusBadge label="Scrape" value={bookmark.scrapeStatus} />
            <StatusBadge label="AI" value={bookmark.aiStatus} />
            <StatusBadge label="Safety" value={bookmark.safetyStatus} />
          </div>
        </div>
      </div>

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
