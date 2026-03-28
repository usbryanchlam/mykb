import app from '@adonisjs/core/services/app'
import { type HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction

  async handle(error: unknown, ctx: HttpContext) {
    const err = error as { status?: number; message?: string }
    const status = err.status ?? 500

    // Custom envelope for consistent {success, data, error} format.
    // In production, hide internal details for server errors.
    const message =
      app.inProduction && status >= 500 ? 'Internal server error' : (err.message ?? 'Unknown error')

    ctx.response.status(status).send({
      success: false,
      data: null,
      error: message,
    })
  }

  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}
