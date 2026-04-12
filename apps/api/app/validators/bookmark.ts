import vine from '@vinejs/vine'
import { PAGINATION } from '@mykb/shared'

export const createBookmarkValidator = vine.compile(
  vine.object({
    url: vine
      .string()
      .url({ protocols: ['http', 'https'] })
      .trim(),
    title: vine.string().trim().maxLength(500).optional(),
  })
)

export const updateBookmarkValidator = vine.compile(
  vine.object({
    title: vine.string().trim().maxLength(500).optional(),
    description: vine.string().trim().maxLength(2000).optional(),
  })
)

export const updateContentValidator = vine.compile(
  vine.object({
    plain_text: vine.string().trim().minLength(1).maxLength(100_000),
    content: vine.string().maxLength(500_000).optional(),
  })
)

export const listBookmarksValidator = vine.compile(
  vine.object({
    page: vine.number().positive().optional(),
    limit: vine.number().positive().max(PAGINATION.MAX_LIMIT).optional(),
    sort: vine.string().in(['created_at', 'updated_at', 'title']).optional(),
    order: vine.string().in(['asc', 'desc']).optional(),
    is_favorite: vine
      .string()
      .in(['true', 'false'])
      .optional()
      .transform((value) => value === 'true'),
    is_archived: vine
      .string()
      .in(['true', 'false'])
      .optional()
      .transform((value) => value === 'true'),
    tag: vine.string().trim().maxLength(100).optional(),
  })
)
