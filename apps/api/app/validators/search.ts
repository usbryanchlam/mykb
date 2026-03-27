import vine from '@vinejs/vine'
import { PAGINATION } from '@mykb/shared'

export const searchValidator = vine.compile(
  vine.object({
    q: vine.string().trim().minLength(1).maxLength(200),
    page: vine.number().positive().optional(),
    limit: vine.number().positive().max(PAGINATION.MAX_LIMIT).optional(),
  })
)
