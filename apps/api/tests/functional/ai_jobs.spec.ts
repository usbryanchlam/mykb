import { randomUUID } from 'node:crypto'
import { test } from '@japa/runner'
import { createTestToken } from '#tests/helpers/auth'

async function createUserAndGetId(client: any) {
  const sub = `auth0|ai-job-${randomUUID()}`
  const token = await createTestToken({
    sub,
    email: `${sub}@example.com`,
    roles: ['editor'],
  })
  const meRes = await client.get('/api/me').bearerToken(token)
  const userId = meRes.body().data.id as number
  return { token, userId }
}

async function createBookmarkForUser(userId: number, overrides: Record<string, any> = {}) {
  const { default: Bookmark } = await import('#models/bookmark')
  return Bookmark.create({
    userId,
    url: `https://ai-job-${randomUUID()}.example.com`,
    scrapeStatus: 'completed',
    safetyStatus: 'safe',
    aiStatus: 'pending',
    ...overrides,
  })
}

test.group('SummarizeBookmarkJob', () => {
  test('summarizes a safe bookmark', async ({ client, assert }) => {
    const { userId } = await createUserAndGetId(client)
    const { default: SummarizeBookmarkJob } = await import('#jobs/summarize_bookmark_job')

    const bookmark = await createBookmarkForUser(userId, {
      title: 'Test Article',
      plainText:
        'This is a long article about software development best practices. ' +
        'It covers testing, code review, and continuous integration. ' +
        'Teams that adopt these practices see significant improvements in code quality.',
    })

    const mockAIService = {
      summarize: async () => 'This article covers software development best practices.',
      generateTags: async () => [],
    }

    const job = new SummarizeBookmarkJob(bookmark.id, mockAIService as any)
    await job.execute()

    const { default: Bookmark } = await import('#models/bookmark')
    const updated = await Bookmark.findOrFail(bookmark.id)
    assert.equal(updated.summary, 'This article covers software development best practices.')
    assert.equal(updated.aiStatus, 'completed')
  })

  test('skips bookmark with flagged safety status', async ({ client, assert }) => {
    const { userId } = await createUserAndGetId(client)
    const { default: SummarizeBookmarkJob } = await import('#jobs/summarize_bookmark_job')

    const bookmark = await createBookmarkForUser(userId, {
      safetyStatus: 'flagged',
    })

    const mockAIService = {
      summarize: async () => {
        throw new Error('Should not be called')
      },
      generateTags: async () => [],
    }

    const job = new SummarizeBookmarkJob(bookmark.id, mockAIService as any)
    await job.execute()

    const { default: Bookmark } = await import('#models/bookmark')
    const updated = await Bookmark.findOrFail(bookmark.id)
    assert.equal(updated.aiStatus, 'skipped')
    assert.isNull(updated.summary)
  })

  test('handles null summary from AI service', async ({ client, assert }) => {
    const { userId } = await createUserAndGetId(client)
    const { default: SummarizeBookmarkJob } = await import('#jobs/summarize_bookmark_job')

    const bookmark = await createBookmarkForUser(userId, {
      plainText: 'Short text.',
    })

    const mockAIService = {
      summarize: async () => null,
      generateTags: async () => [],
    }

    const job = new SummarizeBookmarkJob(bookmark.id, mockAIService as any)
    await job.execute()

    const { default: Bookmark } = await import('#models/bookmark')
    const updated = await Bookmark.findOrFail(bookmark.id)
    assert.isNull(updated.summary)
    assert.equal(updated.aiStatus, 'completed')
  })

  test('sets failed status on error', async ({ client, assert }) => {
    const { userId } = await createUserAndGetId(client)
    const { default: SummarizeBookmarkJob } = await import('#jobs/summarize_bookmark_job')

    const bookmark = await createBookmarkForUser(userId)

    const job = new SummarizeBookmarkJob(bookmark.id)
    await job.onFailure(new Error('API timeout'))

    const { default: Bookmark } = await import('#models/bookmark')
    const updated = await Bookmark.findOrFail(bookmark.id)
    assert.equal(updated.aiStatus, 'failed')
    assert.include(updated.aiError, 'Summarization failed: API timeout')
  })

  test('processes bookmark with skipped safety status', async ({ client, assert }) => {
    const { userId } = await createUserAndGetId(client)
    const { default: SummarizeBookmarkJob } = await import('#jobs/summarize_bookmark_job')

    const bookmark = await createBookmarkForUser(userId, {
      safetyStatus: 'skipped',
      plainText:
        'Content that was not safety checked but should still be summarized. ' +
        'This happens when scraping fails but we still want AI processing.',
    })

    const mockAIService = {
      summarize: async () => 'Summary of skipped-safety content.',
      generateTags: async () => [],
    }

    const job = new SummarizeBookmarkJob(bookmark.id, mockAIService as any)
    await job.execute()

    const { default: Bookmark } = await import('#models/bookmark')
    const updated = await Bookmark.findOrFail(bookmark.id)
    assert.equal(updated.summary, 'Summary of skipped-safety content.')
    assert.equal(updated.aiStatus, 'completed')
  })
})

