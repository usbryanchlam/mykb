import { randomUUID } from 'node:crypto'
import { test } from '@japa/runner'
import { createTestToken } from '#tests/helpers/auth'

async function createUserAndGetToken(client: any) {
  const sub = `auth0|err-${randomUUID()}`
  const token = await createTestToken({
    sub,
    email: `${sub}@example.com`,
    roles: ['editor'],
  })
  await client.get('/api/me').bearerToken(token)
  return token
}

test.group('Error Handling', () => {
  test('404 returns structured error without stack traces', async ({ client, assert }) => {
    const token = await createUserAndGetToken(client)
    const res = await client.get('/api/nonexistent-route').bearerToken(token)
    res.assertStatus(404)
    const body = res.body()
    assert.isFalse(body.success)
    assert.isNull(body.data)
    assert.isString(body.error)
    // Should not contain file paths or stack traces
    assert.notInclude(body.error, '.ts')
    assert.notInclude(body.error, 'node_modules')
    assert.notInclude(body.error, 'at ')
  })

  test('401 returns structured error for unauthenticated requests', async ({ client, assert }) => {
    const res = await client.get('/api/bookmarks')
    res.assertStatus(401)
    const body = res.body()
    assert.isFalse(body.success)
    assert.isNull(body.data)
    assert.isString(body.error)
  })

  test('403 returns structured error for insufficient permissions', async ({ client, assert }) => {
    const sub = `auth0|err-viewer-${randomUUID()}`
    const token = await createTestToken({
      sub,
      email: `${sub}@example.com`,
      roles: ['viewer'],
    })
    await client.get('/api/me').bearerToken(token)

    const res = await client.get('/api/admin/stats').bearerToken(token)
    res.assertStatus(403)
    const body = res.body()
    assert.isFalse(body.success)
    assert.isNull(body.data)
    assert.isString(body.error)
    assert.notInclude(body.error, '.ts')
  })

  test('422 returns validation error details', async ({ client, assert }) => {
    const token = await createUserAndGetToken(client)
    const res = await client.post('/api/bookmarks').bearerToken(token).json({ url: '' })
    res.assertStatus(422)
    const body = res.body()
    // Validation errors should include details for user correction
    assert.exists(body.errors || body.error)
  })

  test('API responses always have consistent envelope', async ({ client, assert }) => {
    const token = await createUserAndGetToken(client)

    // 200 response
    const okRes = await client.get('/api/bookmarks').bearerToken(token)
    okRes.assertStatus(200)
    assert.isTrue(okRes.body().success)
    assert.exists(okRes.body().data)

    // 404 response
    const notFoundRes = await client.get('/api/bookmarks/999999').bearerToken(token)
    notFoundRes.assertStatus(404)
    assert.isFalse(notFoundRes.body().success)
    assert.isNull(notFoundRes.body().data)
    assert.isString(notFoundRes.body().error)
  })
})
