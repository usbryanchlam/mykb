'use client'

import { useUser } from '@auth0/nextjs-auth0'
import type { UserRole } from '@mykb/shared'

const ROLES_CLAIM = 'https://mykb.bryanlam.dev/roles'

export function useAuth() {
  const { user, isLoading, error } = useUser()

  const roles = (user?.[ROLES_CLAIM] as string[] | undefined) ?? []

  if (process.env.NODE_ENV === 'development' && user && roles.length === 0) {
    console.warn(
      '[useAuth] No roles found in token claim "%s". Defaulting to "viewer".',
      ROLES_CLAIM,
    )
  }

  const role = (roles[0] ?? 'viewer') as UserRole

  return {
    user,
    role,
    isLoading,
    error,
    isAuthenticated: !!user,
  }
}
