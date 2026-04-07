import { describe, expect, it, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import type { ReactNode } from 'react'
import { CollectionCard } from './collection-card'

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: ReactNode
    className?: string
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

describe('CollectionCard', () => {
  const defaultProps = {
    id: 1,
    name: 'Dev Resources',
    description: 'Useful links for development',
    icon: null,
    bookmarksCount: 5,
    onDelete: vi.fn(),
  }

  it('renders collection name', () => {
    const { container } = render(<CollectionCard {...defaultProps} />)
    const h3 = container.querySelector('h3')!
    expect(h3.textContent).toBe('Dev Resources')
  })

  it('renders description when present', () => {
    const { container } = render(<CollectionCard {...defaultProps} />)
    expect(container.textContent).toContain('Useful links for development')
  })

  it('renders bookmark count', () => {
    const { container } = render(<CollectionCard {...defaultProps} />)
    expect(container.textContent).toContain('5 bookmarks')
  })

  it('renders singular for 1 bookmark', () => {
    const { container } = render(<CollectionCard {...defaultProps} bookmarksCount={1} />)
    expect(container.textContent).toContain('1 bookmark')
  })

  it('links to collection detail page', () => {
    const { container } = render(<CollectionCard {...defaultProps} id={42} />)
    const link = container.querySelector('a[href="/dashboard/collections/42"]')
    expect(link).toBeTruthy()
  })

  it('opens confirm dialog when delete clicked', () => {
    const { container } = render(<CollectionCard {...defaultProps} />)
    const deleteBtn = container.querySelector(
      'button[aria-label="Delete collection Dev Resources"]',
    )!
    fireEvent.click(deleteBtn)
    expect(document.body.textContent).toContain('Bookmarks in this collection will not be deleted')
  })

  it('calls onDelete when confirm dialog is confirmed', () => {
    const onDelete = vi.fn()
    const { container, getByRole } = render(
      <CollectionCard {...defaultProps} onDelete={onDelete} />,
    )
    const deleteBtn = container.querySelector(
      'button[aria-label="Delete collection Dev Resources"]',
    )!
    fireEvent.click(deleteBtn)
    fireEvent.click(getByRole('button', { name: 'Delete' }))
    expect(onDelete).toHaveBeenCalledWith(1)
  })

  it('does not call onDelete when confirm dialog is cancelled', () => {
    const onDelete = vi.fn()
    const { container, getByRole } = render(
      <CollectionCard {...defaultProps} onDelete={onDelete} />,
    )
    const deleteBtn = container.querySelector(
      'button[aria-label="Delete collection Dev Resources"]',
    )!
    fireEvent.click(deleteBtn)
    fireEvent.click(getByRole('button', { name: 'Cancel' }))
    expect(onDelete).not.toHaveBeenCalled()
  })
})
