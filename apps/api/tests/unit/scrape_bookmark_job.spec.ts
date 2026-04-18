import { test } from '@japa/runner'
import Bookmark from '#models/bookmark'
import User from '#models/user'
import ScrapeBookmarkJob from '#jobs/scrape_bookmark_job'
import type ScraperService from '#services/scraper_service'
import type { ScrapeResult } from '#services/scraper_service'
import type YouTubeService from '#services/youtube_service'

async function createTestBookmark(url = 'https://example.com'): Promise<Bookmark> {
  const user = await User.create({
    auth0Sub: `auth0|scrape-test-${crypto.randomUUID()}`,
    email: `scrape-${crypto.randomUUID()}@test.com`,
    name: 'Scrape Test User',
    role: 'editor',
  })
  return Bookmark.create({ userId: user.id, url })
}

function createMockScraper(result: Partial<ScrapeResult> = {}): ScraperService {
  const defaultResult: ScrapeResult = {
    title: 'Scraped Title',
    description: 'Scraped description',
    faviconUrl: 'https://example.com/favicon.ico',
    ogImageUrl: 'https://example.com/og.png',
    content: '<p>Article content</p>',
    plainText: 'Article content',
    ...result,
  }

  return {
    scrape: async () => defaultResult,
  } as unknown as ScraperService
}

function createFailingScraper(errorMessage: string): ScraperService {
  return {
    scrape: async () => {
      throw new Error(errorMessage)
    },
  } as unknown as ScraperService
}

test.group('ScrapeBookmarkJob', () => {
  test('updates bookmark with scraped data on success', async ({ assert }) => {
    const bookmark = await createTestBookmark()
    const scraper = createMockScraper()
    const job = new ScrapeBookmarkJob(bookmark.id, scraper, undefined, undefined, {
      maxAttempts: 1,
    })

    await job.execute()

    await bookmark.refresh()
    assert.equal(bookmark.title, 'Scraped Title')
    assert.equal(bookmark.description, 'Scraped description')
    assert.equal(bookmark.faviconUrl, 'https://example.com/favicon.ico')
    assert.equal(bookmark.ogImageUrl, 'https://example.com/og.png')
    assert.equal(bookmark.content, '<p>Article content</p>')
    assert.equal(bookmark.plainText, 'Article content')
    assert.equal(bookmark.scrapeStatus, 'completed')
    assert.isNull(bookmark.scrapeError)
  })

  test('sets scrapeStatus to processing during execution', async ({ assert }) => {
    const bookmark = await createTestBookmark()
    let statusDuringExecution: string | null = null

    const scraper = {
      scrape: async () => {
        const mid = await Bookmark.findOrFail(bookmark.id)
        statusDuringExecution = mid.scrapeStatus
        return {
          title: 'Title',
          description: null,
          faviconUrl: null,
          ogImageUrl: null,
          content: null,
          plainText: null,
        }
      },
    } as unknown as ScraperService

    const job = new ScrapeBookmarkJob(bookmark.id, scraper, undefined, undefined, {
      maxAttempts: 1,
    })
    await job.execute()

    assert.equal(statusDuringExecution, 'processing')
  })

  test('preserves existing title when scrape returns null', async ({ assert }) => {
    const bookmark = await createTestBookmark()
    bookmark.merge({ title: 'Original Title' })
    await bookmark.save()

    const scraper = createMockScraper({ title: null })
    const job = new ScrapeBookmarkJob(bookmark.id, scraper, undefined, undefined, {
      maxAttempts: 1,
    })
    await job.execute()

    await bookmark.refresh()
    assert.equal(bookmark.title, 'Original Title')
  })

  test('sets scrapeStatus to failed and records error on failure', async ({ assert }) => {
    const bookmark = await createTestBookmark()
    const scraper = createFailingScraper('Connection refused')
    const job = new ScrapeBookmarkJob(bookmark.id, scraper, undefined, undefined, {
      maxAttempts: 1,
    })

    await job.onFailure(new Error('Connection refused'))

    await bookmark.refresh()
    assert.equal(bookmark.scrapeStatus, 'failed')
    assert.equal(bookmark.scrapeError, 'Connection refused')
  })

  test('truncates long error messages in onFailure', async ({ assert }) => {
    const bookmark = await createTestBookmark()
    const longError = 'x'.repeat(600)
    const job = new ScrapeBookmarkJob(
      bookmark.id,
      createFailingScraper(longError),
      undefined,
      undefined,
      { maxAttempts: 1 }
    )

    await job.onFailure(new Error(longError))

    await bookmark.refresh()
    assert.isAtMost(bookmark.scrapeError!.length, 500)
  })

  test('has correct job name', ({ assert }) => {
    const job = new ScrapeBookmarkJob(1)
    assert.equal(job.name, 'scrape-bookmark')
  })

  test('routes YouTube URLs to YouTubeService', async ({ assert }) => {
    const bookmark = await createTestBookmark('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    let youtubeScrapeCalled = false

    const scraper = createMockScraper()
    const youtube = {
      scrape: async () => {
        youtubeScrapeCalled = true
        return {
          title: 'YouTube Video Title',
          description: 'YouTube video by Author',
          faviconUrl: 'https://www.youtube.com/favicon.ico',
          ogImageUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
          content: '<p><span class="timestamp">[0:00]</span> Hello</p>',
          plainText: 'Hello',
        }
      },
    } as unknown as YouTubeService

    const job = new ScrapeBookmarkJob(bookmark.id, scraper, youtube, undefined, {
      maxAttempts: 1,
    })
    await job.execute()

    assert.isTrue(youtubeScrapeCalled)
    await bookmark.refresh()
    assert.equal(bookmark.title, 'YouTube Video Title')
    assert.equal(bookmark.description, 'YouTube video by Author')
    assert.equal(bookmark.scrapeStatus, 'completed')
  })

  test('routes non-YouTube URLs to ScraperService', async ({ assert }) => {
    const bookmark = await createTestBookmark('https://example.com/article')
    let regularScrapeCalled = false

    const scraper = {
      scrape: async () => {
        regularScrapeCalled = true
        return {
          title: 'Regular Article',
          description: 'A description',
          faviconUrl: null,
          ogImageUrl: null,
          content: '<p>Content</p>',
          plainText: 'Content',
        }
      },
    } as unknown as ScraperService

    const youtube = {
      scrape: async () => {
        throw new Error('Should not be called')
      },
    } as unknown as YouTubeService

    const job = new ScrapeBookmarkJob(bookmark.id, scraper, youtube, undefined, {
      maxAttempts: 1,
    })
    await job.execute()

    assert.isTrue(regularScrapeCalled)
    await bookmark.refresh()
    assert.equal(bookmark.title, 'Regular Article')
  })

  test('handles YouTube scrape returning null content gracefully', async ({ assert }) => {
    const bookmark = await createTestBookmark('https://youtu.be/dQw4w9WgXcQ')

    const youtube = {
      scrape: async () => ({
        title: 'Video Title',
        description: null,
        faviconUrl: 'https://www.youtube.com/favicon.ico',
        ogImageUrl: null,
        content: null,
        plainText: null,
      }),
    } as unknown as YouTubeService

    const job = new ScrapeBookmarkJob(bookmark.id, createMockScraper(), youtube, undefined, {
      maxAttempts: 1,
    })
    await job.execute()

    await bookmark.refresh()
    assert.equal(bookmark.title, 'Video Title')
    assert.isNull(bookmark.content)
    assert.isNull(bookmark.plainText)
    assert.equal(bookmark.scrapeStatus, 'completed')
  })
})
