import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import NotFound from './not-found'

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

describe('NotFound page', () => {
  it('renders 404 heading', () => {
    const { container } = render(<NotFound />)
    expect(container.textContent).toContain('404')
  })

  it('renders descriptive message', () => {
    const { container } = render(<NotFound />)
    expect(container.textContent).toContain("doesn't exist")
  })

  it('links to dashboard', () => {
    const { container } = render(<NotFound />)
    const link = container.querySelector('a[href="/dashboard"]')
    expect(link).toBeTruthy()
    expect(link?.textContent).toContain('Back to Dashboard')
  })

  it('does not expose sensitive information', () => {
    const { container } = render(<NotFound />)
    const text = container.textContent ?? ''
    expect(text).not.toContain('stack')
    expect(text).not.toContain('.ts')
    expect(text).not.toContain('node_modules')
  })
})
