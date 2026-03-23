import { BaseJob } from '#jobs/base_job'
import type { JobConfig } from '#jobs/base_job'
import Bookmark from '#models/bookmark'
import ScraperService from '#services/scraper_service'

export default class ScrapeBookmarkJob extends BaseJob {
  readonly name = 'scrape-bookmark'
  readonly bookmarkId: number
  private readonly scraper: ScraperService

  constructor(
    bookmarkId: number,
    scraper: ScraperService = new ScraperService(),
    config: Partial<JobConfig> = {}
  ) {
    super(config)
    this.bookmarkId = bookmarkId
    this.scraper = scraper
  }

  async execute(): Promise<void> {
    const bookmark = await Bookmark.findOrFail(this.bookmarkId)

    bookmark.merge({ scrapeStatus: 'processing' })
    await bookmark.save()

    const result = await this.scraper.scrape(bookmark.url)

    bookmark.merge({
      title: result.title ?? bookmark.title,
      description: result.description ?? bookmark.description,
      faviconUrl: result.faviconUrl,
      ogImageUrl: result.ogImageUrl,
      content: result.content,
      plainText: result.plainText,
      scrapeStatus: 'completed',
      scrapeError: null,
    })
    await bookmark.save()
  }

  async onFailure(error: Error): Promise<void> {
    try {
      const bookmark = await Bookmark.find(this.bookmarkId)
      if (bookmark) {
        bookmark.merge({
          scrapeStatus: 'failed',
          scrapeError: error.message.slice(0, 500),
        })
        await bookmark.save()
      }
    } catch {
      // Best-effort — don't throw from onFailure
    }
  }
}
