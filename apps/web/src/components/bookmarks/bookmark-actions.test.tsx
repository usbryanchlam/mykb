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

  it('opens confirm dialog when trash clicked', () => {
    const { container } = render(<BookmarkActions {...defaultProps} />)

    fireEvent.click(queryButton(container, 'Delete bookmark'))
    expect(document.body.textContent).toContain('This cannot be undone')
  })

  it('calls onDelete when confirm dialog is confirmed', () => {
    const onDelete = vi.fn()
    const { container, getByRole } = render(
      <BookmarkActions {...defaultProps} onDelete={onDelete} />,
    )

    fireEvent.click(queryButton(container, 'Delete bookmark'))
    fireEvent.click(getByRole('button', { name: 'Delete' }))
    expect(onDelete).toHaveBeenCalledOnce()
  })

  it('does not call onDelete when confirm dialog is cancelled', () => {
    const onDelete = vi.fn()
    const { container, getByRole } = render(
      <BookmarkActions {...defaultProps} onDelete={onDelete} />,
    )

    fireEvent.click(queryButton(container, 'Delete bookmark'))
    fireEvent.click(getByRole('button', { name: 'Cancel' }))
    expect(onDelete).not.toHaveBeenCalled()
  })
})
