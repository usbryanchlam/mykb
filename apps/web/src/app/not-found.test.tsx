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
  it('renders page not found heading', () => {
    const { container } = render(<NotFound />)
    expect(container.textContent).toContain('Page Not Found')
  })

  it('renders descriptive message with admin contact', () => {
    const { container } = render(<NotFound />)
    expect(container.textContent).toContain("doesn't exist")
    expect(container.textContent).toContain('bryanlam.dev@techie.com')
  })

  it('links to home page', () => {
    const { container } = render(<NotFound />)
    const link = container.querySelector('a[href="/"]')
    expect(link).toBeTruthy()
    expect(link?.textContent).toContain('Back to Home')
  })

  it('does not expose sensitive information', () => {
    const { container } = render(<NotFound />)
    const text = container.textContent ?? ''
    expect(text).not.toContain('stack')
    expect(text).not.toContain('.ts')
    expect(text).not.toContain('node_modules')
  })
})
