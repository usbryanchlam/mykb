import type { HttpContext } from '@adonisjs/core/http'
import BookmarkService from '#services/bookmark_service'
import {
  createBookmarkValidator,
  updateBookmarkValidator,
  listBookmarksValidator,
} from '#validators/bookmark'

const service = new BookmarkService()

export default class BookmarksController {
  async index({ auth0User, request, response }: HttpContext) {
    const query = await listBookmarksValidator.validate(request.qs())

    const bookmarks = await service.list({
      userId: auth0User.id,
      page: query.page,
      limit: query.limit,
      sort: query.sort,
      order: query.order as 'asc' | 'desc' | undefined,
      isFavorite: query.is_favorite,
      isArchived: query.is_archived,
    })

    return response.ok({
      success: true,
      data: bookmarks.all(),
      error: null,
      meta: {
        total: bookmarks.total,
        page: bookmarks.currentPage,
        limit: bookmarks.perPage,
      },
    })
  }

  async show({ auth0User, params, response }: HttpContext) {
    const bookmark = await service.findById(params.id, auth0User.id)
    return response.ok({ success: true, data: bookmark, error: null })
  }

  async store({ auth0User, request, response }: HttpContext) {
    const data = await createBookmarkValidator.validate(request.body())
    const bookmark = await service.create(auth0User.id, data)
    return response.created({ success: true, data: bookmark, error: null })
  }

  async update({ auth0User, params, request, response }: HttpContext) {
    const data = await updateBookmarkValidator.validate(request.body())
    const bookmark = await service.update(params.id, auth0User.id, data)
    return response.ok({ success: true, data: bookmark, error: null })
  }

  async destroy({ auth0User, params, response }: HttpContext) {
    await service.delete(params.id, auth0User.id)
    return response.ok({ success: true, data: null, error: null })
  }

  async favorite({ auth0User, params, response }: HttpContext) {
    const bookmark = await service.toggleFavorite(params.id, auth0User.id)
    return response.ok({ success: true, data: bookmark, error: null })
  }

  async archive({ auth0User, params, response }: HttpContext) {
    const bookmark = await service.toggleArchive(params.id, auth0User.id)
    return response.ok({ success: true, data: bookmark, error: null })
  }
}
