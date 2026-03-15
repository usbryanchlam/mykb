import { randomUUID } from 'node:crypto'
import { test } from '@japa/runner'
import { createTestToken } from '#tests/helpers/auth'

test.group('GET /health', () => {
  test('returns ok without authentication', async ({ client }) => {
    const response = await client.get('/health')
    response.assertStatus(200)
    response.assertBodyContains({ status: 'ok' })
  })
})

test.group('GET /api/me', () => {
  test('returns 401 without authorization header', async ({ client }) => {
    const response = await client.get('/api/me')
    response.assertStatus(401)
    response.assertBodyContains({
      success: false,
      error: 'Missing or invalid authorization header',
    })
  })

  test('returns 401 with invalid token', async ({ client }) => {
    const response = await client.get('/api/me').bearerToken('invalid-token')
    response.assertStatus(401)
    response.assertBodyContains({
      success: false,
      error: 'Invalid or expired token',
    })
  })

  test('returns user profile with valid token', async ({ client, assert }) => {
    const token = await createTestToken({
      sub: 'auth0|func-test-user',
      email: 'func@example.com',
      name: 'Func User',
      roles: ['admin'],
    })

    const response = await client.get('/api/me').bearerToken(token)
    response.assertStatus(200)

    const body = response.body()
    assert.isTrue(body.success)
    assert.equal(body.data.email, 'func@example.com')
    assert.equal(body.data.name, 'Func User')
    assert.equal(body.data.role, 'admin')
    assert.equal(body.data.auth0Sub, 'auth0|func-test-user')
  })

  test('creates user on first request and updates on subsequent', async ({ client, assert }) => {
    const sub = `auth0|upsert-test-${randomUUID()}`

    const token1 = await createTestToken({
      sub,
      email: 'first@example.com',
      name: 'First Name',
      roles: ['viewer'],
    })

    const response1 = await client.get('/api/me').bearerToken(token1)
    response1.assertStatus(200)
    assert.equal(response1.body().data.name, 'First Name')
    assert.equal(response1.body().data.role, 'viewer')

    const token2 = await createTestToken({
      sub,
      email: 'first@example.com',
      name: 'Updated Name',
      roles: ['editor'],
    })

    const response2 = await client.get('/api/me').bearerToken(token2)
    response2.assertStatus(200)
    assert.equal(response2.body().data.name, 'Updated Name')
    assert.equal(response2.body().data.role, 'editor')
    assert.equal(response2.body().data.id, response1.body().data.id)
  })

  test('defaults to viewer role when no roles in token', async ({ client, assert }) => {
    const token = await createTestToken({
      sub: `auth0|no-role-${randomUUID()}`,
      roles: [],
    })

    const response = await client.get('/api/me').bearerToken(token)
    response.assertStatus(200)
    assert.equal(response.body().data.role, 'viewer')
  })
})
