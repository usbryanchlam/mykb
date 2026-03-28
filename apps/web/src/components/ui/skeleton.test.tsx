import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Skeleton, BookmarkCardSkeleton, BookmarkGridSkeleton, DetailSkeleton } from './skeleton'

describe('Skeleton', () => {
  it('renders with animate-pulse class', () => {
    const { container } = render(<Skeleton />)
    const el = container.firstElementChild!
    expect(el.className).toContain('animate-pulse')
  })

  it('accepts custom className', () => {
    const { container } = render(<Skeleton className="h-10 w-full" />)
    const el = container.firstElementChild!
    expect(el.className).toContain('h-10')
    expect(el.className).toContain('w-full')
  })
})

describe('BookmarkCardSkeleton', () => {
  it('renders skeleton card structure', () => {
    const { container } = render(<BookmarkCardSkeleton />)
    const pulseElements = container.querySelectorAll('.animate-pulse')
    expect(pulseElements.length).toBeGreaterThan(3)
  })
})

describe('BookmarkGridSkeleton', () => {
  it('renders default 6 skeleton cards', () => {
    const { container } = render(<BookmarkGridSkeleton />)
    const cards = container.querySelectorAll('.rounded-lg.border')
    expect(cards.length).toBe(6)
  })

  it('renders custom count of skeleton cards', () => {
    const { container } = render(<BookmarkGridSkeleton count={3} />)
    const cards = container.querySelectorAll('.rounded-lg.border')
    expect(cards.length).toBe(3)
  })
})

describe('DetailSkeleton', () => {
  it('renders detail page skeleton', () => {
    const { container } = render(<DetailSkeleton />)
    const pulseElements = container.querySelectorAll('.animate-pulse')
    expect(pulseElements.length).toBeGreaterThan(5)
  })
})
