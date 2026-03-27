import { describe, expect, it, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import type { BookmarkTag } from '@mykb/shared'
import type { ReactNode } from 'react'
import { TagBadge } from './tag-badge'

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: ReactNode
    className?: string
    onClick?: (e: React.MouseEvent) => void
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

function createTag(overrides: Partial<BookmarkTag> = {}): BookmarkTag {
  return {
    id: 1,
    name: 'javascript',
    slug: 'javascript',
    isAiGenerated: false,
    ...overrides,
  }
}

describe('TagBadge', () => {
  it('renders tag name', () => {
    const { container } = render(<TagBadge tag={createTag()} />)
    const link = container.querySelector('a')!
    expect(link.textContent).toBe('javascript')
  })

  it('links to tag filter page', () => {
    const { container } = render(<TagBadge tag={createTag({ slug: 'web-dev' })} />)
    const link = container.querySelector('a[href="/dashboard/tags/web-dev"]')
    expect(link).toBeTruthy()
  })

  it('shows AI icon for AI-generated tags', () => {
    const { container } = render(<TagBadge tag={createTag({ isAiGenerated: true })} />)
    // AI tags use purple styling
    const badge = container.firstElementChild!
    expect(badge.className).toContain('purple')
  })

  it('uses blue styling for manual tags', () => {
    const { container } = render(<TagBadge tag={createTag({ isAiGenerated: false })} />)
    const badge = container.firstElementChild!
    expect(badge.className).toContain('blue')
  })

  it('shows remove button when onRemove provided', () => {
    const onRemove = vi.fn()
    const { container } = render(<TagBadge tag={createTag()} onRemove={onRemove} />)
    const removeBtn = container.querySelector('button')
    expect(removeBtn).toBeTruthy()
  })

  it('does not show remove button when onRemove not provided', () => {
    const { container } = render(<TagBadge tag={createTag()} />)
    const removeBtn = container.querySelector('button')
    expect(removeBtn).toBeNull()
  })

  it('calls onRemove with tag id when remove button clicked', () => {
    const onRemove = vi.fn()
    const { container } = render(<TagBadge tag={createTag({ id: 42 })} onRemove={onRemove} />)
    const removeBtn = container.querySelector('button')!
    fireEvent.click(removeBtn)
    expect(onRemove).toHaveBeenCalledWith(42)
  })
})
