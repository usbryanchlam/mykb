import { BaseJob } from '#jobs/base_job'
import type { JobConfig } from '#jobs/base_job'
import Bookmark from '#models/bookmark'
import AIService from '#services/ai_service'
import TagRepository from '#repositories/tag_repository'

export default class GenerateTagsJob extends BaseJob {
  readonly name = 'generate-tags'
  readonly bookmarkId: number
  private readonly aiService: AIService
  private readonly tagRepo: TagRepository

  constructor(
    bookmarkId: number,
    aiService: AIService = new AIService(),
    tagRepo: TagRepository = new TagRepository(),
    config: Partial<JobConfig> = {}
  ) {
    super(config)
    this.bookmarkId = bookmarkId
    this.aiService = aiService
    this.tagRepo = tagRepo
  }

  async execute(): Promise<void> {
    const bookmark = await Bookmark.findOrFail(this.bookmarkId)

    // Only generate tags for safe or skipped content
    if (bookmark.safetyStatus !== 'safe' && bookmark.safetyStatus !== 'skipped') {
      return
    }

    const tagNames = await this.aiService.generateTags(bookmark.plainText ?? '', bookmark.title)

    if (tagNames.length === 0) return

    const tags = await Promise.all(
      tagNames.map((name) => this.tagRepo.findOrCreateBySlug(bookmark.userId, name, true))
    )

    const tagIds = tags.map((t) => t.id)
    await bookmark.related('tags').sync(tagIds, false)
  }

  async onFailure(error: Error): Promise<void> {
    try {
      const bookmark = await Bookmark.find(this.bookmarkId)
      if (bookmark) {
        bookmark.merge({
          aiStatus: 'failed',
          aiError: `Tag generation failed: ${error.message.slice(0, 200)}`,
        })
        await bookmark.save()
      }
    } catch {
      // Best-effort — don't throw from onFailure
    }
  }
}
