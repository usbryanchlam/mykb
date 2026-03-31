/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  // Node
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),

  // App
  APP_KEY: Env.schema.secret(),
  APP_URL: Env.schema.string({ format: 'url', tld: false }),
  CORS_ORIGIN: Env.schema.string.optional(),

  // Auth0
  AUTH0_ISSUER_BASE_URL: Env.schema.string({ format: 'url', tld: false }),
  AUTH0_AUDIENCE: Env.schema.string(),

  // Content Safety (optional — features degrade gracefully without keys)
  GOOGLE_SAFE_BROWSING_API_KEY: Env.schema.string.optional(),
  GEMINI_API_KEY: Env.schema.string.optional(),

  // OCI Object Storage (optional — thumbnail uploads disabled without config)
  OCI_OBJECT_STORAGE_NAMESPACE: Env.schema.string.optional(),
  OCI_OBJECT_STORAGE_BUCKET: Env.schema.string.optional(),
  OCI_ACCESS_KEY: Env.schema.string.optional(),
  OCI_SECRET_KEY: Env.schema.string.optional(),
  OCI_REGION: Env.schema.string.optional(),
})
