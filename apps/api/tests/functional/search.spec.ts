import { randomUUID } from 'node:crypto'
import { test } from '@japa/runner'
import { createTestToken } from '#tests/helpers/auth'

async function createUserAndGetId(client: any) {
  const sub = `auth0|search-${randomUUID()}`
  const token = await createTestToken({
    sub,
    email: `${sub}@example.com`,
    roles: ['editor'],
  })
  const meRes = await client.get('/api/me').bearerToken(token)
  const userId = meRes.body().data.id as number
  return { token, userId }
}

async function createBookmarkDirect(userId: number, overrides: Record<string, any> = {}) {
  const { default: Bookmark } = await import('#models/bookmark')
  return Bookmark.create({
    userId,
    url: `https://search-${randomUUID()}.example.com`,
    scrapeStatus: 'completed',
    safetyStatus: 'safe',
    aiStatus: 'completed',
    ...overrides,
  })
}

test.group('GET /api/search', () => {
  test('returns 401 without auth', async ({ client }) => {
    const res = await client.get('/api/search?q=test')
    res.assertStatus(401)
  })

  test('returns 422 without q param', async ({ client }) => {
    const { token } = await createUserAndGetId(client)
    const res = await client.get('/api/search').bearerToken(token)
    res.assertStatus(422)
  })

  test('returns empty results for no matches', async ({ client, assert }) => {
    const { token } = await createUserAndGetId(client)
    const res = await client.get('/api/search?q=nonexistenttermxyz123').bearerToken(token)
    res.assertStatus(200)
    const body = res.body()
    assert.equal(body.data.length, 0)
    assert.equal(body.meta.total, 0)
  })

  test('finds bookmark by title', async ({ client, assert }) => {
    const { token, userId } = await createUserAndGetId(client)
    const uniqueTerm = `srchtitle${randomUUID().slice(0, 8)}`
    await createBookmarkDirect(userId, {
      title: `Article about ${uniqueTerm} programming`,
    })

    const res = await client.get(`/api/search?q=${uniqueTerm}`).bearerToken(token)
    res.assertStatus(200)
    const body = res.body()
    assert.equal(body.data.length, 1)
    assert.include(body.data[0].title, uniqueTerm)
  })

  test('finds bookmark by description', async ({ client, assert }) => {
    const { token, userId } = await createUserAndGetId(client)
    const uniqueTerm = `srchdesc${randomUUID().slice(0, 8)}`
    await createBookmarkDirect(userId, {
      title: 'Generic Title',
      description: `A detailed guide about ${uniqueTerm} techniques`,
    })

    const res = await client.get(`/api/search?q=${uniqueTerm}`).bearerToken(token)
    res.assertStatus(200)
    assert.equal(res.body().data.length, 1)
  })

  test('finds bookmark by summary', async ({ client, assert }) => {
    const { token, userId } = await createUserAndGetId(client)
    const uniqueTerm = `srchsum${randomUUID().slice(0, 8)}`
    await createBookmarkDirect(userId, {
      title: 'Some Title',
      summary: `This article discusses ${uniqueTerm} in depth`,
    })

    const res = await client.get(`/api/search?q=${uniqueTerm}`).bearerToken(token)
    res.assertStatus(200)
    assert.equal(res.body().data.length, 1)
  })

  test('finds bookmark by plain text', async ({ client, assert }) => {
    const { token, userId } = await createUserAndGetId(client)
    const uniqueTerm = `srchtext${randomUUID().slice(0, 8)}`
    await createBookmarkDirect(userId, {
      title: 'Plain Text Test',
      plainText: `The content mentions ${uniqueTerm} several times in the body`,
    })

    const res = await client.get(`/api/search?q=${uniqueTerm}`).bearerToken(token)
    res.assertStatus(200)
    assert.equal(res.body().data.length, 1)
  })

  test('returns snippets with mark tags', async ({ client, assert }) => {
    const { token, userId } = await createUserAndGetId(client)
    const uniqueTerm = `srchsnip${randomUUID().slice(0, 8)}`
    await createBookmarkDirect(userId, {
      title: `Snippet test ${uniqueTerm}`,
      description: `This is about ${uniqueTerm} and more`,
    })

    const res = await client.get(`/api/search?q=${uniqueTerm}`).bearerToken(token)
    res.assertStatus(200)
    const snippet = res.body().data[0].snippet
    assert.include(snippet, '<mark>')
    assert.include(snippet, '</mark>')
  })

  test('does not return other users bookmarks', async ({ client, assert }) => {
    const user1 = await createUserAndGetId(client)
    const user2 = await createUserAndGetId(client)
    const uniqueTerm = `srchisolation${randomUUID().slice(0, 8)}`

    await createBookmarkDirect(user1.userId, {
      title: `Private ${uniqueTerm} bookmark`,
    })

    // User 2 should not find user 1's bookmark
    const res = await client.get(`/api/search?q=${uniqueTerm}`).bearerToken(user2.token)
    res.assertStatus(200)
    assert.equal(res.body().data.length, 0)
  })

  test('supports pagination', async ({ client, assert }) => {
    const { token, userId } = await createUserAndGetId(client)
    const uniqueTerm = `srchpage${randomUUID().slice(0, 8)}`

    // Create 3 bookmarks with the same term
    await Promise.all(
      [1, 2, 3].map((i) =>
        createBookmarkDirect(userId, {
          title: `${uniqueTerm} article number ${i}`,
        })
      )
    )

    const res = await client.get(`/api/search?q=${uniqueTerm}&limit=2&page=1`).bearerToken(token)
    res.assertStatus(200)
    const body = res.body()
    assert.equal(body.data.length, 2)
    assert.equal(body.meta.total, 3)
    assert.equal(body.meta.page, 1)
    assert.equal(body.meta.limit, 2)

    // Page 2
    const res2 = await client.get(`/api/search?q=${uniqueTerm}&limit=2&page=2`).bearerToken(token)
    res2.assertStatus(200)
    assert.equal(res2.body().data.length, 1)
  })

  test('finds bookmark by tag name', async ({ client, assert }) => {
    const { token, userId } = await createUserAndGetId(client)
    const uniqueTag = `srchtag${randomUUID().slice(0, 8)}`

    const bookmark = await createBookmarkDirect(userId, {
      title: 'Tagged Article',
    })

    // Create tag and associate with bookmark
    const { default: Tag } = await import('#models/tag')
    const tag = await Tag.create({
      userId,
      name: uniqueTag,
      slug: uniqueTag,
      isAiGenerated: false,
    })
    await bookmark.related('tags').attach([tag.id])

    const res = await client.get(`/api/search?q=${uniqueTag}`).bearerToken(token)
    res.assertStatus(200)
    assert.equal(res.body().data.length, 1)
  })

  test('sanitizes FTS5 special characters', async ({ client, assert }) => {
    const { token } = await createUserAndGetId(client)
    // These should not cause FTS5 syntax errors
    const res = await client.get('/api/search?q=test*"():^{}').bearerToken(token)
    res.assertStatus(200)
    assert.isArray(res.body().data)
  })

  test('excludes archived bookmarks from results', async ({ client, assert }) => {
    const { token, userId } = await createUserAndGetId(client)
    const uniqueTerm = `srcharchive${randomUUID().slice(0, 8)}`
    await createBookmarkDirect(userId, {
      title: `${uniqueTerm} archived article`,
      isArchived: true,
    })

    const res = await client.get(`/api/search?q=${uniqueTerm}`).bearerToken(token)
    res.assertStatus(200)
    assert.equal(res.body().data.length, 0)
  })

  test('returns empty for query with only special characters', async ({ client, assert }) => {
    const { token } = await createUserAndGetId(client)
    const res = await client.get('/api/search?q=*"()').bearerToken(token)
    res.assertStatus(200)
    assert.equal(res.body().data.length, 0)
  })
})

test.group('sanitizeQuery', () => {
  test('strips FTS5 operators', async ({ assert }) => {
    const { sanitizeQuery } = await import('#services/search_service')
    const result = sanitizeQuery('hello "world" (test)')
    assert.notInclude(result, '(')
    assert.notInclude(result, ')')
  })

  test('returns empty for whitespace-only input', async ({ assert }) => {
    const { sanitizeQuery } = await import('#services/search_service')
    assert.equal(sanitizeQuery('   '), '')
  })

  test('adds prefix matching', async ({ assert }) => {
    const { sanitizeQuery } = await import('#services/search_service')
    const result = sanitizeQuery('javascript react')
    assert.include(result, '"javascript"*')
    assert.include(result, '"react"*')
  })

  test('truncates long queries', async ({ assert }) => {
    const { sanitizeQuery } = await import('#services/search_service')
    const long = 'a'.repeat(300)
    const result = sanitizeQuery(long)
    assert.isBelow(result.length, 210)
  })
})
