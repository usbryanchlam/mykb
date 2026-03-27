import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import User from '#models/user'

export interface FilterQuery {
  readonly isFavorite?: boolean
  readonly isArchived?: boolean
  readonly tags?: readonly string[]
  readonly dateFrom?: string
  readonly dateTo?: string
}

export default class SmartList extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare icon: string | null

  @column({
    prepare: (value: FilterQuery) => JSON.stringify(value),
    consume: (value: string) => JSON.parse(value) as FilterQuery,
  })
  declare filterQuery: FilterQuery

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
