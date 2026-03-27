'use client'

import { useCallback, useRef, useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { createCollection } from '@/actions/collections'
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

interface CreateCollectionDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onSuccess: () => void
}

export function CreateCollectionDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateCollectionDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const nameRef = useRef<HTMLInputElement>(null)

  const resetForm = useCallback(() => {
    setName('')
    setDescription('')
    setError(null)
    setNameError(null)
  }, [])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) resetForm()
      onOpenChange(nextOpen)
    },
    [onOpenChange, resetForm],
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      if (!name.trim()) {
        setNameError('Name is required.')
        nameRef.current?.focus()
        return
      }

      setError(null)
      setNameError(null)

      startTransition(async () => {
        try {
          await createCollection({
            name: name.trim(),
            ...(description.trim() && { description: description.trim() }),
          })
          resetForm()
          onOpenChange(false)
          onSuccess()
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to create collection.')
        }
      })
    },
    [name, description, onOpenChange, onSuccess, resetForm],
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Collection</DialogTitle>
          <DialogDescription>Organize your bookmarks into a collection.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="collection-name">Name</Label>
            <Input
              ref={nameRef}
              id="collection-name"
              type="text"
              placeholder="e.g. Dev Resources"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (nameError) setNameError(null)
              }}
              maxLength={100}
              aria-invalid={!!nameError}
              disabled={isPending}
              autoFocus
            />
            {nameError && <p className="text-xs text-destructive">{nameError}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="collection-description">
              Description <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="collection-description"
              type="text"
              placeholder="A short description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              disabled={isPending}
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
