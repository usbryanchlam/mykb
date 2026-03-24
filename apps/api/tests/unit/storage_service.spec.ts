import { test } from '@japa/runner'
import StorageService from '#services/storage_service'

test.group('StorageService', () => {
  test('isConfigured returns false when env vars are missing', ({ assert }) => {
    const service = new StorageService()
    // In test env, OCI vars are not set
    assert.isFalse(service.isConfigured)
  })

  test('getPublicUrl returns null when not configured', ({ assert }) => {
    const service = new StorageService()
    assert.isNull(service.getPublicUrl('thumbnails/1.jpg'))
  })

  test('upload throws when not configured', async ({ assert }) => {
    const service = new StorageService()
    try {
      await service.upload('test.jpg', Buffer.from('data'), 'image/jpeg')
      assert.fail('Should have thrown')
    } catch (err) {
      assert.include((err as Error).message, 'not configured')
    }
  })

  test('download throws when not configured', async ({ assert }) => {
    const service = new StorageService()
    try {
      await service.download('test.jpg')
      assert.fail('Should have thrown')
    } catch (err) {
      assert.include((err as Error).message, 'not configured')
    }
  })

  test('delete throws when not configured', async ({ assert }) => {
    const service = new StorageService()
    try {
      await service.delete('test.jpg')
      assert.fail('Should have thrown')
    } catch (err) {
      assert.include((err as Error).message, 'not configured')
    }
  })
})
