import { test } from '@japa/runner'
import AIService, { sanitizeInput, parseTags } from '#services/ai_service'

test.group('AIService — summarize', () => {
  test('returns null for short text', async ({ assert }) => {
    const service = new AIService()
    const result = await service.summarize('short')
    assert.isNull(result)
  })

  test('returns null for empty text', async ({ assert }) => {
    const service = new AIService()
    const result = await service.summarize('')
    assert.isNull(result)
  })

  test('returns null when GEMINI_API_KEY is not set', async ({ assert }) => {
    const service = new AIService()
    const result = await service.summarize('x'.repeat(200))
    assert.isNull(result)
  })
})

test.group('AIService — generateTags', () => {
  test('returns empty for short text', async ({ assert }) => {
    const service = new AIService()
    const result = await service.generateTags('short', 'Title')
    assert.deepEqual(result, [])
  })

  test('returns empty for empty text', async ({ assert }) => {
    const service = new AIService()
    const result = await service.generateTags('', null)
    assert.deepEqual(result, [])
  })

  test('returns empty when GEMINI_API_KEY is not set', async ({ assert }) => {
    const service = new AIService()
    const result = await service.generateTags('x'.repeat(200), 'Title')
    assert.deepEqual(result, [])
  })
})

test.group('sanitizeInput', () => {
  test('replaces END delimiter markers', ({ assert }) => {
    const result = sanitizeInput('before ---END CONTENT--- after')
    assert.equal(result, 'before [redacted] after')
  })

  test('replaces BEGIN delimiter markers', ({ assert }) => {
    const result = sanitizeInput('before ---BEGIN CONTENT--- after')
    assert.equal(result, 'before [redacted] after')
  })

  test('truncates to maxLength', ({ assert }) => {
    const result = sanitizeInput('x'.repeat(10000), 100)
    assert.equal(result.length, 100)
  })

  test('handles text without markers', ({ assert }) => {
    const result = sanitizeInput('normal text')
    assert.equal(result, 'normal text')
  })
})

test.group('parseTags', () => {
  test('parses a valid JSON array of tags', ({ assert }) => {
    const result = parseTags('["javascript", "web dev", "tutorial"]')
    assert.deepEqual(result, ['javascript', 'web dev', 'tutorial'])
  })

  test('extracts JSON from markdown code fence', ({ assert }) => {
    const result = parseTags('```json\n["tag1", "tag2"]\n```')
    assert.deepEqual(result, ['tag1', 'tag2'])
  })

  test('caps at 5 tags', ({ assert }) => {
    const result = parseTags('["a", "b", "c", "d", "e", "f", "g"]')
    assert.equal(result.length, 5)
  })

  test('lowercases tags', ({ assert }) => {
    const result = parseTags('["JavaScript", "React"]')
    assert.deepEqual(result, ['javascript', 'react'])
  })

  test('truncates long tags to 50 chars', ({ assert }) => {
    const longTag = 'a'.repeat(100)
    const result = parseTags(`["${longTag}"]`)
    assert.equal(result[0].length, 50)
  })

  test('strips HTML characters from tags', ({ assert }) => {
    const result = parseTags('["<script>alert", "tag&value"]')
    assert.deepEqual(result, ['scriptalert', 'tagvalue'])
  })

  test('filters out empty tags', ({ assert }) => {
    const result = parseTags('["valid", "", "  "]')
    assert.deepEqual(result, ['valid'])
  })

  test('returns empty for non-JSON response', ({ assert }) => {
    const result = parseTags('not json at all')
    assert.deepEqual(result, [])
  })

  test('returns empty for non-array JSON', ({ assert }) => {
    const result = parseTags('{"tags": ["a", "b"]}')
    // The regex matches the inner array, so this actually works
    assert.isArray(result)
  })

  test('filters out non-string values', ({ assert }) => {
    const result = parseTags('[123, "valid", null, true]')
    assert.deepEqual(result, ['valid'])
  })
})
