import vine from '@vinejs/vine'

export const createCollectionValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(100),
    description: vine.string().trim().maxLength(500).optional(),
    icon: vine.string().trim().maxLength(50).optional(),
  })
)

export const updateCollectionValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(100).optional(),
    description: vine.string().trim().maxLength(500).nullable().optional(),
    icon: vine.string().trim().maxLength(50).nullable().optional(),
    sort_order: vine.number().min(0).optional(),
  })
)

export const addBookmarkToCollectionValidator = vine.compile(
  vine.object({
    bookmark_id: vine.number().positive(),
  })
)
