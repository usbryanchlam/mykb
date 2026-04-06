import type { HttpContext } from '@adonisjs/core/http'
import BookmarkService from '#services/bookmark_service'
import BookmarkPipelineService from '#services/bookmark_pipeline_service'
import {
  createBookmarkValidator,
  updateBookmarkValidator,
  updateContentValidator,
  listBookmarksValidator,
} from '#validators/bookmark'

function parseId(raw: string): number | null {
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

export default class BookmarksController {
  constructor(
    private readonly service: BookmarkService = new BookmarkService(),
    private readonly pipeline: BookmarkPipelineService = new BookmarkPipelineService()
  ) {}

  async index({ auth0User, request, response }: HttpContext) {
    const query = await listBookmarksValidator.validate(request.qs())

    const bookmarks = await this.service.list({
      userId: auth0User.id,
      page: query.page,
      limit: query.limit,
      sort: query.sort,
      order: query.order as 'asc' | 'desc' | undefined,
      isFavorite: query.is_favorite,
      isArchived: query.is_archived,
      tag: query.tag,
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
    const id = parseId(params.id)
    if (!id) {
      return response.badRequest({ success: false, data: null, error: 'Invalid bookmark id' })
    }
    const bookmark = await this.service.findById(id, auth0User.id)
    return response.ok({ success: true, data: bookmark, error: null })
  }

  async store({ auth0User, request, response }: HttpContext) {
    const data = await createBookmarkValidator.validate(request.body())
    const bookmark = await this.service.create(auth0User.id, data)

    // Trigger scrape → safety pipeline in the background
    this.pipeline.triggerPipeline(bookmark.id)

    return response.created({ success: true, data: bookmark, error: null })
  }

  async update({ auth0User, params, request, response }: HttpContext) {
    const id = parseId(params.id)
    if (!id) {
      return response.badRequest({ success: false, data: null, error: 'Invalid bookmark id' })
    }
    const data = await updateBookmarkValidator.validate(request.body())
    if (!data.title && !data.description) {
      return response.badRequest({
        success: false,
        data: null,
        error: 'At least one of title or description is required',
      })
    }
    const bookmark = await this.service.update(id, auth0User.id, data)
    return response.ok({ success: true, data: bookmark, error: null })
  }

  async destroy({ auth0User, params, response }: HttpContext) {
    const id = parseId(params.id)
    if (!id) {
      return response.badRequest({ success: false, data: null, error: 'Invalid bookmark id' })
    }
    await this.service.delete(id, auth0User.id)
    return response.ok({ success: true, data: null, error: null })
  }

  async favorite({ auth0User, params, response }: HttpContext) {
    const id = parseId(params.id)
    if (!id) {
      return response.badRequest({ success: false, data: null, error: 'Invalid bookmark id' })
    }
    const bookmark = await this.service.toggleFavorite(id, auth0User.id)
    return response.ok({ success: true, data: bookmark, error: null })
  }

  async archive({ auth0User, params, response }: HttpContext) {
    const id = parseId(params.id)
    if (!id) {
      return response.badRequest({ success: false, data: null, error: 'Invalid bookmark id' })
    }
    const bookmark = await this.service.toggleArchive(id, auth0User.id)
    return response.ok({ success: true, data: bookmark, error: null })
  }

  async updateContent({ auth0User, params, request, response }: HttpContext) {
    const id = parseId(params.id)
    if (!id) {
      return response.badRequest({ success: false, data: null, error: 'Invalid bookmark id' })
    }
    const data = await updateContentValidator.validate(request.body())
    const bookmark = await this.service.setManualContent(id, auth0User.id, data.plain_text)

    this.pipeline.triggerAiPipeline(bookmark.id)

    return response.ok({ success: true, data: bookmark, error: null })
  }

  async rescrape({ auth0User, params, response }: HttpContext) {
    const id = parseId(params.id)
    if (!id) {
      return response.badRequest({ success: false, data: null, error: 'Invalid bookmark id' })
    }

    const bookmark = await this.service.resetForRescrape(id, auth0User.id)
    this.pipeline.triggerPipeline(bookmark.id)

    return response.ok({ success: true, data: bookmark, error: null })
  }

  async reader({ auth0User, params, response }: HttpContext) {
    const id = parseId(params.id)
    if (!id) {
      return response.badRequest({ success: false, data: null, error: 'Invalid bookmark id' })
    }

    const bookmark = await this.service.findById(id, auth0User.id)

    if (bookmark.safetyStatus === 'flagged') {
      return response.forbidden({
        success: false,
        data: null,
        error: 'Content has been flagged for safety concerns',
      })
    }

    if (bookmark.scrapeStatus !== 'completed') {
      return response.ok({
        success: true,
        data: { content: null, plainText: null, status: bookmark.scrapeStatus },
        error: null,
      })
    }

    return response.ok({
      success: true,
      data: {
        content: bookmark.content,
        plainText: bookmark.plainText,
        status: bookmark.scrapeStatus,
      },
      error: null,
    })
  }
}
