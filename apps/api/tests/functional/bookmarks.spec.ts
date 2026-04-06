import { randomUUID } from 'node:crypto'
import { test } from '@japa/runner'
import { createTestToken } from '#tests/helpers/auth'
import Bookmark from '#models/bookmark'

/**
 * Helper: creates a user via /api/me and returns a token + userId pair.
 */
async function createUser(client: any, options: { roles?: string[] } = {}) {
  const sub = `auth0|bm-test-${randomUUID()}`
  const token = await createTestToken({
    sub,
    email: `${sub}@example.com`,
    roles: options.roles ?? ['editor'],
  })
  const res = await client.get('/api/me').bearerToken(token)
  return { token, userId: res.body().data.id as number, sub }
}

/**
 * Helper: creates a bookmark via the API and returns the response body data.
 */
async function createBookmark(client: any, token: string, url: string, title?: string) {
  const body: Record<string, string> = { url }
  if (title) body.title = title
  const res = await client.post('/api/bookmarks').json(body).bearerToken(token)
  return res.body().data
}

test.group('POST /api/bookmarks', () => {
  test('creates a bookmark with url only', async ({ client, assert }) => {
    const { token } = await createUser(client)
    const response = await client
      .post('/api/bookmarks')
      .json({ url: 'https://example.com' })
      .bearerToken(token)

    response.assertStatus(201)
    const body = response.body()
    assert.isTrue(body.success)
    assert.equal(body.data.url, 'https://example.com')
    assert.exists(body.data.id)
    assert.exists(body.data.url)
  })

  test('creates a bookmark with url and title', async ({ client, assert }) => {
    const { token } = await createUser(client)
    const response = await client
      .post('/api/bookmarks')
      .json({ url: 'https://example.com/titled', title: 'My Title' })
      .bearerToken(token)

    response.assertStatus(201)
    assert.equal(response.body().data.title, 'My Title')
  })

  test('returns 422 for invalid url', async ({ client }) => {
    const { token } = await createUser(client)
    const response = await client
      .post('/api/bookmarks')
      .json({ url: 'not-a-url' })
      .bearerToken(token)

    response.assertStatus(422)
  })

  test('returns 422 for missing url', async ({ client }) => {
    const { token } = await createUser(client)
    const response = await client.post('/api/bookmarks').json({}).bearerToken(token)

    response.assertStatus(422)
  })

  test('returns 409 for duplicate url per user', async ({ client }) => {
    const { token } = await createUser(client)
    const url = `https://dup-test-${randomUUID()}.example.com`

    await client.post('/api/bookmarks').json({ url }).bearerToken(token)
    const response = await client.post('/api/bookmarks').json({ url }).bearerToken(token)

    response.assertStatus(409)
    response.assertBodyContains({ error: 'Bookmark with this URL already exists' })
  })

  test('allows same url for different users', async ({ client }) => {
    const user1 = await createUser(client)
    const user2 = await createUser(client)
    const url = `https://shared-${randomUUID()}.example.com`

    const r1 = await client.post('/api/bookmarks').json({ url }).bearerToken(user1.token)
    const r2 = await client.post('/api/bookmarks').json({ url }).bearerToken(user2.token)

    r1.assertStatus(201)
    r2.assertStatus(201)
  })

  test('returns 401 without auth', async ({ client }) => {
    const response = await client.post('/api/bookmarks').json({ url: 'https://example.com' })
    response.assertStatus(401)
  })
})

