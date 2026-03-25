import { BaseJob } from '#jobs/base_job'
import type { JobConfig } from '#jobs/base_job'
import Bookmark from '#models/bookmark'
import AIService from '#services/ai_service'

export default class SummarizeBookmarkJob extends BaseJob {
  readonly name = 'summarize-bookmark'
  readonly bookmarkId: number
  private readonly aiService: AIService

  constructor(
    bookmarkId: number,
    aiService: AIService = new AIService(),
    config: Partial<JobConfig> = {}
  ) {
    super(config)
    this.bookmarkId = bookmarkId
    this.aiService = aiService
  }

  async execute(): Promise<void> {
    const bookmark = await Bookmark.findOrFail(this.bookmarkId)

    // Only summarize safe or skipped content
    if (bookmark.safetyStatus !== 'safe' && bookmark.safetyStatus !== 'skipped') {
      bookmark.merge({ aiStatus: 'skipped' })
      await bookmark.save()
      return
    }

    bookmark.merge({ aiStatus: 'processing' })
    await bookmark.save()

    try {
      const summary = await this.aiService.summarize(bookmark.plainText ?? '')

      bookmark.merge({
        summary,
        aiStatus: 'completed',
      })
      await bookmark.save()
    } catch (error) {
      bookmark.merge({ aiStatus: 'failed' })
      await bookmark.save()
      throw error
    }
  }

  async onFailure(error: Error): Promise<void> {
    try {
      const bookmark = await Bookmark.find(this.bookmarkId)
      if (bookmark) {
        bookmark.merge({
          aiStatus: 'failed',
          aiError: `Summarization failed: ${error.message.slice(0, 200)}`,
        })
        await bookmark.save()
      }
    } catch {
      // Best-effort — don't throw from onFailure
    }
  }
}
