import { test } from '@japa/runner'
import ContentSafetyService from '#services/content_safety_service'

test.group('ContentSafetyService — checkHtmlSanitization', () => {
  test('returns empty for clean HTML', async ({ assert }) => {
    const service = new ContentSafetyService()
    const reasons = await service.checkHtmlSanitization('<p>Hello world</p>')
    assert.deepEqual(reasons, [])
  })

  test('returns empty for null HTML', async ({ assert }) => {
    const service = new ContentSafetyService()
    const reasons = await service.checkHtmlSanitization(null)
    assert.deepEqual(reasons, [])
  })

  test('detects inline scripts', async ({ assert }) => {
    const service = new ContentSafetyService()
    const html = '<div><script>alert("xss")</script></div>'
    const reasons = await service.checkHtmlSanitization(html)
    assert.isAbove(reasons.length, 0)
    assert.ok(reasons.some((r) => r.includes('inline scripts')))
  })

  test('detects inline event handlers', async ({ assert }) => {
    const service = new ContentSafetyService()
    const html = '<img onerror="alert(1)" src="x">'
    const reasons = await service.checkHtmlSanitization(html)
    assert.isAbove(reasons.length, 0)
    assert.ok(reasons.some((r) => r.includes('event handlers')))
  })

  test('detects javascript: URIs', async ({ assert }) => {
    const service = new ContentSafetyService()
    const html = '<a href="javascript:void(0)">click</a>'
    const reasons = await service.checkHtmlSanitization(html)
    assert.isAbove(reasons.length, 0)
    assert.ok(reasons.some((r) => r.includes('javascript:')))
  })

  test('detects embedded objects', async ({ assert }) => {
    const service = new ContentSafetyService()
    const html = '<object data="malware.swf"></object>'
    const reasons = await service.checkHtmlSanitization(html)
    assert.isAbove(reasons.length, 0)
    assert.ok(reasons.some((r) => r.includes('embedded objects')))
  })

  test('detects iframes', async ({ assert }) => {
    const service = new ContentSafetyService()
    const reasons = await service.checkHtmlSanitization('<iframe src="https://evil.com"></iframe>')
    assert.isAbove(reasons.length, 0)
    assert.ok(reasons.some((r) => r.includes('iframes')))
  })

  test('detects iframe srcdoc bypass', async ({ assert }) => {
    const service = new ContentSafetyService()
    const reasons = await service.checkHtmlSanitization(
      '<iframe srcdoc="<script>alert(1)</script>"></iframe>'
    )
    assert.isAbove(reasons.length, 0)
  })

  test('detects unquoted event handlers', async ({ assert }) => {
    const service = new ContentSafetyService()
    const reasons = await service.checkHtmlSanitization('<img onerror=alert(1)>')
    assert.isAbove(reasons.length, 0)
    assert.ok(reasons.some((r) => r.includes('event handlers')))
  })

  test('detects multiple issues', async ({ assert }) => {
    const service = new ContentSafetyService()
    const html = '<script>bad()</script><img onerror="x">'
    const reasons = await service.checkHtmlSanitization(html)
    assert.isAtLeast(reasons.length, 2)
  })
})

test.group('ContentSafetyService — check (integration)', () => {
  test('returns safe when HTML is clean and no API keys configured', async ({ assert }) => {
    const service = new ContentSafetyService()
    const result = await service.check(
      'https://example.com',
      '<p>Clean content</p>',
      'Clean content'
    )
    // Without API keys, Safe Browsing and Gemini are skipped.
    // Only HTML sanitization runs. Clean HTML → safe or skipped.
    assert.oneOf(result.verdict, ['safe', 'skipped'])
    assert.deepEqual(result.reasons, [])
  })

  test('returns flagged when HTML has dangerous patterns', async ({ assert }) => {
    const service = new ContentSafetyService()
    const result = await service.check(
      'https://example.com',
      '<script>steal_cookies()</script><p>Content</p>',
      'Content'
    )
    assert.equal(result.verdict, 'flagged')
    assert.isAbove(result.reasons.length, 0)
  })

  test('returns skipped when all inputs are null and no API keys', async ({ assert }) => {
    const service = new ContentSafetyService()
    const result = await service.check('https://example.com', null, null)
    // Without API keys, Safe Browsing and Gemini throw (skipped via allSettled).
    // HTML sanitization returns [] for null input — no meaningful check ran.
    assert.equal(result.verdict, 'skipped')
    assert.deepEqual(result.reasons, [])
  })
})

test.group('ContentSafetyService — ContentSafetyJob', () => {
  test('updates bookmark with safety result', async ({ assert }) => {
    const { default: User } = await import('#models/user')
    const { default: Bookmark } = await import('#models/bookmark')
    const { default: ContentSafetyJob } = await import('#jobs/content_safety_job')

    const user = await User.create({
      auth0Sub: `auth0|safety-test-${crypto.randomUUID()}`,
      email: `safety-${crypto.randomUUID()}@test.com`,
      name: 'Safety Test User',
      role: 'editor',
    })

    const bookmark = await Bookmark.create({
      userId: user.id,
      url: 'https://safe-example.com',
      content: '<p>Safe content</p>',
      plainText: 'Safe content',
      scrapeStatus: 'completed',
    })

    const mockService = {
      check: async () => ({ verdict: 'safe' as const, reasons: [] }),
    } as unknown as ContentSafetyService

    const job = new ContentSafetyJob(bookmark.id, mockService, { maxAttempts: 1 })
    await job.execute()

    await bookmark.refresh()
    assert.equal(bookmark.safetyStatus, 'safe')
    assert.isNull(bookmark.safetyReasons)
  })

  test('updates bookmark with flagged result and reasons', async ({ assert }) => {
    const { default: User } = await import('#models/user')
    const { default: Bookmark } = await import('#models/bookmark')
    const { default: ContentSafetyJob } = await import('#jobs/content_safety_job')

    const user = await User.create({
      auth0Sub: `auth0|safety-flag-${crypto.randomUUID()}`,
      email: `safety-flag-${crypto.randomUUID()}@test.com`,
      name: 'Safety Flag User',
      role: 'editor',
    })

    const bookmark = await Bookmark.create({
      userId: user.id,
      url: 'https://flagged-example.com',
      content: '<script>bad()</script>',
      plainText: 'Bad content',
      scrapeStatus: 'completed',
    })

    const mockService = {
      check: async () => ({
        verdict: 'flagged' as const,
        reasons: ['HTML sanitization: Contains inline scripts'],
      }),
    } as unknown as ContentSafetyService

    const job = new ContentSafetyJob(bookmark.id, mockService, { maxAttempts: 1 })
    await job.execute()

    await bookmark.refresh()
    assert.equal(bookmark.safetyStatus, 'flagged')
    assert.isArray(bookmark.safetyReasons)
    assert.isAbove(bookmark.safetyReasons!.length, 0)
  })

  test('has correct job name', async ({ assert }) => {
    const { default: ContentSafetyJob } = await import('#jobs/content_safety_job')
    const job = new ContentSafetyJob(1)
    assert.equal(job.name, 'content-safety')
  })
})