test.group('GET /api/bookmarks', () => {
  test('returns paginated bookmarks for the user', async ({ client, assert }) => {
    const { token } = await createUser(client)
    await createBookmark(client, token, `https://list-${randomUUID()}.example.com`)
    await createBookmark(client, token, `https://list-${randomUUID()}.example.com`)

    const response = await client.get('/api/bookmarks').bearerToken(token)
    response.assertStatus(200)

    const body = response.body()
    assert.isTrue(body.success)
    assert.isArray(body.data)
    assert.isAtLeast(body.data.length, 2)
    assert.property(body.meta, 'total')
    assert.property(body.meta, 'page')
    assert.property(body.meta, 'limit')
  })

  test('does not return other users bookmarks', async ({ client, assert }) => {
    const user1 = await createUser(client)
    const user2 = await createUser(client)

    await createBookmark(client, user1.token, `https://isolated-${randomUUID()}.example.com`)

    const response = await client.get('/api/bookmarks').bearerToken(user2.token)
    response.assertStatus(200)

    const urls = response.body().data.map((b: any) => b.url)
    assert.notInclude(urls, user1.sub)
  })

  test('filters by is_favorite', async ({ client, assert }) => {
    const { token } = await createUser(client)
    const bm = await createBookmark(client, token, `https://fav-filter-${randomUUID()}.example.com`)

    await client.patch(`/api/bookmarks/${bm.id}/favorite`).bearerToken(token)

    const response = await client
      .get('/api/bookmarks')
      .qs({ is_favorite: 'true' })
      .bearerToken(token)

    response.assertStatus(200)
    const favIds = response.body().data.map((b: any) => b.id)
    assert.include(favIds, bm.id)
  })

  test('filters by is_archived', async ({ client, assert }) => {
    const { token } = await createUser(client)
    const bm = await createBookmark(
      client,
      token,
      `https://archive-filter-${randomUUID()}.example.com`
    )

    await client.patch(`/api/bookmarks/${bm.id}/archive`).bearerToken(token)

    const response = await client
      .get('/api/bookmarks')
      .qs({ is_archived: 'true' })
      .bearerToken(token)

    response.assertStatus(200)
    const archivedIds = response.body().data.map((b: any) => b.id)
    assert.include(archivedIds, bm.id)
  })

  test('paginates with page and limit', async ({ client, assert }) => {
    const { token } = await createUser(client)

    for (let i = 0; i < 3; i++) {
      await createBookmark(client, token, `https://paginate-${randomUUID()}.example.com`)
    }

    const response = await client.get('/api/bookmarks').qs({ page: 1, limit: 2 }).bearerToken(token)

    response.assertStatus(200)
    assert.isAtMost(response.body().data.length, 2)
    assert.equal(response.body().meta.page, 1)
    assert.equal(response.body().meta.limit, 2)
  })
})

test.group('GET /api/bookmarks/:id', () => {
  test('returns a single bookmark', async ({ client, assert }) => {
    const { token } = await createUser(client)
    const bm = await createBookmark(client, token, `https://show-${randomUUID()}.example.com`)

    const response = await client.get(`/api/bookmarks/${bm.id}`).bearerToken(token)
    response.assertStatus(200)

    const body = response.body()
    assert.isTrue(body.success)
    assert.equal(body.data.id, bm.id)
    assert.equal(body.data.url, bm.url)
  })

  test('returns 404 for other users bookmark', async ({ client }) => {
    const user1 = await createUser(client)
    const user2 = await createUser(client)
    const bm = await createBookmark(
      client,
      user1.token,
      `https://other-${randomUUID()}.example.com`
    )

    const response = await client.get(`/api/bookmarks/${bm.id}`).bearerToken(user2.token)
    response.assertStatus(404)
  })

  test('returns 400 for invalid id', async ({ client }) => {
    const { token } = await createUser(client)
    const response = await client.get('/api/bookmarks/abc').bearerToken(token)
    response.assertStatus(400)
    response.assertBodyContains({ error: 'Invalid bookmark id' })
  })
})

