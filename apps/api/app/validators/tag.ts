import vine from '@vinejs/vine'

export const createTagValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(100),
  })
)

export const updateTagValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(100),
  })
)

export const addTagsToBookmarkValidator = vine.compile(
  vine.object({
    tags: vine.array(vine.string().trim().minLength(1).maxLength(100)).minLength(1).maxLength(20),
  })
)
