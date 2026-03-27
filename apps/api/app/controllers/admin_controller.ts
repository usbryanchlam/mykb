import type { HttpContext } from '@adonisjs/core/http'
import AdminService from '#services/admin_service'

export default class AdminController {
  constructor(private readonly service: AdminService = new AdminService()) {}

  async stats({ response }: HttpContext) {
    const stats = await this.service.getStats()
    return response.ok({ success: true, data: stats, error: null })
  }
}