test.group('PATCH /api/bookmarks/:id', () => {
  test('updates title', async ({ client, assert }) => {
    const { token } = await createUser(client)
    const bm = await createBookmark(client, token, `https://update-${randomUUID()}.example.com`)

    const response = await client
      .patch(`/api/bookmarks/${bm.id}`)
      .json({ title: 'New Title' })
      .bearerToken(token)

    response.assertStatus(200)
    assert.equal(response.body().data.title, 'New Title')
  })

  test('updates description', async ({ client, assert }) => {
    const { token } = await createUser(client)
    const bm = await createBookmark(
      client,
      token,
      `https://update-desc-${randomUUID()}.example.com`
    )

    const response = await client
      .patch(`/api/bookmarks/${bm.id}`)
      .json({ description: 'A description' })
      .bearerToken(token)

    response.assertStatus(200)
    assert.equal(response.body().data.description, 'A description')
  })

  test('returns 400 when neither title nor description provided', async ({ client }) => {
    const { token } = await createUser(client)
    const bm = await createBookmark(
      client,
      token,
      `https://update-empty-${randomUUID()}.example.com`
    )

    const response = await client.patch(`/api/bookmarks/${bm.id}`).json({}).bearerToken(token)

    response.assertStatus(400)
    response.assertBodyContains({
      error: 'At least one of title or description is required',
    })
  })

  test('returns 404 for other users bookmark', async ({ client }) => {
    const user1 = await createUser(client)
    const user2 = await createUser(client)
    const bm = await createBookmark(
      client,
      user1.token,
      `https://update-other-${randomUUID()}.example.com`
    )

    const response = await client
      .patch(`/api/bookmarks/${bm.id}`)
      .json({ title: 'Hacked' })
      .bearerToken(user2.token)

    response.assertStatus(404)
  })
})

test.group('DELETE /api/bookmarks/:id', () => {
  test('deletes a bookmark', async ({ client, assert }) => {
    const { token } = await createUser(client)
    const bm = await createBookmark(client, token, `https://delete-${randomUUID()}.example.com`)

    const response = await client.delete(`/api/bookmarks/${bm.id}`).bearerToken(token)
    response.assertStatus(200)
    assert.isTrue(response.body().success)

    const getResponse = await client.get(`/api/bookmarks/${bm.id}`).bearerToken(token)
    getResponse.assertStatus(404)
  })

  test('returns 404 for other users bookmark', async ({ client }) => {
    const user1 = await createUser(client)
    const user2 = await createUser(client)
    const bm = await createBookmark(
      client,
      user1.token,
      `https://delete-other-${randomUUID()}.example.com`
    )

    const response = await client.delete(`/api/bookmarks/${bm.id}`).bearerToken(user2.token)
    response.assertStatus(404)
  })
})

test.group('PATCH /api/bookmarks/:id/favorite', () => {
  test('toggles favorite on', async ({ client, assert }) => {
    const { token } = await createUser(client)
    const bm = await createBookmark(client, token, `https://fav-on-${randomUUID()}.example.com`)

    const response = await client.patch(`/api/bookmarks/${bm.id}/favorite`).bearerToken(token)
    response.assertStatus(200)
    assert.ok(response.body().data.isFavorite)
  })

  test('toggles favorite off', async ({ client, assert }) => {
    const { token } = await createUser(client)
    const bm = await createBookmark(client, token, `https://fav-off-${randomUUID()}.example.com`)

    await client.patch(`/api/bookmarks/${bm.id}/favorite`).bearerToken(token)
    const response = await client.patch(`/api/bookmarks/${bm.id}/favorite`).bearerToken(token)

    response.assertStatus(200)
    assert.notOk(response.body().data.isFavorite)
  })
})

test.group('PATCH /api/bookmarks/:id/archive', () => {
  test('toggles archive on', async ({ client, assert }) => {
    const { token } = await createUser(client)
    const bm = await createBookmark(client, token, `https://archive-on-${randomUUID()}.example.com`)

    const response = await client.patch(`/api/bookmarks/${bm.id}/archive`).bearerToken(token)
    response.assertStatus(200)
    assert.ok(response.body().data.isArchived)
  })

  test('toggles archive off', async ({ client, assert }) => {
    const { token } = await createUser(client)
    const bm = await createBookmark(
      client,
      token,
      `https://archive-off-${randomUUID()}.example.com`
    )

    await client.patch(`/api/bookmarks/${bm.id}/archive`).bearerToken(token)
    const response = await client.patch(`/api/bookmarks/${bm.id}/archive`).bearerToken(token)

    response.assertStatus(200)
    assert.notOk(response.body().data.isArchived)
  })
})

