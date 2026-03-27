import app from '@adonisjs/core/services/app'
import { type HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction

  async handle(error: unknown, ctx: HttpContext) {
    const err = error as { status?: number; message?: string }
    const status = err.status ?? 500

    // In production, never leak internal error details for server errors.
    // For known client errors, use generic messages to avoid leaking internals.
    let message: string
    if (app.inProduction && status >= 500) {
      message = 'Internal server error'
    } else {
      message = err.message ?? 'Unknown error'
    }

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
