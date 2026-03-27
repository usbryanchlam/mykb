import vine from '@vinejs/vine'
import { PAGINATION } from '@mykb/shared'

const filterQuerySchema = vine.object({
  isFavorite: vine.boolean().optional(),
  isArchived: vine.boolean().optional(),
  tags: vine.array(vine.string().trim().maxLength(100)).maxLength(20).optional(),
  dateFrom: vine.string().trim().optional(),
  dateTo: vine.string().trim().optional(),
})

export const createSmartListValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(100),
    description: vine.string().trim().maxLength(500).optional(),
    icon: vine.string().trim().maxLength(50).optional(),
    filter_query: filterQuerySchema,
  })
)

export const updateSmartListValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(100).optional(),
    description: vine.string().trim().maxLength(500).nullable().optional(),
    icon: vine.string().trim().maxLength(50).nullable().optional(),
    filter_query: filterQuerySchema.optional(),
  })
)

export const resolveSmartListValidator = vine.compile(
  vine.object({
    page: vine.number().positive().optional(),
    limit: vine.number().positive().max(PAGINATION.MAX_LIMIT).optional(),
  })
)
