import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { StatusBadge } from './status-badge'

describe('StatusBadge', () => {
  it('renders the status text', () => {
    const { container } = render(<StatusBadge status="completed" />)
    expect(container.textContent).toBe('completed')
  })

  it('applies green styles for completed status', () => {
    const { container } = render(<StatusBadge status="completed" />)
    const span = container.querySelector('span')!
    expect(span.className).toContain('bg-green-100')
  })

  it('applies red styles for flagged status', () => {
    const { container } = render(<StatusBadge status="flagged" />)
    const span = container.querySelector('span')!
    expect(span.className).toContain('bg-red-100')
  })

  it('applies yellow styles for pending status', () => {
    const { container } = render(<StatusBadge status="pending" />)
    const span = container.querySelector('span')!
    expect(span.className).toContain('bg-yellow-100')
  })

  it('applies blue styles for processing status', () => {
    const { container } = render(<StatusBadge status="processing" />)
    const span = container.querySelector('span')!
    expect(span.className).toContain('bg-blue-100')
  })

  it('falls back to pending styles for unknown status', () => {
    const { container } = render(<StatusBadge status="unknown" />)
    const span = container.querySelector('span')!
    expect(span.className).toContain('bg-yellow-100')
  })

  it('includes label in title when provided', () => {
    const { container } = render(<StatusBadge status="completed" label="Scrape" />)
    const span = container.querySelector('span')!
    expect(span.getAttribute('title')).toBe('Scrape: completed')
  })
})
