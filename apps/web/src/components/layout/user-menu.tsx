'use client'

import Image from 'next/image'
import { useAuth } from '@/hooks/use-auth'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

const TRUSTED_AVATAR_HOSTS = ['lh3.googleusercontent.com', 's.gravatar.com', 'cdn.auth0.com']

function isTrustedAvatarUrl(url: string): boolean {
  try {
    const { hostname, protocol } = new URL(url)
    return protocol === 'https:' && TRUSTED_AVATAR_HOSTS.includes(hostname)
  } catch {
    return false
  }
}

export function UserMenu() {
  const { user, isLoading } = useAuth()

  if (isLoading || !user) {
    return <div className="size-8 animate-pulse rounded-full bg-muted" />
  }

  return (
    <div className="flex items-center gap-3">
      {user.picture && isTrustedAvatarUrl(user.picture) ? (
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
