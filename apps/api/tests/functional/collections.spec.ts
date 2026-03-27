import { randomUUID } from 'node:crypto'
import { test } from '@japa/runner'
import { createTestToken } from '#tests/helpers/auth'

async function createUserAndGetToken(client: any) {
  const sub = `auth0|coll-${randomUUID()}`
  const token = await createTestToken({
    sub,
    email: `${sub}@example.com`,
    roles: ['editor'],
  })
  await client.get('/api/me').bearerToken(token)
  return token
}

async function createCollection(client: any, token: string, name?: string) {
  const res = await client
    .post('/api/collections')
    .bearerToken(token)
    .json({ name: name ?? `Collection ${randomUUID().slice(0, 8)}` })
  return res.body().data
}

async function createBookmarkDirect(token: string, client: any) {
  const meRes = await client.get('/api/me').bearerToken(token)
  const userId = meRes.body().data.id as number
  const { default: Bookmark } = await import('#models/bookmark')
  return Bookmark.create({
    userId,
    url: `https://coll-${randomUUID()}.example.com`,
    scrapeStatus: 'completed',
    safetyStatus: 'safe',
    aiStatus: 'completed',
  })
}

test.group('GET /api/collections', () => {
  test('returns 401 without auth', async ({ client }) => {
    const res = await client.get('/api/collections')
    res.assertStatus(401)
  })

  test('returns empty list for new user', async ({ client, assert }) => {
    const token = await createUserAndGetToken(client)
    const res = await client.get('/api/collections').bearerToken(token)
    res.assertStatus(200)
    assert.equal(res.body().data.length, 0)
  })

  test('returns collections with bookmark counts', async ({ client, assert }) => {
    const token = await createUserAndGetToken(client)
    await createCollection(client, token, 'My Collection')
    const res = await client.get('/api/collections').bearerToken(token)
    res.assertStatus(200)
    assert.equal(res.body().data.length, 1)
    assert.equal(res.body().data[0].name, 'My Collection')
  })
})

test.group('GET /api/collections/:id', () => {
  test('returns a collection with bookmark count', async ({ client, assert }) => {
    const token = await createUserAndGetToken(client)
    const coll = await createCollection(client, token, 'Show Test')
    const res = await client.get(`/api/collections/${coll.id}`).bearerToken(token)
    res.assertStatus(200)
    assert.equal(res.body().data.name, 'Show Test')
  })

  test('returns 404 for other users collection', async ({ client }) => {
    const token1 = await createUserAndGetToken(client)
    const token2 = await createUserAndGetToken(client)
    const coll = await createCollection(client, token1)
    const res = await client.get(`/api/collections/${coll.id}`).bearerToken(token2)
    res.assertStatus(404)
  })
})

test.group('POST /api/collections', () => {
  test('creates a collection', async ({ client, assert }) => {
    const token = await createUserAndGetToken(client)
    const res = await client
      .post('/api/collections')
      .bearerToken(token)
      .json({ name: 'Dev Resources', description: 'Useful links', icon: 'code' })
    res.assertStatus(201)
    assert.equal(res.body().data.name, 'Dev Resources')
    assert.equal(res.body().data.description, 'Useful links')
    assert.equal(res.body().data.icon, 'code')
  })

  test('returns 422 for empty name', async ({ client }) => {
    const token = await createUserAndGetToken(client)
    const res = await client.post('/api/collections').bearerToken(token).json({ name: '' })
    res.assertStatus(422)
  })
})

test.group('PATCH /api/collections/:id', () => {
  test('updates a collection', async ({ client, assert }) => {
    const token = await createUserAndGetToken(client)
    const coll = await createCollection(client, token, 'Old Name')
    const res = await client
      .patch(`/api/collections/${coll.id}`)
      .bearerToken(token)
      .json({ name: 'New Name' })
    res.assertStatus(200)
    assert.equal(res.body().data.name, 'New Name')
  })

  test('returns 404 for other users collection', async ({ client }) => {
    const token1 = await createUserAndGetToken(client)
    const token2 = await createUserAndGetToken(client)
    const coll = await createCollection(client, token1)
    const res = await client
      .patch(`/api/collections/${coll.id}`)
      .bearerToken(token2)
      .json({ name: 'Hacked' })
    res.assertStatus(404)
  })
})

test.group('DELETE /api/collections/:id', () => {
  test('deletes a collection', async ({ client }) => {
    const token = await createUserAndGetToken(client)
    const coll = await createCollection(client, token)
    const res = await client.delete(`/api/collections/${coll.id}`).bearerToken(token)
    res.assertStatus(200)
  })

  test('cascade deletes bookmark associations', async ({ client, assert }) => {
    const token = await createUserAndGetToken(client)
    const coll = await createCollection(client, token)
    const bookmark = await createBookmarkDirect(token, client)

    await client
      .post(`/api/collections/${coll.id}/bookmarks`)
      .bearerToken(token)
      .json({ bookmark_id: bookmark.id })

    // Delete collection
    await client.delete(`/api/collections/${coll.id}`).bearerToken(token)

    // Bookmark should still exist
    const { default: Bookmark } = await import('#models/bookmark')
    const bm = await Bookmark.find(bookmark.id)
    assert.isNotNull(bm)
  })
})

