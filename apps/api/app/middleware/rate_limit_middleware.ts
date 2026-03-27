import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

interface RateLimitEntry {
  readonly count: number
  readonly resetAt: number
}

interface RateLimitOptions {
  readonly maxRequests: number
  readonly windowMs: number
}

const DEFAULT_OPTIONS: RateLimitOptions = {
  maxRequests: 100,
  windowMs: 60_000,
}

// In-memory store keyed by identifier (user ID or IP)
const store = new Map<string, RateLimitEntry>()

// Cleanup expired entries periodically.
// unref() allows Node to exit cleanly even if this timer is pending.
const cleanupInterval = setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) {
      store.delete(key)
    }
  }
}, 60_000)
cleanupInterval.unref()

export default class RateLimitMiddleware {
  async handle(ctx: HttpContext, next: NextFn, options?: RateLimitOptions) {
    const { maxRequests, windowMs } = options ?? DEFAULT_OPTIONS
    const identifier = ctx.auth0User?.id?.toString() ?? ctx.request.ip()
    // Include both maxRequests and windowMs in key to prevent cross-option bucket collision
    const key = `${identifier}:${maxRequests}:${windowMs}`
    const now = Date.now()

    let entry = store.get(key)

    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs }
    }

    // Immutable update: create new entry with incremented count
    const updated = { ...entry, count: entry.count + 1 }
    store.set(key, updated)

    const remaining = Math.max(0, maxRequests - updated.count)
    const retryAfter = Math.ceil((updated.resetAt - now) / 1000)

    ctx.response.header('X-RateLimit-Limit', String(maxRequests))
    ctx.response.header('X-RateLimit-Remaining', String(remaining))
    // X-RateLimit-Reset as Unix timestamp in seconds (per IETF convention)
    ctx.response.header('X-RateLimit-Reset', String(Math.floor(updated.resetAt / 1000)))

    if (updated.count > maxRequests) {
      ctx.response.header('Retry-After', String(retryAfter))
      return ctx.response.tooManyRequests({
        success: false,
        data: null,
        error: 'Too many requests. Please try again later.',
      })
    }

    return next()
  }
}

// Export for testing
export { store as rateLimitStore }
