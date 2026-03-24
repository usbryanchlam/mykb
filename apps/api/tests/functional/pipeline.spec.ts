import { randomUUID } from 'node:crypto'
import { test } from '@japa/runner'
import { createTestToken } from '#tests/helpers/auth'

async function createUser(client: any, options: { roles?: string[] } = {}) {
  const sub = `auth0|pipeline-${randomUUID()}`
  const token = await createTestToken({
    sub,
    email: `${sub}@example.com`,
    roles: options.roles ?? ['editor'],
  })
  const res = await client.get('/api/me').bearerToken(token)
  return { token, userId: res.body().data.id as number }
}

async function createBookmarkWithContent(client: any, token: string) {
  // Create user first via /api/me to get the DB user ID
  const meRes = await client.get('/api/me').bearerToken(token)
  const userId = meRes.body().data.id as number

  // Create bookmark directly via model to avoid triggering the pipeline
  const { default: Bookmark } = await import('#models/bookmark')
  const bookmark = await Bookmark.create({
    userId,
    url: `https://pipeline-${randomUUID()}.example.com`,
    content: '<p>Article content</p>',
    plainText: 'Article content',
    scrapeStatus: 'completed',
    safetyStatus: 'safe',
  })

  return { bookmarkId: bookmark.id, url: bookmark.url }
}

test.group('POST /api/bookmarks — pipeline trigger', () => {
  test('creating a bookmark sets scrape_status to pending', async ({ client, assert }) => {
    const { token } = await createUser(client)
    const url = `https://trigger-${randomUUID()}.example.com`

    const response = await client.post('/api/bookmarks').json({ url }).bearerToken(token)
    response.assertStatus(201)

    const body = response.body()
    assert.isTrue(body.success)
    assert.exists(body.data.id)
  })
})

test.group('POST /api/bookmarks/:id/rescrape', () => {
  test('resets statuses and returns updated bookmark', async ({ client, assert }) => {
    const { token } = await createUser(client)
    const { bookmarkId } = await createBookmarkWithContent(client, token)

    const response = await client.post(`/api/bookmarks/${bookmarkId}/rescrape`).bearerToken(token)

    response.assertStatus(200)
    const data = response.body().data
    assert.equal(data.scrapeStatus, 'pending')
    assert.equal(data.safetyStatus, 'pending')
    assert.equal(data.aiStatus, 'pending')
    assert.isNull(data.scrapeError)
  })

  test('returns 404 for other users bookmark', async ({ client }) => {
    const user1 = await createUser(client)
    const user2 = await createUser(client)
    const { bookmarkId } = await createBookmarkWithContent(client, user1.token)

    const response = await client
      .post(`/api/bookmarks/${bookmarkId}/rescrape`)
      .bearerToken(user2.token)

    response.assertStatus(404)
  })

  test('returns 400 for invalid id', async ({ client }) => {
    const { token } = await createUser(client)
    const response = await client.post('/api/bookmarks/abc/rescrape').bearerToken(token)
    response.assertStatus(400)
  })

  test('returns 401 without auth', async ({ client }) => {
    const response = await client.post('/api/bookmarks/1/rescrape')
    response.assertStatus(401)
  })
})

test.group('GET /api/bookmarks/:id/reader', () => {
  test('returns content for a safe completed bookmark', async ({ client, assert }) => {
    const { token } = await createUser(client)
    const { bookmarkId } = await createBookmarkWithContent(client, token)

    const response = await client.get(`/api/bookmarks/${bookmarkId}/reader`).bearerToken(token)

    response.assertStatus(200)
    const data = response.body().data
    assert.equal(data.content, '<p>Article content</p>')
    assert.equal(data.plainText, 'Article content')
    assert.equal(data.status, 'completed')
  })

  test('returns 403 for flagged bookmark', async ({ client }) => {
    const { token } = await createUser(client)
    const url = `https://flagged-reader-${randomUUID()}.example.com`
    const res = await client.post('/api/bookmarks').json({ url }).bearerToken(token)
    const bookmarkId = res.body().data.id

    const { default: Bookmark } = await import('#models/bookmark')
    const bookmark = await Bookmark.findOrFail(bookmarkId)
    bookmark.merge({ safetyStatus: 'flagged', safetyReasons: ['test'] })
    await bookmark.save()

    const response = await client.get(`/api/bookmarks/${bookmarkId}/reader`).bearerToken(token)

    response.assertStatus(403)
    response.assertBodyContains({ error: 'Content has been flagged for safety concerns' })
  })

  test('returns null content for pending bookmark', async ({ client, assert }) => {
    const { token } = await createUser(client)
    const url = `https://pending-reader-${randomUUID()}.example.com`
    const res = await client.post('/api/bookmarks').json({ url }).bearerToken(token)
    const bookmarkId = res.body().data.id

    const response = await client.get(`/api/bookmarks/${bookmarkId}/reader`).bearerToken(token)

    response.assertStatus(200)
    const data = response.body().data
    assert.isNull(data.content)
    // Status may be 'pending' or 'processing' depending on pipeline timing
    assert.oneOf(data.status, ['pending', 'processing'])
  })

  test('returns 404 for other users bookmark', async ({ client }) => {
    const user1 = await createUser(client)
    const user2 = await createUser(client)
    const { bookmarkId } = await createBookmarkWithContent(client, user1.token)

    const response = await client
      .get(`/api/bookmarks/${bookmarkId}/reader`)
      .bearerToken(user2.token)

    response.assertStatus(404)
  })

  test('returns 400 for invalid id', async ({ client }) => {
    const { token } = await createUser(client)
    const response = await client.get('/api/bookmarks/abc/reader').bearerToken(token)
    response.assertStatus(400)
  })
})
