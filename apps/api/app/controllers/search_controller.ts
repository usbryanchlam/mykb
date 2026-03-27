import type { HttpContext } from '@adonisjs/core/http'
import SearchService from '#services/search_service'
import { searchValidator } from '#validators/search'

export default class SearchController {
  constructor(private readonly service: SearchService = new SearchService()) {}

  async search({ auth0User, request, response }: HttpContext) {
    const query = await searchValidator.validate(request.qs())

    const result = await this.service.search({
      userId: auth0User.id,
      query: query.q,
      page: query.page,
      limit: query.limit,
    })

    return response.ok({
      success: true,
      data: result.results,
      error: null,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
      },
    })
  }
}
