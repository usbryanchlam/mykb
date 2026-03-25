import type { HttpContext } from '@adonisjs/core/http'
import TagService from '#services/tag_service'
import { createTagValidator, updateTagValidator, addTagsToBookmarkValidator } from '#validators/tag'

function parseId(raw: string): number | null {
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

export default class TagsController {
  constructor(private readonly service: TagService = new TagService()) {}

  async index({ auth0User, response }: HttpContext) {
    const tags = await this.service.listByUser(auth0User.id)
    return response.ok({ success: true, data: tags, error: null })
  }

  async store({ auth0User, request, response }: HttpContext) {
    const data = await createTagValidator.validate(request.body())
    const tag = await this.service.create(auth0User.id, data.name)
    return response.created({ success: true, data: tag, error: null })
  }

  async update({ auth0User, params, request, response }: HttpContext) {
    const id = parseId(params.id)
    if (!id) {
      return response.badRequest({ success: false, data: null, error: 'Invalid tag id' })
    }
    const data = await updateTagValidator.validate(request.body())
    const tag = await this.service.rename(id, auth0User.id, data.name)
    return response.ok({ success: true, data: tag, error: null })
  }

  async destroy({ auth0User, params, response }: HttpContext) {
    const id = parseId(params.id)
    if (!id) {
      return response.badRequest({ success: false, data: null, error: 'Invalid tag id' })
    }
    await this.service.delete(id, auth0User.id)
    return response.ok({ success: true, data: null, error: null })
  }

  async addToBookmark({ auth0User, params, request, response }: HttpContext) {
    const bookmarkId = parseId(params.id)
    if (!bookmarkId) {
      return response.badRequest({ success: false, data: null, error: 'Invalid bookmark id' })
    }
    const data = await addTagsToBookmarkValidator.validate(request.body())
    const tags = await this.service.addTagsToBookmark(bookmarkId, auth0User.id, data.tags)
    return response.ok({ success: true, data: tags, error: null })
  }

  async removeFromBookmark({ auth0User, params, response }: HttpContext) {
    const bookmarkId = parseId(params.id)
    const tagId = parseId(params.tagId)
    if (!bookmarkId || !tagId) {
      return response.badRequest({ success: false, data: null, error: 'Invalid id' })
    }
    await this.service.removeTagFromBookmark(bookmarkId, auth0User.id, tagId)
    return response.ok({ success: true, data: null, error: null })
  }
}
