import type { HttpContext } from '@adonisjs/core/http'
import SmartListService from '#services/smart_list_service'
import {
  createSmartListValidator,
  updateSmartListValidator,
  resolveSmartListValidator,
} from '#validators/smart_list'

function parseId(raw: string): number | null {
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

export default class SmartListsController {
  constructor(private readonly service: SmartListService = new SmartListService()) {}

  async index({ auth0User, response }: HttpContext) {
    const smartLists = await this.service.listByUser(auth0User.id)
    return response.ok({ success: true, data: smartLists, error: null })
  }

  async show({ auth0User, params, response }: HttpContext) {
    const id = parseId(params.id)
    if (!id) {
      return response.badRequest({ success: false, data: null, error: 'Invalid smart list id' })
    }
    const smartList = await this.service.findById(id, auth0User.id)
    return response.ok({ success: true, data: smartList, error: null })
  }

  async store({ auth0User, request, response }: HttpContext) {
    const data = await createSmartListValidator.validate(request.body())
    const smartList = await this.service.create(auth0User.id, {
      name: data.name,
      description: data.description,
      icon: data.icon,
      filterQuery: data.filter_query,
    })
    return response.created({ success: true, data: smartList, error: null })
  }

  async update({ auth0User, params, request, response }: HttpContext) {
    const id = parseId(params.id)
    if (!id) {
      return response.badRequest({ success: false, data: null, error: 'Invalid smart list id' })
    }
    const data = await updateSmartListValidator.validate(request.body())
    const smartList = await this.service.update(id, auth0User.id, {
      name: data.name,
      description: data.description,
      icon: data.icon,
      filterQuery: data.filter_query,
    })
    return response.ok({ success: true, data: smartList, error: null })
  }

  async destroy({ auth0User, params, response }: HttpContext) {
    const id = parseId(params.id)
    if (!id) {
      return response.badRequest({ success: false, data: null, error: 'Invalid smart list id' })
    }
    await this.service.delete(id, auth0User.id)
    return response.ok({ success: true, data: null, error: null })
  }

  async resolve({ auth0User, params, request, response }: HttpContext) {
    const id = parseId(params.id)
    if (!id) {
      return response.badRequest({ success: false, data: null, error: 'Invalid smart list id' })
    }
    const query = await resolveSmartListValidator.validate(request.qs())
    const result = await this.service.resolveBookmarks(id, auth0User.id, {
      page: query.page,
      limit: query.limit,
    })
    return response.ok({
      success: true,
      data: result.all(),
      error: null,
      meta: {
        total: result.total,
        page: result.currentPage,
        limit: result.perPage,
      },
    })
  }
}
