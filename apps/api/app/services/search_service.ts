import db from '@adonisjs/lucid/services/db'
import { PAGINATION } from '@mykb/shared'

export interface SearchResult {
  readonly id: number
  readonly url: string
  readonly title: string | null
  readonly description: string | null
  readonly summary: string | null
  readonly faviconUrl: string | null
  readonly isFavorite: boolean
  readonly isArchived: boolean
  readonly createdAt: string
  readonly snippet: string
  readonly rank: number
}

interface SearchOptions {
  readonly userId: number
  readonly query: string
  readonly page?: number
  readonly limit?: number
}

export default class SearchService {
  async search(options: SearchOptions): Promise<{
    readonly results: readonly SearchResult[]
    readonly total: number
    readonly page: number
    readonly limit: number
  }> {
    const {
      userId,
      query,
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
    } = options

    const clampedLimit = Math.min(limit, PAGINATION.MAX_LIMIT)
    const offset = (page - 1) * clampedLimit

    const sanitized = sanitizeQuery(query)
    if (!sanitized) {
      return { results: [], total: 0, page, limit: clampedLimit }
    }

    // Count total matches (exclude archived bookmarks)
    const countResult = await db.rawQuery(
      `SELECT COUNT(*) as total
       FROM bookmarks_fts
       JOIN bookmarks ON bookmarks.id = bookmarks_fts.rowid
       WHERE bookmarks.user_id = ?
         AND bookmarks.is_archived = 0
         AND bookmarks_fts MATCH ?`,
      [userId, sanitized]
    )
    const total = countResult[0]?.total ?? 0

    if (total === 0) {
      return { results: [], total: 0, page, limit: clampedLimit }
    }

    // Search with snippets and ranking
    // snippet() col=0 targets 'title' column for best snippet extraction
    const rows = await db.rawQuery(
      `SELECT
         bookmarks.id,
         bookmarks.url,
         bookmarks.title,
         bookmarks.description,
         bookmarks.summary,
         bookmarks.favicon_url as faviconUrl,
         bookmarks.is_favorite as isFavorite,
         bookmarks.is_archived as isArchived,
         bookmarks.created_at as createdAt,
         snippet(bookmarks_fts, 0, '<mark>', '</mark>', '...', 40) as snippet,
         rank
       FROM bookmarks_fts
       JOIN bookmarks ON bookmarks.id = bookmarks_fts.rowid
       WHERE bookmarks.user_id = ?
         AND bookmarks.is_archived = 0
         AND bookmarks_fts MATCH ?
       ORDER BY rank
       LIMIT ? OFFSET ?`,
      [userId, sanitized, clampedLimit, offset]
    )

    return {
      results: rows as unknown as readonly SearchResult[],
      total,
      page,
      limit: clampedLimit,
    }
  }
}

/**
 * Sanitize user search query for FTS5 MATCH syntax.
 * Strips FTS5 operators (*, ", (), ^, {}, [], ~, +, -) and wraps terms
 * in double quotes with trailing * for prefix matching.
 * Double-quoting neutralizes AND/OR/NOT keywords and any remaining operators.
 */
function sanitizeQuery(raw: string): string {
  const trimmed = raw.trim().slice(0, 200)
  if (!trimmed) return ''

  // Remove all FTS5 special characters including + and -
  const cleaned = trimmed.replace(/[*"():^{}[\]~@#$%&\\|<>+\-]/g, ' ')

  // Split into words, filter empties
  const terms = cleaned.split(/\s+/).filter((t) => t.length > 0)
  if (terms.length === 0) return ''

  // Use prefix matching: each term gets a trailing *
  // Wrap in double quotes for safety, then join with spaces (implicit AND)
  return terms.map((t) => `"${t}"*`).join(' ')
}

// Export for testing
export { sanitizeQuery }
