import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { BookmarkThumbnail } from './bookmark-thumbnail'

describe('BookmarkThumbnail', () => {
  afterEach(() => cleanup())

  it('renders thumbnail when thumbnailUrl is available', () => {
    render(
      <BookmarkThumbnail
        thumbnailUrl="https://storage.example.com/thumb.jpg"
        ogImageUrl="https://example.com/og.jpg"
        alt="Test"
      />,
    )
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://storage.example.com/thumb.jpg')
  })

  it('falls back to ogImageUrl when thumbnailUrl is null', () => {
    render(
      <BookmarkThumbnail thumbnailUrl={null} ogImageUrl="https://example.com/og.jpg" alt="Test" />,
    )
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://example.com/og.jpg')
  })

  it('renders nothing when both URLs are null', () => {
    const { container } = render(
      <BookmarkThumbnail thumbnailUrl={null} ogImageUrl={null} alt="Test" />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when URLs are unsafe', () => {
    const { container } = render(
      <BookmarkThumbnail
        thumbnailUrl="http://insecure.com/img.jpg"
        ogImageUrl="javascript:alert(1)"
        alt="Test"
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('hides on image load error', () => {
    const { container } = render(
      <BookmarkThumbnail
        thumbnailUrl="https://example.com/broken.jpg"
        ogImageUrl={null}
        alt="Test"
      />,
    )
    const img = screen.getByRole('img')
    fireEvent.error(img)
    expect(container.firstChild).toBeNull()
  })

  it('prefers thumbnailUrl over ogImageUrl', () => {
    render(
      <BookmarkThumbnail
        thumbnailUrl="https://storage.example.com/thumb.jpg"
        ogImageUrl="https://example.com/og.jpg"
        alt="Test"
      />,
    )
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://storage.example.com/thumb.jpg')
  })

  it('uses lazy loading', () => {
    render(
      <BookmarkThumbnail
        thumbnailUrl="https://storage.example.com/thumb.jpg"
        ogImageUrl={null}
        alt="Test"
      />,
    )
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('loading', 'lazy')
  })
})
