import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import type { UserRole } from '@mykb/shared'
import Bookmark from '#models/bookmark'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'auth0_sub' })
  declare auth0Sub: string

  @column()
  declare email: string | null

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

  @hasMany(() => Bookmark)
  declare bookmarks: HasMany<typeof Bookmark>

  get initials() {
    const parts = this.name ? this.name.split(' ') : (this.email ?? '').split('@')
    const [first, last] = parts
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return `${first.slice(0, 2)}`.toUpperCase()
  }
}
