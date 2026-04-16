'use client'

import { useCallback, useRef, useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { isSafeUrl } from '@/lib/bookmark-utils'
import { createBookmark } from '@/actions/bookmarks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface AddBookmarkDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onSuccess: () => void
}

interface FormErrors {
  readonly url?: string
}

function validateForm(url: string): FormErrors {
  const trimmed = url.trim()

  if (!trimmed) {
    return { url: 'URL is required.' }
  }

  if (!isSafeUrl(trimmed)) {
    return { url: 'Please enter a valid URL starting with http:// or https://.' }
  }

  return {}
}

export function AddBookmarkDialog({ open, onOpenChange, onSuccess }: AddBookmarkDialogProps) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const urlInputRef = useRef<HTMLInputElement>(null)

  const resetForm = useCallback(() => {
    setUrl('')
    setTitle('')
    setErrors({})
    setServerError(null)
  }, [])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        resetForm()
      }
      onOpenChange(nextOpen)
    },
    [onOpenChange, resetForm],
  )

  const handleClose = useCallback(() => {
    handleOpenChange(false)
  }, [handleOpenChange])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      const formErrors = validateForm(url)
      setErrors(formErrors)

      if (formErrors.url) {
        urlInputRef.current?.focus()
        return
      }

      setServerError(null)

      startTransition(async () => {
        try {
          const input = {
            url: url.trim(),
            ...(title.trim() && { title: title.trim() }),
          }
          await createBookmark(input)
          resetForm()
          onOpenChange(false)
          onSuccess()
        } catch (err) {
          setServerError(err instanceof Error ? err.message : 'Failed to create item.')
        }
      })
    },
    [url, title, onOpenChange, onSuccess, resetForm],
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Knowledge</DialogTitle>
          <DialogDescription>Save a URL to your knowledge base.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="bookmark-url">URL</Label>
            <Input
              ref={urlInputRef}
              id="bookmark-url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                if (errors.url) setErrors({})
              }}
              maxLength={2048}
              aria-invalid={!!errors.url}
              aria-describedby={errors.url ? 'bookmark-url-error' : undefined}
              disabled={isPending}
              autoFocus
            />
            {errors.url && (
              <p id="bookmark-url-error" className="text-xs text-destructive">
                {errors.url}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="bookmark-title">
              Title <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="bookmark-title"
              type="text"
              placeholder="Custom title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={500}
              disabled={isPending}
            />
          </div>

          {serverError && <p className="text-xs text-destructive">{serverError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Knowledge'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