test.group('PATCH /api/bookmarks/:id/content', () => {
  async function setBookmarkFailed(id: number) {
    const bookmark = await Bookmark.findOrFail(id)
    bookmark.scrapeStatus = 'failed'
    bookmark.scrapeError = 'Test: forced failure'
    await bookmark.save()
  }

  test('sets manual content and triggers AI pipeline', async ({ client, assert }) => {
    const { token } = await createUser(client)
    const bm = await createBookmark(
      client,
      token,
      `https://manual-content-${randomUUID()}.example.com`
    )
    await setBookmarkFailed(bm.id)

    const response = await client
      .patch(`/api/bookmarks/${bm.id}/content`)
      .json({ plain_text: 'This is manually pasted article content for testing purposes.' })
      .bearerToken(token)

    response.assertStatus(200)
    const data = response.body().data
    assert.isTrue(response.body().success)
    assert.equal(data.plainText, 'This is manually pasted article content for testing purposes.')
    assert.include(data.content, '<p>')
    assert.equal(data.scrapeStatus, 'completed')
    assert.equal(data.aiStatus, 'pending')
    assert.equal(data.safetyStatus, 'skipped')
  })

  test('converts multi-paragraph text to HTML paragraphs', async ({ client, assert }) => {
    const { token } = await createUser(client)
    const bm = await createBookmark(client, token, `https://multi-para-${randomUUID()}.example.com`)
    await setBookmarkFailed(bm.id)

    const response = await client
      .patch(`/api/bookmarks/${bm.id}/content`)
      .json({ plain_text: 'First paragraph.\n\nSecond paragraph.' })
      .bearerToken(token)

    response.assertStatus(200)
    assert.include(response.body().data.content, '<p>First paragraph.</p>')
    assert.include(response.body().data.content, '<p>Second paragraph.</p>')
  })

  test('returns 422 for empty plain_text', async ({ client }) => {
    const { token } = await createUser(client)
    const bm = await createBookmark(
      client,
      token,
      `https://empty-content-${randomUUID()}.example.com`
    )

    const response = await client
      .patch(`/api/bookmarks/${bm.id}/content`)
      .json({ plain_text: '' })
      .bearerToken(token)

    response.assertStatus(422)
  })

  test('returns 422 for missing plain_text', async ({ client }) => {
    const { token } = await createUser(client)
    const bm = await createBookmark(
      client,
      token,
      `https://missing-content-${randomUUID()}.example.com`
    )

    const response = await client
      .patch(`/api/bookmarks/${bm.id}/content`)
      .json({})
      .bearerToken(token)

    response.assertStatus(422)
  })

  test('returns 400 for invalid bookmark id', async ({ client }) => {
    const { token } = await createUser(client)
    const response = await client
      .patch('/api/bookmarks/abc/content')
      .json({ plain_text: 'Some content' })
      .bearerToken(token)

    response.assertStatus(400)
  })

  test('returns 404 for non-existent bookmark', async ({ client }) => {
    const { token } = await createUser(client)
    const response = await client
      .patch('/api/bookmarks/999999/content')
      .json({ plain_text: 'Some content' })
      .bearerToken(token)

    response.assertStatus(404)
  })

  test('cannot update content of another user bookmark', async ({ client }) => {
    const { token: ownerToken } = await createUser(client)
    const { token: otherToken } = await createUser(client)
    const bm = await createBookmark(
      client,
      ownerToken,
      `https://other-user-content-${randomUUID()}.example.com`
    )

    const response = await client
      .patch(`/api/bookmarks/${bm.id}/content`)
      .json({ plain_text: 'Stolen content' })
      .bearerToken(otherToken)

    response.assertStatus(404)
  })
})
