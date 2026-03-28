import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Footer } from './footer'

describe('Footer', () => {
  it('renders version text', () => {
    const { container } = render(<Footer />)
    expect(container.textContent).toContain('MyKB v1.0')
  })

  it('renders current year', () => {
    const { container } = render(<Footer />)
    const year = new Date().getFullYear()
    expect(container.textContent).toContain(String(year))
  })

  it('renders as footer element', () => {
    const { container } = render(<Footer />)
    const footer = container.querySelector('footer')
    expect(footer).toBeTruthy()
  })
})
