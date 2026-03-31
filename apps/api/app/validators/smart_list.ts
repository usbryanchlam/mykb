import vine from '@vinejs/vine'
import { PAGINATION } from '@mykb/shared'

const ISO_UTC_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/

/**
 * Validates that a string is a valid UTC ISO 8601 date (e.g. 2026-03-29T07:00:00.000Z).
 * Checks both format and calendar validity (rejects 2026-13-99T25:99:99Z).
 */
function isoUtcDate() {
  return vine
    .string()
    .trim()
    .regex(ISO_UTC_REGEX)
    .transform((value) => {
      const ms = Date.parse(value)
      if (!Number.isFinite(ms)) {
        throw new Error('Invalid date value')
      }
      return value
    })
}

const filterQuerySchema = vine.object({
  isFavorite: vine.boolean().optional(),
  isArchived: vine.boolean().optional(),
  tags: vine.array(vine.string().trim().maxLength(100)).maxLength(20).optional(),
  dateFrom: isoUtcDate().optional(),
  dateTo: isoUtcDate().optional(),
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
