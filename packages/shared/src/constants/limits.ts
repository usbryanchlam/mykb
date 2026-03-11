export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const

export const SCRAPER = {
  TIMEOUT_MS: 15_000,
  MAX_RESPONSE_BYTES: 10 * 1024 * 1024, // 10MB
  MAX_REDIRECTS: 3,
} as const

export const JOBS = {
  MAX_CONCURRENCY: 2,
  MAX_ATTEMPTS: 3,
  BACKOFF_DELAYS_MS: [5_000, 30_000, 120_000] as const,
} as const

export const AI = {
  MAX_REQUESTS_PER_SECOND: 1,
  MAX_TAGS_PER_BOOKMARK: 5,
} as const
