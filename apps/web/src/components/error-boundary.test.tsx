import { describe, expect, it, vi, beforeAll, afterAll } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from './error-boundary'

function ThrowingComponent({ shouldThrow }: { readonly shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>Content rendered</div>
}

describe('ErrorBoundary', () => {
  // Suppress console.error from React's error boundary logging
  const originalError = console.error
  beforeAll(() => {
    console.error = vi.fn()
  })
  afterAll(() => {
    console.error = originalError
  })

  it('renders children when no error', () => {
    const { container } = render(
      <ErrorBoundary>
        <div>Hello</div>
      </ErrorBoundary>,
    )
    expect(container.textContent).toContain('Hello')
  })

  it('renders fallback UI when child throws', () => {
    const { container } = render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    )
    expect(container.textContent).toContain('Something went wrong')
    expect(container.textContent).toContain('Try Again')
  })

  it('renders custom fallback when provided', () => {
    const { container } = render(
      <ErrorBoundary fallback={<div>Custom error</div>}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    )
    expect(container.textContent).toContain('Custom error')
  })

  it('has alert role on fallback UI', () => {
    const { container } = render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    )
    const alert = container.querySelector('[role="alert"]')
    expect(alert).toBeTruthy()
  })

  it('resets error state when Try Again clicked', () => {
    let shouldThrow = true
    function ConditionalThrow() {
      if (shouldThrow) throw new Error('Test')
      return <div>Recovered</div>
    }

    const { container } = render(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>,
    )
    expect(container.textContent).toContain('Something went wrong')

    // Fix the component so it won't throw on re-render
    shouldThrow = false
    const button = container.querySelector('button')!
    fireEvent.click(button)
    expect(container.textContent).toContain('Recovered')
  })
})
