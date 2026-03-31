import app from '@adonisjs/core/services/app'
import env from '#start/env'
import { defineConfig } from '@adonisjs/cors'

// Evaluated once at startup — requires process restart if env vars change.
function getAllowedOrigins(): boolean | string[] {
  if (app.inDev) return true

  const corsOrigin = env.get('CORS_ORIGIN')
  if (corsOrigin) {
    return corsOrigin
      .split(',')
      .map((o) => o.trim())
      .filter((o) => o.length > 0)
  }

  // Fallback: extract bare origin (scheme://host[:port]) from APP_URL
  // to match browser Origin header format (no trailing slash or path)
  const appUrl = new URL(env.get('APP_URL'))
  return [`${appUrl.protocol}//${appUrl.host}`]
}

/**
 * Configuration options to tweak the CORS policy. The following
 * options are documented on the official documentation website.
 *
 * https://docs.adonisjs.com/guides/security/cors
 */
const corsConfig = defineConfig({
  /**
   * Enable or disable CORS handling globally.
   */
  enabled: true,

  /**
   * In development, allow every origin to simplify local front/backend setup.
   * In production, use CORS_ORIGIN env var (comma-separated) or fall back to APP_URL.
   */
  origin: getAllowedOrigins(),

  /**
   * HTTP methods accepted for cross-origin requests.
   */
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],

  /**
   * Reflect request headers by default. Use a string array to restrict
   * allowed headers.
   */
  headers: true,

  /**
   * Response headers exposed to the browser.
   */
  exposeHeaders: [],

  /**
   * Allow cookies/authorization headers on cross-origin requests.
   */
  credentials: true,

  /**
   * Cache CORS preflight response for N seconds.
   */
  maxAge: 90,
})

export default corsConfig
