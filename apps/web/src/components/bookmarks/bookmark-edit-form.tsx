'use client'

import { useCallback, useState, useTransition } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { Bookmark } from '@mykb/shared'
import { updateBookmark } from '@/actions/bookmarks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface BookmarkEditFormProps {
  readonly bookmark: Bookmark
  readonly onSuccess: (updated: Bookmark) => void
}

interface FormErrors {
  readonly title?: string
  readonly description?: string
}

function validateForm(title: string, description: string): FormErrors {
  return {
    ...(title.length > 500 && { title: 'Title must be 500 characters or less.' }),
    ...(description.length > 2000 && {
      description: 'Description must be 2000 characters or less.',
    }),
  }
}

export function BookmarkEditForm({ bookmark, onSuccess }: BookmarkEditFormProps) {
  const [title, setTitle] = useState(bookmark.title ?? '')
  const [description, setDescription] = useState(bookmark.description ?? '')
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      const formErrors = validateForm(title, description)
      setErrors(formErrors)

      if (formErrors.title || formErrors.description) {
        return
      }

      const trimmedTitle = title.trim()
      const trimmedDescription = description.trim()

      if (
        trimmedTitle === (bookmark.title ?? '') &&
        trimmedDescription === (bookmark.description ?? '')
      ) {
        onSuccess(bookmark)
        return
      }

      setServerError(null)

      startTransition(async () => {
        try {
          const input = {
            ...(trimmedTitle !== (bookmark.title ?? '') && { title: trimmedTitle }),
            ...(trimmedDescription !== (bookmark.description ?? '') && {
              description: trimmedDescription,
            }),
          }
          const result = await updateBookmark(bookmark.id, input)
          onSuccess(result.data)
        } catch (err) {
          setServerError(err instanceof Error ? err.message : 'Failed to update bookmark.')
        }
      })
    },
    [title, description, bookmark, onSuccess],
  )

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={`/dashboard/bookmarks/${bookmark.id}`} />}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h1 className="mb-6 text-xl font-semibold">Edit Bookmark</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-url">URL</Label>
            <Input id="edit-url" type="url" value={bookmark.url} disabled className="bg-muted" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              type="text"
              placeholder="Bookmark title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (errors.title) setErrors({ ...errors, title: undefined })
              }}
              maxLength={500}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'edit-title-error' : undefined}
              disabled={isPending}
              autoFocus
            />
            {errors.title && (
              <p id="edit-title-error" className="text-xs text-destructive">
                {errors.title}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-description">Description</Label>
            <textarea
              id="edit-description"
              placeholder="Bookmark description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                if (errors.description) setErrors({ ...errors, description: undefined })
              }}
              maxLength={2000}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? 'edit-description-error' : undefined}
              disabled={isPending}
              rows={4}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
            />
            <div className="flex items-center justify-between">
              {errors.description ? (
                <p id="edit-description-error" className="text-xs text-destructive">
                  {errors.description}
                </p>
              ) : (
                <span />
              )}
              <span className="text-xs text-muted-foreground">{description.length}/2000</span>
            </div>
          </div>

          {serverError && <p className="text-xs text-destructive">{serverError}</p>}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              disabled={isPending}
              nativeButton={false}
              render={<Link href={`/dashboard/bookmarks/${bookmark.id}`} />}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
