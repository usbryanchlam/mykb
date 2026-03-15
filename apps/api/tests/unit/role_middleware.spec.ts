import { test } from '@japa/runner'
import RoleMiddleware from '#middleware/role_middleware'

function createMockContext(role?: string) {
  let statusCode = 200
  let responseBody: unknown = null

  const ctx = {
    auth0User: role ? ({ role } as any) : undefined,
    response: {
      unauthorized(body: unknown) {
        statusCode = 401
        responseBody = body
      },
      forbidden(body: unknown) {
        statusCode = 403
        responseBody = body
      },
    },
  } as any

  return { ctx, getStatus: () => statusCode, getBody: () => responseBody }
}

test.group('RoleMiddleware', () => {
  test('allows admin to access admin-required route', async ({ assert }) => {
    const { ctx } = createMockContext('admin')
    const middleware = new RoleMiddleware()
    let nextCalled = false

    await middleware.handle(
      ctx,
      () => {
        nextCalled = true
      },
      { roles: ['admin'] }
    )
    assert.isTrue(nextCalled)
  })

  test('allows admin to access editor-required route', async ({ assert }) => {
    const { ctx } = createMockContext('admin')
    const middleware = new RoleMiddleware()
    let nextCalled = false

    await middleware.handle(
      ctx,
      () => {
        nextCalled = true
      },
      { roles: ['editor'] }
    )
    assert.isTrue(nextCalled)
  })

  test('allows editor to access editor-required route', async ({ assert }) => {
    const { ctx } = createMockContext('editor')
    const middleware = new RoleMiddleware()
    let nextCalled = false

    await middleware.handle(
      ctx,
      () => {
        nextCalled = true
      },
      { roles: ['editor'] }
    )
    assert.isTrue(nextCalled)
  })

  test('denies viewer from admin-required route', async ({ assert }) => {
    const { ctx, getStatus, getBody } = createMockContext('viewer')
    const middleware = new RoleMiddleware()
    let nextCalled = false

    await middleware.handle(
      ctx,
      () => {
        nextCalled = true
      },
      { roles: ['admin'] }
    )
    assert.isFalse(nextCalled)
    assert.equal(getStatus(), 403)
    assert.deepEqual(getBody(), { success: false, data: null, error: 'Insufficient permissions' })
  })

  test('denies viewer from editor-required route', async ({ assert }) => {
    const { ctx } = createMockContext('viewer')
    const middleware = new RoleMiddleware()
    let nextCalled = false

    await middleware.handle(
      ctx,
      () => {
        nextCalled = true
      },
      { roles: ['editor'] }
    )
    assert.isFalse(nextCalled)
  })

  test('returns 401 when no auth0User on context', async ({ assert }) => {
    const { ctx, getStatus, getBody } = createMockContext()
    const middleware = new RoleMiddleware()
    let nextCalled = false

    await middleware.handle(
      ctx,
      () => {
        nextCalled = true
      },
      { roles: ['viewer'] }
    )
    assert.isFalse(nextCalled)
    assert.equal(getStatus(), 401)
    assert.deepEqual(getBody(), { success: false, data: null, error: 'Authentication required' })
  })

  test('allows viewer to access viewer-required route', async ({ assert }) => {
    const { ctx } = createMockContext('viewer')
    const middleware = new RoleMiddleware()
    let nextCalled = false

    await middleware.handle(
      ctx,
      () => {
        nextCalled = true
      },
      { roles: ['viewer'] }
    )
    assert.isTrue(nextCalled)
  })
})
