import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Bookmark from '#models/bookmark'
import type { JobStatus } from '#jobs/base_job'

export default class JobLog extends BaseModel {
  static readonly updatedAtColumn = false as const

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare jobType: string

  @column()
  declare bookmarkId: number

  @column()
  declare status: JobStatus

  @column()
  declare errorMessage: string | null

  @column()
  declare attempt: number

  @column.dateTime()
  declare startedAt: DateTime

  @column.dateTime()
  declare completedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Bookmark)
  declare bookmark: BelongsTo<typeof Bookmark>
}
