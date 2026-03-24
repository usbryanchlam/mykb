import { randomUUID } from 'node:crypto'
import { test } from '@japa/runner'
import { createTestToken } from '#tests/helpers/auth'

async function createUser(client: any) {
  const sub = `auth0|tag-${randomUUID()}`
  const token = await createTestToken({
    sub,
    email: `${sub}@example.com`,
    roles: ['editor'],
  })
  await client.get('/api/me').bearerToken(token)
  return { token }
}

async function createBookmarkDirect(token: string, client: any) {
  const meRes = await client.get('/api/me').bearerToken(token)
  const userId = meRes.body().data.id
  const { default: Bookmark } = await import('#models/bookmark')
  return Bookmark.create({
    userId,
    url: `https://tag-test-${randomUUID()}.example.com`,
    scrapeStatus: 'completed',
    safetyStatus: 'safe',
  })
}

test.group('GET /api/tags', () => {
  test('returns empty list for new user', async ({ client, assert }) => {
    const { token } = await createUser(client)
    const response = await client.get('/api/tags').bearerToken(token)
    response.assertStatus(200)
    assert.isArray(response.body().data)
    assert.equal(response.body().data.length, 0)
  })

  test('returns tags with bookmark counts', async ({ client, assert }) => {
    const { token } = await createUser(client)
    await client.post('/api/tags').json({ name: 'JavaScript' }).bearerToken(token)

    const response = await client.get('/api/tags').bearerToken(token)
    response.assertStatus(200)
    assert.isAbove(response.body().data.length, 0)
  })

  test('returns 401 without auth', async ({ client }) => {
    const response = await client.get('/api/tags')
    response.assertStatus(401)
  })
})

test.group('POST /api/tags', () => {
  test('creates a tag', async ({ client, assert }) => {
    const { token } = await createUser(client)
    const response = await client.post('/api/tags').json({ name: 'React' }).bearerToken(token)

    response.assertStatus(201)
    assert.isTrue(response.body().success)
    assert.equal(response.body().data.name, 'React')
    assert.equal(response.body().data.slug, 'react')
  })

  test('returns 422 for empty name', async ({ client }) => {
    const { token } = await createUser(client)
    const response = await client.post('/api/tags').json({ name: '' }).bearerToken(token)

    response.assertStatus(422)
  })

  test('returns 409 for duplicate tag name', async ({ client }) => {
    const { token } = await createUser(client)
    await client.post('/api/tags').json({ name: 'Duplicate' }).bearerToken(token)
    const response = await client.post('/api/tags').json({ name: 'Duplicate' }).bearerToken(token)

    response.assertStatus(409)
    response.assertBodyContains({ error: 'Tag with this name already exists' })
  })
})

test.group('PATCH /api/tags/:id', () => {
  test('renames a tag', async ({ client, assert }) => {
    const { token } = await createUser(client)
    const createRes = await client.post('/api/tags').json({ name: 'Old Name' }).bearerToken(token)
    const tagId = createRes.body().data.id

    const response = await client
      .patch(`/api/tags/${tagId}`)
      .json({ name: 'New Name' })
      .bearerToken(token)

    response.assertStatus(200)
    assert.equal(response.body().data.name, 'New Name')
    assert.equal(response.body().data.slug, 'new-name')
  })

  test('returns 404 for other users tag', async ({ client }) => {
    const user1 = await createUser(client)
    const user2 = await createUser(client)

    const createRes = await client
      .post('/api/tags')
      .json({ name: 'Private' })
      .bearerToken(user1.token)
    const tagId = createRes.body().data.id

    const response = await client
      .patch(`/api/tags/${tagId}`)
      .json({ name: 'Hacked' })
      .bearerToken(user2.token)

    response.assertStatus(404)
  })
})

test.group('DELETE /api/tags/:id', () => {
  test('deletes a tag', async ({ client, assert }) => {
    const { token } = await createUser(client)
    const createRes = await client.post('/api/tags').json({ name: 'To Delete' }).bearerToken(token)
    const tagId = createRes.body().data.id

    const response = await client.delete(`/api/tags/${tagId}`).bearerToken(token)

    response.assertStatus(200)
    assert.isTrue(response.body().success)

    const listRes = await client.get('/api/tags').bearerToken(token)
    const tagIds = listRes.body().data.map((t: any) => t.id)
    assert.notInclude(tagIds, tagId)
  })
})

test.group('POST /api/bookmarks/:id/tags', () => {
  test('adds tags to a bookmark', async ({ client, assert }) => {
    const { token } = await createUser(client)
    const bookmark = await createBookmarkDirect(token, client)

    const response = await client
      .post(`/api/bookmarks/${bookmark.id}/tags`)
      .json({ tags: ['javascript', 'web dev'] })
      .bearerToken(token)

    response.assertStatus(200)
    assert.isArray(response.body().data)
    assert.equal(response.body().data.length, 2)
  })

  test('creates tags that do not exist yet', async ({ client, assert }) => {
    const { token } = await createUser(client)
    const bookmark = await createBookmarkDirect(token, client)
    const uniqueTag = `unique-${randomUUID().slice(0, 8)}`

    await client
      .post(`/api/bookmarks/${bookmark.id}/tags`)
      .json({ tags: [uniqueTag] })
      .bearerToken(token)

    const tagsRes = await client.get('/api/tags').bearerToken(token)
    const slugs = tagsRes.body().data.map((t: any) => t.slug)
    assert.include(slugs, uniqueTag)
  })

  test('returns 404 for other users bookmark', async ({ client }) => {
    const user1 = await createUser(client)
    const user2 = await createUser(client)
    const bookmark = await createBookmarkDirect(user1.token, client)

    const response = await client
      .post(`/api/bookmarks/${bookmark.id}/tags`)
      .json({ tags: ['hacked'] })
      .bearerToken(user2.token)

    response.assertStatus(404)
  })
})

test.group('DELETE /api/bookmarks/:id/tags/:tagId', () => {
  test('removes a tag from a bookmark', async ({ client, assert }) => {
    const { token } = await createUser(client)
    const bookmark = await createBookmarkDirect(token, client)

    const addRes = await client
      .post(`/api/bookmarks/${bookmark.id}/tags`)
      .json({ tags: ['removable'] })
      .bearerToken(token)
    const tagId = addRes.body().data[0].id

    const response = await client
      .delete(`/api/bookmarks/${bookmark.id}/tags/${tagId}`)
      .bearerToken(token)

    response.assertStatus(200)
    assert.isTrue(response.body().success)
  })
})
