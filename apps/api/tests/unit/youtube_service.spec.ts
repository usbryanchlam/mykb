import { test } from '@japa/runner'
import { isYouTubeUrl, extractVideoId } from '#services/youtube_service'

test.group('isYouTubeUrl', () => {
  test('detects www.youtube.com', ({ assert }) => {
    assert.isTrue(isYouTubeUrl('https://www.youtube.com/watch?v=abc123def45'))
  })

  test('detects youtube.com without www', ({ assert }) => {
    assert.isTrue(isYouTubeUrl('https://youtube.com/watch?v=abc123def45'))
  })

  test('detects youtu.be short links', ({ assert }) => {
    assert.isTrue(isYouTubeUrl('https://youtu.be/abc123def45'))
  })

  test('detects m.youtube.com', ({ assert }) => {
    assert.isTrue(isYouTubeUrl('https://m.youtube.com/watch?v=abc123def45'))
  })

  test('rejects non-YouTube URLs', ({ assert }) => {
    assert.isFalse(isYouTubeUrl('https://example.com'))
    assert.isFalse(isYouTubeUrl('https://notyoutube.com/watch?v=abc'))
    assert.isFalse(isYouTubeUrl('https://youtube.com.evil.com'))
  })

  test('rejects invalid URLs', ({ assert }) => {
    assert.isFalse(isYouTubeUrl('not-a-url'))
    assert.isFalse(isYouTubeUrl(''))
  })
})

test.group('extractVideoId', () => {
  test('extracts from standard watch URL', ({ assert }) => {
    assert.equal(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ')
  })

  test('extracts from youtu.be short link', ({ assert }) => {
    assert.equal(extractVideoId('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ')
  })

  test('extracts with extra query params', ({ assert }) => {
    assert.equal(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120'), 'dQw4w9WgXcQ')
  })

  test('returns null when no video ID', ({ assert }) => {
    assert.isNull(extractVideoId('https://www.youtube.com/'))
    assert.isNull(extractVideoId('https://www.youtube.com/channel/UC123'))
  })

  test('returns null for youtu.be with empty path', ({ assert }) => {
    assert.isNull(extractVideoId('https://youtu.be/'))
  })

  test('returns null for invalid URL', ({ assert }) => {
    assert.isNull(extractVideoId('not-a-url'))
  })

  test('rejects malformed video IDs', ({ assert }) => {
    // Too short
    assert.isNull(extractVideoId('https://www.youtube.com/watch?v=abc'))
    // Too long
    assert.isNull(extractVideoId('https://www.youtube.com/watch?v=abc123def4567'))
    // Invalid characters
    assert.isNull(extractVideoId('https://www.youtube.com/watch?v=abc123def4!'))
    // Path traversal attempt
    assert.isNull(extractVideoId('https://youtu.be/../../../etc'))
  })

  test('accepts valid 11-char video IDs with underscores and hyphens', ({ assert }) => {
    assert.equal(extractVideoId('https://youtu.be/abc_def-123'), 'abc_def-123')
  })
})
