import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { ROLE_HIERARCHY } from '@mykb/shared'
import type { UserRole } from '@mykb/shared'

export default class RoleMiddleware {
  async handle(ctx: HttpContext, next: NextFn, options: { roles: UserRole[] }) {
    const user = ctx.auth0User
    if (!user) {
      return ctx.response.unauthorized({
        success: false,
        data: null,
        error: 'Authentication required',
      })
    }

    const userLevel = ROLE_HIERARCHY[user.role] ?? 0
    const requiredLevel = Math.min(...options.roles.map((r) => ROLE_HIERARCHY[r] ?? Infinity))

    if (userLevel < requiredLevel) {
      return ctx.response.forbidden({
        success: false,
        data: null,
        error: 'Insufficient permissions',
      })
    }

    return next()
  }
}
