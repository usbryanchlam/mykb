import type { HttpContext } from '@adonisjs/core/http'
import CollectionService from '#services/collection_service'
import {
  createCollectionValidator,
  updateCollectionValidator,
  addBookmarkToCollectionValidator,
} from '#validators/collection'

function parseId(raw: string): number | null {
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

export default class CollectionsController {
  constructor(private readonly service: CollectionService = new CollectionService()) {}

  async index({ auth0User, response }: HttpContext) {
    const collections = await this.service.listByUser(auth0User.id)
    return response.ok({ success: true, data: collections, error: null })
  }

  async show({ auth0User, params, response }: HttpContext) {
    const id = parseId(params.id)
    if (!id) {
      return response.badRequest({ success: false, data: null, error: 'Invalid collection id' })
    }
    const collection = await this.service.findById(id, auth0User.id)
    return response.ok({ success: true, data: collection, error: null })
  }

  async store({ auth0User, request, response }: HttpContext) {
    const data = await createCollectionValidator.validate(request.body())
    const collection = await this.service.create(auth0User.id, data)
    return response.created({ success: true, data: collection, error: null })
  }

  async update({ auth0User, params, request, response }: HttpContext) {
    const id = parseId(params.id)
    if (!id) {
      return response.badRequest({ success: false, data: null, error: 'Invalid collection id' })
    }
    const data = await updateCollectionValidator.validate(request.body())
    const collection = await this.service.update(id, auth0User.id, {
      name: data.name,
      description: data.description,
      icon: data.icon,
      sortOrder: data.sort_order,
    })
    return response.ok({ success: true, data: collection, error: null })
  }

  async destroy({ auth0User, params, response }: HttpContext) {
    const id = parseId(params.id)
    if (!id) {
      return response.badRequest({ success: false, data: null, error: 'Invalid collection id' })
    }
    await this.service.delete(id, auth0User.id)
    return response.ok({ success: true, data: null, error: null })
  }

  async addBookmark({ auth0User, params, request, response }: HttpContext) {
    const id = parseId(params.id)
    if (!id) {
      return response.badRequest({ success: false, data: null, error: 'Invalid collection id' })
    }
    const data = await addBookmarkToCollectionValidator.validate(request.body())
    const collection = await this.service.addBookmark(id, auth0User.id, data.bookmark_id)
    return response.ok({ success: true, data: collection, error: null })
  }

  async removeBookmark({ auth0User, params, response }: HttpContext) {
    const id = parseId(params.id)
    const bookmarkId = parseId(params.bookmarkId)
    if (!id || !bookmarkId) {
      return response.badRequest({ success: false, data: null, error: 'Invalid id' })
    }
    await this.service.removeBookmark(id, auth0User.id, bookmarkId)
    return response.ok({ success: true, data: null, error: null })
  }

  async bookmarks({ auth0User, params, response }: HttpContext) {
    const id = parseId(params.id)
    if (!id) {
      return response.badRequest({ success: false, data: null, error: 'Invalid collection id' })
    }
    const bookmarks = await this.service.listBookmarks(id, auth0User.id)
    return response.ok({ success: true, data: bookmarks, error: null })
  }
}
