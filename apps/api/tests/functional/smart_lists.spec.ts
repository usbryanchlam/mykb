import { randomUUID } from 'node:crypto'
import { test } from '@japa/runner'
import { createTestToken } from '#tests/helpers/auth'

async function createUserAndGetToken(client: any) {
  const sub = `auth0|sl-${randomUUID()}`
  const token = await createTestToken({
    sub,
    email: `${sub}@example.com`,
    roles: ['editor'],
  })
  await client.get('/api/me').bearerToken(token)
  return token
}

async function createBookmarkDirect(
  token: string,
  client: any,
  overrides: Record<string, any> = {}
) {
  const meRes = await client.get('/api/me').bearerToken(token)
  const userId = meRes.body().data.id as number
  const { default: Bookmark } = await import('#models/bookmark')
  return Bookmark.create({
    userId,
    url: `https://sl-${randomUUID()}.example.com`,
    scrapeStatus: 'completed',
    safetyStatus: 'safe',
    aiStatus: 'completed',
    ...overrides,
  })
}

test.group('GET /api/smart-lists', () => {
  test('returns 401 without auth', async ({ client }) => {
    const res = await client.get('/api/smart-lists')
    res.assertStatus(401)
  })

  test('returns empty list for new user', async ({ client, assert }) => {
    const token = await createUserAndGetToken(client)
    const res = await client.get('/api/smart-lists').bearerToken(token)
    res.assertStatus(200)
    assert.equal(res.body().data.length, 0)
  })
})

test.group('POST /api/smart-lists', () => {
  test('creates a smart list', async ({ client, assert }) => {
    const token = await createUserAndGetToken(client)
    const res = await client
      .post('/api/smart-lists')
      .bearerToken(token)
      .json({
        name: 'Favorites',
        description: 'My favorite bookmarks',
        filter_query: { isFavorite: true },
      })
    res.assertStatus(201)
    assert.equal(res.body().data.name, 'Favorites')
    assert.deepInclude(res.body().data.filterQuery, { isFavorite: true })
  })

  test('returns 422 for empty name', async ({ client }) => {
    const token = await createUserAndGetToken(client)
    const res = await client
      .post('/api/smart-lists')
      .bearerToken(token)
      .json({ name: '', filter_query: {} })
    res.assertStatus(422)
  })

  test('returns 422 for missing filter_query', async ({ client }) => {
    const token = await createUserAndGetToken(client)
    const res = await client.post('/api/smart-lists').bearerToken(token).json({ name: 'Test' })
    res.assertStatus(422)
  })
})

test.group('GET /api/smart-lists/:id', () => {
  test('returns a smart list', async ({ client, assert }) => {
    const token = await createUserAndGetToken(client)
    const createRes = await client
      .post('/api/smart-lists')
      .bearerToken(token)
      .json({ name: 'Show Test', filter_query: { isArchived: false } })
    const id = createRes.body().data.id

    const res = await client.get(`/api/smart-lists/${id}`).bearerToken(token)
    res.assertStatus(200)
    assert.equal(res.body().data.name, 'Show Test')
  })

  test('returns 404 for other users smart list', async ({ client }) => {
    const token1 = await createUserAndGetToken(client)
    const token2 = await createUserAndGetToken(client)
    const createRes = await client
      .post('/api/smart-lists')
      .bearerToken(token1)
      .json({ name: 'Private', filter_query: {} })
    const id = createRes.body().data.id

    const res = await client.get(`/api/smart-lists/${id}`).bearerToken(token2)
    res.assertStatus(404)
  })
})

test.group('PATCH /api/smart-lists/:id', () => {
  test('updates a smart list', async ({ client, assert }) => {
    const token = await createUserAndGetToken(client)
    const createRes = await client
      .post('/api/smart-lists')
      .bearerToken(token)
      .json({ name: 'Old Name', filter_query: {} })
    const id = createRes.body().data.id

    const res = await client
      .patch(`/api/smart-lists/${id}`)
      .bearerToken(token)
      .json({ name: 'New Name', filter_query: { isFavorite: true } })
    res.assertStatus(200)
    assert.equal(res.body().data.name, 'New Name')
  })
})

test.group('DELETE /api/smart-lists/:id', () => {
  test('deletes a smart list', async ({ client }) => {
    const token = await createUserAndGetToken(client)
    const createRes = await client
      .post('/api/smart-lists')
      .bearerToken(token)
      .json({ name: 'To Delete', filter_query: {} })
    const id = createRes.body().data.id

    const res = await client.delete(`/api/smart-lists/${id}`).bearerToken(token)
    res.assertStatus(200)
  })
})

test.group('GET /api/smart-lists/:id/bookmarks', () => {
  test('resolves bookmarks matching filter', async ({ client, assert }) => {
    const token = await createUserAndGetToken(client)

    // Create one favorite and one non-favorite bookmark
    await createBookmarkDirect(token, client, { isFavorite: true, title: 'Fav' })
    await createBookmarkDirect(token, client, { isFavorite: false, title: 'NotFav' })

    // Create smart list that filters favorites
    const createRes = await client
      .post('/api/smart-lists')
      .bearerToken(token)
      .json({ name: 'Favorites Only', filter_query: { isFavorite: true } })
    const id = createRes.body().data.id

    const res = await client.get(`/api/smart-lists/${id}/bookmarks`).bearerToken(token)
    res.assertStatus(200)
    assert.equal(res.body().data.length, 1)
    assert.equal(res.body().data[0].title, 'Fav')
    assert.isNumber(res.body().meta.total)
  })

  test('resolves bookmarks with tag filter', async ({ client, assert }) => {
    const token = await createUserAndGetToken(client)
    const meRes = await client.get('/api/me').bearerToken(token)
    const userId = meRes.body().data.id as number

    const { default: Bookmark } = await import('#models/bookmark')
    const { default: Tag } = await import('#models/tag')

    const uniqueSlug = `sltag-${randomUUID().slice(0, 8)}`
    const bookmark = await Bookmark.create({
      userId,
      url: `https://sl-tag-${randomUUID()}.example.com`,
      title: 'Tagged',
      scrapeStatus: 'completed',
      safetyStatus: 'safe',
      aiStatus: 'completed',
    })
    const tag = await Tag.create({
      userId,
      name: uniqueSlug,
      slug: uniqueSlug,
      isAiGenerated: false,
    })
    await bookmark.related('tags').attach([tag.id])

    await Bookmark.create({
      userId,
      url: `https://sl-notag-${randomUUID()}.example.com`,
      title: 'Untagged',
      scrapeStatus: 'completed',
      safetyStatus: 'safe',
      aiStatus: 'completed',
    })

    const createRes = await client
      .post('/api/smart-lists')
      .bearerToken(token)
      .json({ name: 'By Tag', filter_query: { tags: [uniqueSlug] } })
    const id = createRes.body().data.id

    const res = await client.get(`/api/smart-lists/${id}/bookmarks`).bearerToken(token)
    res.assertStatus(200)
    assert.equal(res.body().data.length, 1)
    assert.equal(res.body().data[0].title, 'Tagged')
  })

  test('returns 404 for other users smart list', async ({ client }) => {
    const token1 = await createUserAndGetToken(client)
    const token2 = await createUserAndGetToken(client)
    const createRes = await client
      .post('/api/smart-lists')
      .bearerToken(token1)
      .json({ name: 'Private', filter_query: {} })
    const id = createRes.body().data.id

    const res = await client.get(`/api/smart-lists/${id}/bookmarks`).bearerToken(token2)
    res.assertStatus(404)
  })
})
