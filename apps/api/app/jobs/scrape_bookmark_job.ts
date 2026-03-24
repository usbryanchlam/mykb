import { BaseJob } from '#jobs/base_job'
import type { JobConfig } from '#jobs/base_job'
import Bookmark from '#models/bookmark'
import ScraperService from '#services/scraper_service'
import StorageService from '#services/storage_service'
import { assertSafeUrl } from '#services/ssrf_guard'

const ALLOWED_IMAGE_EXTENSIONS: Record<string, string> = {
  jpeg: 'jpg',
  jpg: 'jpg',
  png: 'png',
  gif: 'gif',
  webp: 'webp',
  avif: 'avif',
  svg: 'svg',
}

export default class ScrapeBookmarkJob extends BaseJob {
  readonly name = 'scrape-bookmark'
  readonly bookmarkId: number
  private readonly scraper: ScraperService
  private readonly storage: StorageService

  constructor(
    bookmarkId: number,
    scraper: ScraperService = new ScraperService(),
    storage: StorageService = new StorageService(),
    config: Partial<JobConfig> = {}
  ) {
    super(config)
    this.bookmarkId = bookmarkId
    this.scraper = scraper
    this.storage = storage
  }

  async execute(): Promise<void> {
    const bookmark = await Bookmark.findOrFail(this.bookmarkId)

    bookmark.merge({ scrapeStatus: 'processing' })
    await bookmark.save()

    try {
      const result = await this.scraper.scrape(bookmark.url)

      // Upload OG image as thumbnail if available and storage is configured
      const thumbnailKey = await this.uploadThumbnail(bookmark.id, result.ogImageUrl)

      bookmark.merge({
        title: result.title ?? bookmark.title,
        description: result.description ?? bookmark.description,
        faviconUrl: result.faviconUrl,
        ogImageUrl: result.ogImageUrl,
        content: result.content,
        plainText: result.plainText,
        thumbnailKey: thumbnailKey ?? bookmark.thumbnailKey,
        scrapeStatus: 'completed',
        scrapeError: null,
      })
      await bookmark.save()
    } catch (error) {
      // Ensure status is never stuck at 'processing'
      const err = error instanceof Error ? error : new Error(String(error))
      bookmark.merge({
        scrapeStatus: 'failed',
        scrapeError: err.message.slice(0, 500),
      })
      await bookmark.save()
      throw error
    }
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

  /**
   * Downloads the OG image and uploads it to storage as a thumbnail.
   * Returns the storage key on success, null if skipped or failed.
   * Thumbnail failures are non-fatal — the scrape still succeeds.
   */
  private async uploadThumbnail(
    bookmarkId: number,
    ogImageUrl: string | null
  ): Promise<string | null> {
    if (!ogImageUrl || !this.storage.isConfigured) {
      return null
    }

    try {
      await assertSafeUrl(ogImageUrl)

      const response = await fetch(ogImageUrl, {
        signal: AbortSignal.timeout(10_000),
        headers: { 'User-Agent': 'MyKB/1.0 (+https://mykb.bryanlam.dev)' },
      })

      if (!response.ok) return null

      const contentType = response.headers.get('content-type') ?? 'image/jpeg'
      if (!contentType.startsWith('image/')) return null

      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Cap at 5MB for thumbnails
      if (buffer.byteLength > 5 * 1024 * 1024) return null

      const rawExt = contentType.split('/')[1]?.split(';')[0]?.toLowerCase().trim() ?? ''
      const ext = ALLOWED_IMAGE_EXTENSIONS[rawExt] ?? 'jpg'
      const key = `thumbnails/${bookmarkId}.${ext}`

      await this.storage.upload(key, buffer, contentType)
      return key
    } catch {
      // Thumbnail upload is best-effort — don't fail the scrape
      return null
    }
  }
}
