import type { UserRole } from './roles.js'

export interface User {
  readonly id: number
  readonly auth0Sub: string
  readonly email: string
  readonly name: string
  readonly avatarUrl: string | null
  readonly role: UserRole
  readonly lastLoginAt: string | null
  readonly createdAt: string
  readonly updatedAt: string
}
