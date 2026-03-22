import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Pagination } from './pagination'

function querySlotButton(container: HTMLElement, label: string) {
  return container.querySelector(
    `button[data-slot="button"][aria-label="${label}"]`,
  ) as HTMLButtonElement
}

describe('Pagination', () => {
  it('renders page info', () => {
    render(<Pagination meta={{ total: 50, page: 2, limit: 20 }} page={2} onPageChange={vi.fn()} />)

    expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument()
  })

  it('disables previous on first page', () => {
    const { container } = render(
      <Pagination meta={{ total: 50, page: 1, limit: 20 }} page={1} onPageChange={vi.fn()} />,
    )

    expect(querySlotButton(container, 'Previous page')).toBeDisabled()
  })

  it('disables next on last page', () => {
    const { container } = render(
      <Pagination meta={{ total: 50, page: 3, limit: 20 }} page={3} onPageChange={vi.fn()} />,
    )

    expect(querySlotButton(container, 'Next page')).toBeDisabled()
  })

  it('calls onPageChange with previous page', () => {
    const onPageChange = vi.fn()
    const { container } = render(
      <Pagination meta={{ total: 50, page: 2, limit: 20 }} page={2} onPageChange={onPageChange} />,
    )

    fireEvent.click(querySlotButton(container, 'Previous page'))
    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it('calls onPageChange with next page', () => {
    const onPageChange = vi.fn()
    const { container } = render(
      <Pagination meta={{ total: 50, page: 1, limit: 20 }} page={1} onPageChange={onPageChange} />,
    )

    fireEvent.click(querySlotButton(container, 'Next page'))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('hides when only one page', () => {
    const { container } = render(
      <Pagination meta={{ total: 5, page: 1, limit: 20 }} page={1} onPageChange={vi.fn()} />,
    )

    expect(container.innerHTML).toBe('')
  })
})
