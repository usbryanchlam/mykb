import JobService from '#services/job_service'
import ScrapeBookmarkJob from '#jobs/scrape_bookmark_job'
import ContentSafetyJob from '#jobs/content_safety_job'

/**
 * Orchestrates the bookmark processing pipeline:
 * 1. Scrape (metadata, content, thumbnail)
 * 2. Content safety check
 *
 * Each step is enqueued as a fire-and-forget job.
 * The safety job is chained after scrape completes via a wrapper job.
 */
export default class BookmarkPipelineService {
  private readonly jobService: JobService

  constructor(jobService: JobService = new JobService()) {
    this.jobService = jobService
  }

  /**
   * Trigger the full pipeline for a bookmark.
   * Returns immediately — processing happens in the background.
   */
  triggerPipeline(bookmarkId: number): void {
    this.jobService.enqueueAsync(new PipelineJob(bookmarkId, this.jobService))
  }
}

/**
 * Internal job that runs scrape → safety in sequence.
 * This ensures safety only runs after scrape completes successfully.
 */
class PipelineJob {
  readonly name = 'bookmark-pipeline'
  readonly bookmarkId: number
  readonly config = { maxAttempts: 1, backoffMs: 1000, backoffMultiplier: 2 }
  private readonly jobService: JobService

  constructor(bookmarkId: number, jobService: JobService) {
    this.bookmarkId = bookmarkId
    this.jobService = jobService
  }

  async execute(): Promise<void> {
    // Step 1: Scrape
    await this.jobService.enqueue(new ScrapeBookmarkJob(this.bookmarkId))

    // Step 2: Content safety (only runs if scrape succeeded)
    await this.jobService.enqueue(new ContentSafetyJob(this.bookmarkId))
  }

  async onFailure(_error: Error): Promise<void> {
    // Individual jobs handle their own failure — nothing extra needed here
  }
}
