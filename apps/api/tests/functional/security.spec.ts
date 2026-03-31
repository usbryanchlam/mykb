import { randomUUID } from 'node:crypto'
import { test } from '@japa/runner'
import { createTestToken } from '#tests/helpers/auth'
import { rateLimitStore } from '#middleware/rate_limit_middleware'

async function createUserAndGetToken(client: any) {
  const sub = `auth0|sec-${randomUUID()}`
  const token = await createTestToken({
    sub,
    email: `${sub}@example.com`,
    roles: ['editor'],
  })
  await client.get('/api/me').bearerToken(token)
  return token
}

test.group('Security Headers', () => {
  test('sets X-Frame-Options header', async ({ client, assert }) => {
    const res = await client.get('/health')
    res.assertStatus(200)
    assert.equal(res.header('x-frame-options'), 'DENY')
  })

  test('sets X-Content-Type-Options header', async ({ client, assert }) => {
    const res = await client.get('/health')
    assert.equal(res.header('x-content-type-options'), 'nosniff')
  })

  test('sets Referrer-Policy header', async ({ client, assert }) => {
    const res = await client.get('/health')
    assert.equal(res.header('referrer-policy'), 'strict-origin-when-cross-origin')
  })

  test('sets Permissions-Policy header', async ({ client, assert }) => {
    const res = await client.get('/health')
    const pp = res.header('permissions-policy')
    assert.include(pp, 'camera=()')
    assert.include(pp, 'microphone=()')
  })

  test('sets Content-Security-Policy header', async ({ client, assert }) => {
    const res = await client.get('/health')
    const csp = res.header('content-security-policy')
    assert.include(csp, "default-src 'none'")
    assert.include(csp, "frame-ancestors 'none'")
  })

  test('does not set HSTS header (delegated to CDN/load balancer)', async ({ client, assert }) => {
    const res = await client.get('/health')
    assert.isUndefined(res.header('strict-transport-security'))
  })

  test('disables X-XSS-Protection', async ({ client, assert }) => {
    const res = await client.get('/health')
    assert.equal(res.header('x-xss-protection'), '0')
  })
})

test.group('Rate Limiting', (group) => {
  group.each.setup(() => {
    // Clear rate limit store before each test
    rateLimitStore.clear()
  })

  test('returns rate limit headers on authenticated requests', async ({ client, assert }) => {
    const token = await createUserAndGetToken(client)
    const res = await client.get('/api/bookmarks').bearerToken(token)
    res.assertStatus(200)
    assert.equal(res.header('x-ratelimit-limit'), '100')
    assert.exists(res.header('x-ratelimit-remaining'))
    assert.exists(res.header('x-ratelimit-reset'))
  })

  test('returns 429 when rate limit exceeded', async ({ client, assert }) => {
    const token = await createUserAndGetToken(client)

    // Simulate hitting the limit by pre-filling the store
    const meRes = await client.get('/api/me').bearerToken(token)
    const userId = meRes.body().data.id.toString()
    const key = `${userId}:100:60000`
    rateLimitStore.set(key, { count: 101, resetAt: Date.now() + 60_000 })

    const res = await client.get('/api/bookmarks').bearerToken(token)
    res.assertStatus(429)
    assert.equal(res.body().error, 'Too many requests. Please try again later.')
    assert.exists(res.header('retry-after'))
  })

  test('rate limit resets after window expires', async ({ client, assert }) => {
    const token = await createUserAndGetToken(client)
    const meRes = await client.get('/api/me').bearerToken(token)
    const userId = meRes.body().data.id.toString()
    const key = `${userId}:100:60000`

    // Set expired entry
    rateLimitStore.set(key, { count: 200, resetAt: Date.now() - 1000 })

    const res = await client.get('/api/bookmarks').bearerToken(token)
    res.assertStatus(200)
    assert.equal(res.header('x-ratelimit-remaining'), '99')
  })
})