test.group('GenerateTagsJob', () => {
  test('generates tags for a safe bookmark', async ({ client, assert }) => {
    const { userId } = await createUserAndGetId(client)
    const { default: GenerateTagsJob } = await import('#jobs/generate_tags_job')

    const bookmark = await createBookmarkForUser(userId, {
      title: 'JavaScript Frameworks Guide',
      plainText:
        'A comprehensive guide to JavaScript frameworks including React, Vue, and Angular. ' +
        'Each framework offers unique advantages for building modern web applications.',
    })

    const uniqueSuffix = randomUUID().slice(0, 8)
    const mockAIService = {
      summarize: async () => null,
      generateTags: async () => [`javascript-${uniqueSuffix}`, `web-dev-${uniqueSuffix}`],
    }

    const job = new GenerateTagsJob(bookmark.id, mockAIService as any)
    await job.execute()

    await bookmark.load('tags')
    assert.equal(bookmark.tags.length, 2)

    const slugs = bookmark.tags.map((t) => t.slug)
    assert.include(slugs, `javascript-${uniqueSuffix}`)
    assert.include(slugs, `web-dev-${uniqueSuffix}`)

    // Verify tags are marked as AI-generated
    for (const tag of bookmark.tags) {
      assert.ok(tag.isAiGenerated)
    }
  })

  test('skips bookmark with flagged safety status', async ({ client, assert }) => {
    const { userId } = await createUserAndGetId(client)
    const { default: GenerateTagsJob } = await import('#jobs/generate_tags_job')

    const bookmark = await createBookmarkForUser(userId, {
      safetyStatus: 'flagged',
    })

    const mockAIService = {
      summarize: async () => null,
      generateTags: async () => {
        throw new Error('Should not be called')
      },
    }

    const job = new GenerateTagsJob(bookmark.id, mockAIService as any)
    await job.execute()

    await bookmark.load('tags')
    assert.equal(bookmark.tags.length, 0)
  })

  test('handles empty tags from AI service', async ({ client, assert }) => {
    const { userId } = await createUserAndGetId(client)
    const { default: GenerateTagsJob } = await import('#jobs/generate_tags_job')

    const bookmark = await createBookmarkForUser(userId, {
      plainText: 'Short.',
    })

    const mockAIService = {
      summarize: async () => null,
      generateTags: async () => [],
    }

    const job = new GenerateTagsJob(bookmark.id, mockAIService as any)
    await job.execute()

    await bookmark.load('tags')
    assert.equal(bookmark.tags.length, 0)
  })

  test('sets error on failure', async ({ client, assert }) => {
    const { userId } = await createUserAndGetId(client)
    const { default: GenerateTagsJob } = await import('#jobs/generate_tags_job')

    const bookmark = await createBookmarkForUser(userId)

    const job = new GenerateTagsJob(bookmark.id)
    await job.onFailure(new Error('Gemini rate limited'))

    const { default: Bookmark } = await import('#models/bookmark')
    const updated = await Bookmark.findOrFail(bookmark.id)
    assert.equal(updated.aiStatus, 'failed')
    assert.include(updated.aiError, 'Tag generation failed: Gemini rate limited')
  })

  test('reuses existing tags by slug', async ({ client, assert }) => {
    const { userId } = await createUserAndGetId(client)
    const { default: GenerateTagsJob } = await import('#jobs/generate_tags_job')
    const { default: Tag } = await import('#models/tag')

    const uniqueSlug = `existing-tag-${randomUUID().slice(0, 8)}`

    // Pre-create a tag for this user
    const existingTag = await Tag.create({
      userId,
      name: uniqueSlug,
      slug: uniqueSlug,
      isAiGenerated: false,
    })

    const bookmark = await createBookmarkForUser(userId, {
      title: 'Reuse Test',
      plainText:
        'Content for testing tag reuse when tags already exist in the system. ' +
        'This verifies find-or-create behavior.',
    })

    const mockAIService = {
      summarize: async () => null,
      generateTags: async () => [uniqueSlug],
    }

    const job = new GenerateTagsJob(bookmark.id, mockAIService as any)
    await job.execute()

    await bookmark.load('tags')
    assert.equal(bookmark.tags.length, 1)
    assert.equal(bookmark.tags[0].id, existingTag.id)
  })
})
