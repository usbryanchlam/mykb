import { describe, expect, it, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { BookmarkActions } from './bookmark-actions'

function queryButton(container: HTMLElement, label: string) {
  return container.querySelector(
    `button[data-slot="button"][title="${label}"]`,
  ) as HTMLButtonElement
}

describe('BookmarkActions', () => {
  const defaultProps = {
    isFavorite: false,
    isArchived: false,
    url: 'https://example.com',
    onToggleFavorite: vi.fn(),
    onToggleArchive: vi.fn(),
    onDelete: vi.fn(),
  }

  it('renders favorite and archive buttons', () => {
    const { container } = render(<BookmarkActions {...defaultProps} />)

    expect(queryButton(container, 'Add to favorites')).toBeTruthy()
    expect(queryButton(container, 'Archive')).toBeTruthy()
    expect(queryButton(container, 'Open in new tab')).toBeTruthy()
    expect(queryButton(container, 'Delete bookmark')).toBeTruthy()
  })

  it('shows "Remove from favorites" when favorited', () => {
    const { container } = render(<BookmarkActions {...defaultProps} isFavorite={true} />)

    expect(queryButton(container, 'Remove from favorites')).toBeTruthy()
  })

  it('shows "Unarchive" when archived', () => {
    const { container } = render(<BookmarkActions {...defaultProps} isArchived={true} />)

    expect(queryButton(container, 'Unarchive')).toBeTruthy()
  })

  it('calls onToggleFavorite when star clicked', () => {
    const onToggleFavorite = vi.fn()
    const { container } = render(
      <BookmarkActions {...defaultProps} onToggleFavorite={onToggleFavorite} />,
    )

    fireEvent.click(queryButton(container, 'Add to favorites'))
    expect(onToggleFavorite).toHaveBeenCalledOnce()
  })

  it('calls onToggleArchive when archive clicked', () => {
    const onToggleArchive = vi.fn()
    const { container } = render(
      <BookmarkActions {...defaultProps} onToggleArchive={onToggleArchive} />,
    )

    fireEvent.click(queryButton(container, 'Archive'))
    expect(onToggleArchive).toHaveBeenCalledOnce()
  })

  it('calls onDelete after confirm when trash clicked', () => {
    const onDelete = vi.fn()
    window.confirm = vi.fn(() => true)
    const { container } = render(<BookmarkActions {...defaultProps} onDelete={onDelete} />)

    fireEvent.click(queryButton(container, 'Delete bookmark'))
    expect(onDelete).toHaveBeenCalledOnce()
  })

  it('does not call onDelete when confirm is cancelled', () => {
    const onDelete = vi.fn()
    window.confirm = vi.fn(() => false)
    const { container } = render(<BookmarkActions {...defaultProps} onDelete={onDelete} />)

    fireEvent.click(queryButton(container, 'Delete bookmark'))
    expect(onDelete).not.toHaveBeenCalled()
  })
})
