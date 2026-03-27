import db from '@adonisjs/lucid/services/db'

export interface AppStats {
  readonly users: number
  readonly bookmarks: number
  readonly tags: number
  readonly collections: number
  readonly smartLists: number
  readonly jobs: {
    readonly total: number
    readonly completed: number
    readonly failed: number
    readonly processing: number
  }
  readonly scrapeStats: {
    readonly completed: number
    readonly failed: number
    readonly pending: number
  }
  readonly safetyStats: {
    readonly safe: number
    readonly flagged: number
    readonly failed: number
  }
}

export default class AdminService {
  async getStats(): Promise<AppStats> {
    const [users, bookmarks, tags, collections, smartLists, jobs, scrapeStats, safetyStats] =
      await Promise.all([
        this.count('users'),
        this.count('bookmarks'),
        this.count('tags'),
        this.count('collections'),
        this.count('smart_lists'),
        this.getJobStats(),
        this.getScrapeStats(),
        this.getSafetyStats(),
      ])

    return { users, bookmarks, tags, collections, smartLists, jobs, scrapeStats, safetyStats }
  }

  private async count(table: string): Promise<number> {
    const result = await db.rawQuery(`SELECT COUNT(*) as count FROM ${table}`)
    return result[0]?.count ?? 0
  }

  private async getJobStats() {
    const rows = await db.rawQuery(`SELECT status, COUNT(*) as count FROM job_logs GROUP BY status`)
    const stats = { total: 0, completed: 0, failed: 0, processing: 0 }
    for (const row of rows) {
      const count = row.count as number
      stats.total += count
      if (row.status === 'completed') stats.completed = count
      else if (row.status === 'failed') stats.failed = count
      else if (row.status === 'processing') stats.processing = count
    }
    return stats
  }

  private async getScrapeStats() {
    const rows = await db.rawQuery(
      `SELECT scrape_status as status, COUNT(*) as count FROM bookmarks GROUP BY scrape_status`
    )
    const stats = { completed: 0, failed: 0, pending: 0 }
    for (const row of rows) {
      if (row.status === 'completed') stats.completed = row.count as number
      else if (row.status === 'failed') stats.failed = row.count as number
      else if (row.status === 'pending') stats.pending = row.count as number
    }
    return stats
  }

  private async getSafetyStats() {
    const rows = await db.rawQuery(
      `SELECT safety_status as status, COUNT(*) as count FROM bookmarks GROUP BY safety_status`
    )
    const stats = { safe: 0, flagged: 0, failed: 0 }
    for (const row of rows) {
      if (row.status === 'safe') stats.safe = row.count as number
      else if (row.status === 'flagged') stats.flagged = row.count as number
      else if (row.status === 'failed') stats.failed = row.count as number
    }
    return stats
  }
}
