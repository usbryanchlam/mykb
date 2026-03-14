import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import type { UserRole } from '@mykb/shared'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare auth0Sub: string

  @column()
  declare email: string

  @column()
  declare name: string

  @column()
  declare avatarUrl: string | null

  @column()
  declare role: UserRole

  @column.dateTime()
  declare lastLoginAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  get initials() {
    const parts = this.name ? this.name.split(' ') : this.email.split('@')
    const [first, last] = parts
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return `${first.slice(0, 2)}`.toUpperCase()
  }
}
