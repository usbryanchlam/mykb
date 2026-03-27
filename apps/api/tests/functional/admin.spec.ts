import { randomUUID } from 'node:crypto'
import { test } from '@japa/runner'
import { createTestToken } from '#tests/helpers/auth'

async function createUserWithRole(client: any, role: string) {
  const sub = `auth0|admin-${randomUUID()}`
  const token = await createTestToken({
    sub,
    email: `${sub}@example.com`,
    roles: [role],
  })
  await client.get('/api/me').bearerToken(token)
  return token
}

test.group('GET /api/admin/stats', () => {
  test('returns 401 without auth', async ({ client }) => {
    const res = await client.get('/api/admin/stats')
    res.assertStatus(401)
  })

  test('returns 403 for editor role', async ({ client }) => {
    const token = await createUserWithRole(client, 'editor')
    const res = await client.get('/api/admin/stats').bearerToken(token)
    res.assertStatus(403)
  })

  test('returns 403 for viewer role', async ({ client }) => {
    const token = await createUserWithRole(client, 'viewer')
    const res = await client.get('/api/admin/stats').bearerToken(token)
    res.assertStatus(403)
  })

  test('returns stats for admin role', async ({ client, assert }) => {
    const token = await createUserWithRole(client, 'admin')
    const res = await client.get('/api/admin/stats').bearerToken(token)
    res.assertStatus(200)

    const data = res.body().data
    assert.isNumber(data.users)
    assert.isNumber(data.bookmarks)
    assert.isNumber(data.tags)
    assert.isNumber(data.collections)
    assert.isNumber(data.smartLists)
    assert.isObject(data.jobs)
    assert.isNumber(data.jobs.total)
    assert.isNumber(data.jobs.completed)
    assert.isNumber(data.jobs.failed)
    assert.isObject(data.scrapeStats)
    assert.isObject(data.safetyStats)
  })

  test('stats reflect actual data', async ({ client, assert }) => {
    const token = await createUserWithRole(client, 'admin')

    // Create a bookmark to ensure non-zero counts
    const { default: Bookmark } = await import('#models/bookmark')
    const meRes = await client.get('/api/me').bearerToken(token)
    const userId = meRes.body().data.id as number
    await Bookmark.create({
      userId,
      url: `https://admin-stat-${randomUUID()}.example.com`,
      scrapeStatus: 'completed',
      safetyStatus: 'safe',
      aiStatus: 'completed',
    })

    const res = await client.get('/api/admin/stats').bearerToken(token)
    res.assertStatus(200)
    assert.isAbove(res.body().data.users, 0)
    assert.isAbove(res.body().data.bookmarks, 0)
  })
})
