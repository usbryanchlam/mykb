import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  isSafeUrl,
  isSafeFaviconUrl,
  isSafeImageUrl,
  getDomain,
  formatRelativeDate,
  formatCompactDate,
} from './bookmark-utils'

describe('isSafeUrl', () => {
  it('accepts https urls', () => {
    expect(isSafeUrl('https://example.com')).toBe(true)
  })

  it('accepts http urls', () => {
    expect(isSafeUrl('http://example.com')).toBe(true)
  })

  it('rejects javascript: protocol', () => {
    expect(isSafeUrl('javascript:alert(1)')).toBe(false)
  })

  it('rejects data: protocol', () => {
    expect(isSafeUrl('data:text/html,<h1>hi</h1>')).toBe(false)
  })

  it('rejects ftp: protocol', () => {
    expect(isSafeUrl('ftp://files.example.com')).toBe(false)
  })

  it('rejects invalid urls', () => {
    expect(isSafeUrl('not-a-url')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isSafeUrl('')).toBe(false)
  })
})

describe('isSafeFaviconUrl', () => {
  it('accepts https urls', () => {
    expect(isSafeFaviconUrl('https://example.com/favicon.ico')).toBe(true)
  })

  it('rejects http urls', () => {
    expect(isSafeFaviconUrl('http://example.com/favicon.ico')).toBe(false)
  })

  it('rejects null', () => {
    expect(isSafeFaviconUrl(null)).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isSafeFaviconUrl('')).toBe(false)
  })

  it('rejects javascript: protocol', () => {
    expect(isSafeFaviconUrl('javascript:void(0)')).toBe(false)
  })
})

describe('isSafeImageUrl', () => {
  it('accepts https urls', () => {
    expect(isSafeImageUrl('https://example.com/image.jpg')).toBe(true)
  })

  it('rejects http urls', () => {
    expect(isSafeImageUrl('http://example.com/image.jpg')).toBe(false)
  })

  it('rejects javascript: protocol', () => {
    expect(isSafeImageUrl('javascript:alert(1)')).toBe(false)
  })

  it('rejects data: URIs', () => {
    expect(isSafeImageUrl('data:image/png;base64,abc')).toBe(false)
  })

  it('returns false for null', () => {
    expect(isSafeImageUrl(null)).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isSafeImageUrl('')).toBe(false)
  })

  it('returns false for invalid URL', () => {
    expect(isSafeImageUrl('not-a-url')).toBe(false)
  })
})

describe('getDomain', () => {
  it('extracts hostname from https url', () => {
    expect(getDomain('https://www.example.com/path')).toBe('www.example.com')
  })

  it('extracts hostname from http url', () => {
    expect(getDomain('http://example.com')).toBe('example.com')
  })

  it('returns original string for invalid urls', () => {
    expect(getDomain('not-a-url')).toBe('not-a-url')
  })
})

describe('formatRelativeDate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-21T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "Just now" for dates less than a minute ago', () => {
    expect(formatRelativeDate('2026-03-21T11:59:30Z')).toBe('Just now')
  })

  it('returns minutes ago for dates less than an hour ago', () => {
    expect(formatRelativeDate('2026-03-21T11:30:00Z')).toBe('30m ago')
  })

  it('returns hours ago for dates less than a day ago', () => {
    expect(formatRelativeDate('2026-03-21T06:00:00Z')).toBe('6h ago')
  })

  it('returns days ago for dates less than a week ago', () => {
    expect(formatRelativeDate('2026-03-18T12:00:00Z')).toBe('3d ago')
  })

  it('returns short date for dates older than a week', () => {
    const result = formatRelativeDate('2026-03-01T12:00:00Z')
    expect(result).toContain('Mar')
  })
})

describe('formatCompactDate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-21T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "Today" for dates within the current day', () => {
    expect(formatCompactDate('2026-03-21T06:00:00Z')).toBe('Today')
  })

  it('returns "Yesterday" for dates one day ago', () => {
    expect(formatCompactDate('2026-03-20T12:00:00Z')).toBe('Yesterday')
  })

  it('returns days ago for dates less than a week ago', () => {
    expect(formatCompactDate('2026-03-17T12:00:00Z')).toBe('4d ago')
  })

  it('returns short date for dates older than a week', () => {
    const result = formatCompactDate('2026-03-01T12:00:00Z')
    expect(result).toContain('Mar')
  })
})
