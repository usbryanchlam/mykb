import { BaseModel, belongsTo, column, manyToMany, beforeCreate } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import User from '#models/user'
import Bookmark from '#models/bookmark'

export default class Tag extends BaseModel {
  static readonly updatedAtColumn = false as const

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare isAiGenerated: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @manyToMany(() => Bookmark, {
    pivotTable: 'bookmark_tags',
    pivotTimestamps: { createdAt: 'created_at', updatedAt: false },
  })
  declare bookmarks: ManyToMany<typeof Bookmark>

  static generateSlugFromName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 100)
  }

  @beforeCreate()
  static assignSlug(tag: Tag) {
    if (!tag.slug) {
      tag.slug = Tag.generateSlugFromName(tag.name)
    }
  }
}
