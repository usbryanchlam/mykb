import { randomUUID } from 'node:crypto'
import { test } from '@japa/runner'
import { createTestToken } from '#tests/helpers/auth'
import Bookmark from '#models/bookmark'

async function createViewerToken(client: any) {
  const sub = `auth0|viewer-${randomUUID()}`
  const token = await createTestToken({
    sub,
    email: `${sub}@example.com`,
    roles: ['viewer'],
  })
  const res = await client.get('/api/me').bearerToken(token)
  return { token, userId: res.body().data.id as number }
}

async function createEditorToken(client: any) {
  const sub = `auth0|editor-${randomUUID()}`
  const token = await createTestToken({
    sub,
    email: `${sub}@example.com`,
    roles: ['editor'],
  })
  const res = await client.get('/api/me').bearerToken(token)
  return { token, userId: res.body().data.id as number }
}

test.group('Viewer role restrictions — read allowed', () => {
  test('viewer can list bookmarks', async ({ client }) => {
    const { token } = await createViewerToken(client)
    const res = await client.get('/api/bookmarks').bearerToken(token)
    res.assertStatus(200)
  })

  test('viewer can list collections', async ({ client }) => {
    const { token } = await createViewerToken(client)
    const res = await client.get('/api/collections').bearerToken(token)
    res.assertStatus(200)
  })

  test('viewer can list tags', async ({ client }) => {
    const { token } = await createViewerToken(client)
    const res = await client.get('/api/tags').bearerToken(token)
    res.assertStatus(200)
  })

  test('viewer can list smart lists', async ({ client }) => {
    const { token } = await createViewerToken(client)
    const res = await client.get('/api/smart-lists').bearerToken(token)
    res.assertStatus(200)
  })

  test('viewer can search', async ({ client }) => {
    const { token } = await createViewerToken(client)
    const res = await client.get('/api/search?q=test').bearerToken(token)
    res.assertStatus(200)
  })
})

test.group('Viewer role restrictions — write blocked', () => {
  test('viewer cannot create bookmark', async ({ client }) => {
    const { token } = await createViewerToken(client)
    const res = await client
      .post('/api/bookmarks')
      .json({ url: 'https://example.com' })
      .bearerToken(token)
    res.assertStatus(403)
  })

  test('viewer cannot delete bookmark', async ({ client }) => {
    const { token: editorToken, userId } = await createEditorToken(client)
    const bm = await Bookmark.create({
      userId,
      url: `https://viewer-del-${randomUUID()}.example.com`,
    })

    const { token: viewerToken } = await createViewerToken(client)
    const res = await client.delete(`/api/bookmarks/${bm.id}`).bearerToken(viewerToken)
    res.assertStatus(403)
  })

  test('viewer cannot favorite bookmark', async ({ client }) => {
    const { token: editorToken, userId } = await createEditorToken(client)
    const bm = await Bookmark.create({
      userId,
      url: `https://viewer-fav-${randomUUID()}.example.com`,
    })

    const { token: viewerToken } = await createViewerToken(client)
    const res = await client.patch(`/api/bookmarks/${bm.id}/favorite`).bearerToken(viewerToken)
    res.assertStatus(403)
  })

  test('viewer cannot archive bookmark', async ({ client }) => {
    const { token: editorToken, userId } = await createEditorToken(client)
    const bm = await Bookmark.create({
      userId,
      url: `https://viewer-arc-${randomUUID()}.example.com`,
    })

    const { token: viewerToken } = await createViewerToken(client)
    const res = await client.patch(`/api/bookmarks/${bm.id}/archive`).bearerToken(viewerToken)
    res.assertStatus(403)
  })

  test('viewer cannot create collection', async ({ client }) => {
    const { token } = await createViewerToken(client)
    const res = await client.post('/api/collections').json({ name: 'Test' }).bearerToken(token)
    res.assertStatus(403)
  })

  test('viewer cannot create tag', async ({ client }) => {
    const { token } = await createViewerToken(client)
    const res = await client.post('/api/tags').json({ name: 'test-tag' }).bearerToken(token)
    res.assertStatus(403)
  })

  test('viewer cannot create smart list', async ({ client }) => {
    const { token } = await createViewerToken(client)
    const res = await client
      .post('/api/smart-lists')
      .json({ name: 'Test', filter_query: {} })
      .bearerToken(token)
    res.assertStatus(403)
  })
})
