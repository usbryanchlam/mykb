'use client'

import Image from 'next/image'
import { useAuth } from '@/hooks/use-auth'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function UserMenu() {
  const { user, isLoading } = useAuth()

  if (isLoading || !user) {
    return <div className="size-8 animate-pulse rounded-full bg-muted" />
  }

  return (
    <div className="flex items-center gap-3">
      {user.picture ? (
        <Image
          src={user.picture}
          alt={user.name ?? ''}
          width={32}
          height={32}
          className="rounded-full"
        />
      ) : (
        <div className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          {(user.name ?? user.email ?? '?').slice(0, 2).toUpperCase()}
        </div>
      )}
      <span className="hidden text-sm font-medium md:inline">{user.name}</span>
      <a href="/auth/logout">
        <Button variant="ghost" size="icon-sm" aria-label="Sign out">
          <LogOut className="size-4" />
        </Button>
      </a>
    </div>
  )
}
