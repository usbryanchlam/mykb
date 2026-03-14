import type { HttpContext } from '@adonisjs/core/http'

export default class UsersController {
  async me({ auth0User, response }: HttpContext) {
    return response.ok({ success: true, data: auth0User, error: null })
  }
}