test.group('POST /api/collections/:id/bookmarks', () => {
  test('adds bookmark to collection', async ({ client, assert }) => {
    const token = await createUserAndGetToken(client)
    const coll = await createCollection(client, token)
    const bookmark = await createBookmarkDirect(token, client)

    const res = await client
      .post(`/api/collections/${coll.id}/bookmarks`)
      .bearerToken(token)
      .json({ bookmark_id: bookmark.id })
    res.assertStatus(200)

    // Verify bookmark is in collection
    const listRes = await client.get(`/api/collections/${coll.id}/bookmarks`).bearerToken(token)
    assert.equal(listRes.body().data.length, 1)
    assert.equal(listRes.body().data[0].id, bookmark.id)
  })

  test('returns 404 for other users bookmark', async ({ client }) => {
    const token1 = await createUserAndGetToken(client)
    const token2 = await createUserAndGetToken(client)
    const coll = await createCollection(client, token1)
    const bookmark = await createBookmarkDirect(token2, client)

    const res = await client
      .post(`/api/collections/${coll.id}/bookmarks`)
      .bearerToken(token1)
      .json({ bookmark_id: bookmark.id })
    res.assertStatus(404)
  })

  test('adding same bookmark twice is idempotent', async ({ client, assert }) => {
    const token = await createUserAndGetToken(client)
    const coll = await createCollection(client, token)
    const bookmark = await createBookmarkDirect(token, client)

    await client
      .post(`/api/collections/${coll.id}/bookmarks`)
      .bearerToken(token)
      .json({ bookmark_id: bookmark.id })
    const res = await client
      .post(`/api/collections/${coll.id}/bookmarks`)
      .bearerToken(token)
      .json({ bookmark_id: bookmark.id })
    res.assertStatus(200)

    const listRes = await client.get(`/api/collections/${coll.id}/bookmarks`).bearerToken(token)
    assert.equal(listRes.body().data.length, 1)
  })
})

test.group('DELETE /api/collections/:id/bookmarks/:bookmarkId', () => {
  test('removes bookmark from collection', async ({ client, assert }) => {
    const token = await createUserAndGetToken(client)
    const coll = await createCollection(client, token)
    const bookmark = await createBookmarkDirect(token, client)

    await client
      .post(`/api/collections/${coll.id}/bookmarks`)
      .bearerToken(token)
      .json({ bookmark_id: bookmark.id })

    const res = await client
      .delete(`/api/collections/${coll.id}/bookmarks/${bookmark.id}`)
      .bearerToken(token)
    res.assertStatus(200)

    const listRes = await client.get(`/api/collections/${coll.id}/bookmarks`).bearerToken(token)
    assert.equal(listRes.body().data.length, 0)
  })

  test('returns 404 for other users bookmark', async ({ client }) => {
    const token1 = await createUserAndGetToken(client)
    const token2 = await createUserAndGetToken(client)
    const coll = await createCollection(client, token1)
    const bookmark = await createBookmarkDirect(token2, client)

    const res = await client
      .delete(`/api/collections/${coll.id}/bookmarks/${bookmark.id}`)
      .bearerToken(token1)
    res.assertStatus(404)
  })
})

test.group('GET /api/collections/:id/bookmarks', () => {
  test('returns bookmarks in collection', async ({ client, assert }) => {
    const token = await createUserAndGetToken(client)
    const coll = await createCollection(client, token)
    const bm1 = await createBookmarkDirect(token, client)
    const bm2 = await createBookmarkDirect(token, client)

    await client
      .post(`/api/collections/${coll.id}/bookmarks`)
      .bearerToken(token)
      .json({ bookmark_id: bm1.id })
    await client
      .post(`/api/collections/${coll.id}/bookmarks`)
      .bearerToken(token)
      .json({ bookmark_id: bm2.id })

    const res = await client.get(`/api/collections/${coll.id}/bookmarks`).bearerToken(token)
    res.assertStatus(200)
    assert.equal(res.body().data.length, 2)
  })

  test('does not return other users collection bookmarks', async ({ client }) => {
    const token1 = await createUserAndGetToken(client)
    const token2 = await createUserAndGetToken(client)
    const coll = await createCollection(client, token1)

    const res = await client.get(`/api/collections/${coll.id}/bookmarks`).bearerToken(token2)
    res.assertStatus(404)
  })
})
