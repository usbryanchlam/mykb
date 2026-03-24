import { BaseJob } from '#jobs/base_job'
import type { JobConfig } from '#jobs/base_job'
import Bookmark from '#models/bookmark'
import ContentSafetyService from '#services/content_safety_service'

export default class ContentSafetyJob extends BaseJob {
  readonly name = 'content-safety'
  readonly bookmarkId: number
  private readonly safetyService: ContentSafetyService

  constructor(
    bookmarkId: number,
    safetyService: ContentSafetyService = new ContentSafetyService(),
    config: Partial<JobConfig> = {}
  ) {
    super(config)
    this.bookmarkId = bookmarkId
    this.safetyService = safetyService
  }

  async execute(): Promise<void> {
    const bookmark = await Bookmark.findOrFail(this.bookmarkId)

    // Only run safety check if scrape completed — no content to analyze otherwise
    if (bookmark.scrapeStatus !== 'completed') {
      bookmark.merge({ safetyStatus: 'skipped' })
      await bookmark.save()
      return
    }

    const result = await this.safetyService.check(
      bookmark.url,
      bookmark.content,
      bookmark.plainText
    )

    bookmark.merge({
      safetyStatus: result.verdict,
      safetyReasons: result.reasons.length > 0 ? [...result.reasons] : null,
    })
    await bookmark.save()
  }

  async onFailure(error: Error): Promise<void> {
    try {
      const bookmark = await Bookmark.find(this.bookmarkId)
      if (bookmark) {
        bookmark.merge({
          safetyStatus: 'failed',
          safetyReasons: [`Safety check failed: ${error.message.slice(0, 200)}`],
        })
        await bookmark.save()
      }
    } catch {
      // Best-effort — don't throw from onFailure
    }
  }
}
