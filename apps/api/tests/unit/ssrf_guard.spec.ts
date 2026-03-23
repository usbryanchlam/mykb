import { test } from '@japa/runner'
import { isPrivateIp, assertSafeUrl } from '#services/ssrf_guard'

test.group('isPrivateIp', () => {
  test('blocks loopback IPv4', ({ assert }) => {
    assert.isTrue(isPrivateIp('127.0.0.1'))
    assert.isTrue(isPrivateIp('127.255.255.255'))
  })

  test('blocks 10.x.x.x range', ({ assert }) => {
    assert.isTrue(isPrivateIp('10.0.0.1'))
    assert.isTrue(isPrivateIp('10.255.255.255'))
  })

  test('blocks 192.168.x.x range', ({ assert }) => {
    assert.isTrue(isPrivateIp('192.168.0.1'))
    assert.isTrue(isPrivateIp('192.168.255.255'))
  })

  test('blocks 172.16-31.x.x range', ({ assert }) => {
    assert.isTrue(isPrivateIp('172.16.0.1'))
    assert.isTrue(isPrivateIp('172.31.255.255'))
    assert.isFalse(isPrivateIp('172.15.0.1'))
    assert.isFalse(isPrivateIp('172.32.0.1'))
  })

  test('blocks link-local IPv4', ({ assert }) => {
    assert.isTrue(isPrivateIp('169.254.0.1'))
  })

  test('blocks 0.0.0.0', ({ assert }) => {
    assert.isTrue(isPrivateIp('0.0.0.0'))
  })

  test('blocks IPv6 loopback', ({ assert }) => {
    assert.isTrue(isPrivateIp('::1'))
  })

  test('blocks IPv6 link-local', ({ assert }) => {
    assert.isTrue(isPrivateIp('fe80::1'))
  })

  test('blocks IPv6 unique local (fc00::/7)', ({ assert }) => {
    assert.isTrue(isPrivateIp('fc00::1'))
    assert.isTrue(isPrivateIp('fd00::1'))
    assert.isTrue(isPrivateIp('fdab:cdef::1'))
  })

  test('allows public IPs', ({ assert }) => {
    assert.isFalse(isPrivateIp('8.8.8.8'))
    assert.isFalse(isPrivateIp('1.1.1.1'))
    assert.isFalse(isPrivateIp('93.184.216.34'))
  })
})

test.group('assertSafeUrl', () => {
  test('rejects invalid URL', async ({ assert }) => {
    try {
      await assertSafeUrl('not-a-url')
      assert.fail('Should have thrown')
    } catch (err) {
      assert.include((err as Error).message, 'Invalid URL')
    }
  })

  test('rejects file:// protocol', async ({ assert }) => {
    try {
      await assertSafeUrl('file:///etc/passwd')
      assert.fail('Should have thrown')
    } catch (err) {
      assert.include((err as Error).message, 'Blocked protocol')
    }
  })

  test('rejects ftp:// protocol', async ({ assert }) => {
    try {
      await assertSafeUrl('ftp://files.example.com')
      assert.fail('Should have thrown')
    } catch (err) {
      assert.include((err as Error).message, 'Blocked protocol')
    }
  })

  test('rejects direct private IP in URL', async ({ assert }) => {
    try {
      await assertSafeUrl('http://127.0.0.1')
      assert.fail('Should have thrown')
    } catch (err) {
      assert.include((err as Error).message, 'Blocked private IP')
    }
  })

  test('rejects localhost', async ({ assert }) => {
    try {
      await assertSafeUrl('http://localhost')
      assert.fail('Should have thrown')
    } catch (err) {
      assert.include((err as Error).message, 'Blocked')
    }
  })

  test('rejects 192.168.x.x in URL', async ({ assert }) => {
    try {
      await assertSafeUrl('http://192.168.1.1')
      assert.fail('Should have thrown')
    } catch (err) {
      assert.include((err as Error).message, 'Blocked private IP')
    }
  })
})
