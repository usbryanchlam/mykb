import type { UserRole } from '../types/roles.js'

export const ROLES: readonly UserRole[] = ['admin', 'editor', 'viewer'] as const

export const ROLE_HIERARCHY: Readonly<Record<UserRole, number>> = {
  admin: 3,
  editor: 2,
  viewer: 1,
}

export const PERMISSIONS = {
  'manage:users': ['admin'],
  'write:bookmarks': ['admin', 'editor'],
  'write:tags': ['admin', 'editor'],
  'write:collections': ['admin', 'editor'],
  'read:bookmarks': ['admin', 'editor', 'viewer'],
  'read:tags': ['admin', 'editor', 'viewer'],
  'read:collections': ['admin', 'editor', 'viewer'],
} as const satisfies Record<string, readonly UserRole[]>

export type Permission = keyof typeof PERMISSIONS
