import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import type { AiStatus, SafetyStatus, ScrapeStatus } from '@mykb/shared'
import User from '#models/user'

export default class Bookmark extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare url: string

  @column()
  declare title: string | null

  @column()
  declare description: string | null

  @column()
  declare summary: string | null

  @column()
  declare content: string | null

  @column()
  declare plainText: string | null

  @column()
  declare faviconUrl: string | null

  @column()
  declare ogImageUrl: string | null

  @column()
  declare thumbnailKey: string | null

  @column()
  declare screenshotKey: string | null

  @column()
  declare isFavorite: boolean

  @column()
  declare isArchived: boolean

  @column()
  declare scrapeStatus: ScrapeStatus

  @column()
  declare aiStatus: AiStatus

  @column()
  declare safetyStatus: SafetyStatus

  @column({
    prepare: (value: string[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | null) => (value ? JSON.parse(value) : null),
  })
  declare safetyReasons: string[] | null

  @column()
  declare scrapeError: string | null

  @column()
  declare aiError: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
