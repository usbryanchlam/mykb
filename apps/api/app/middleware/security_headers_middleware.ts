import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class SecurityHeadersMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    ctx.response.header('X-Frame-Options', 'DENY')
    ctx.response.header('X-Content-Type-Options', 'nosniff')
    ctx.response.header('X-XSS-Protection', '0')
    ctx.response.header('Referrer-Policy', 'strict-origin-when-cross-origin')
    ctx.response.header(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=()'
    )
    ctx.response.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'")
    // HSTS should be set at the CDN/load balancer level, not the application.
    // See docs/PHASE9_TASKS.md deployment checklist.

    return next()
  }
}
