import { describe, expect, it, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { SearchBar } from './search-bar'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

describe('SearchBar', () => {
  it('renders input with search label', () => {
    const { container } = render(<SearchBar />)
    const input = container.querySelector('input[aria-label="Search knowledge"]')
    expect(input).toBeTruthy()
  })

  it('renders keyboard shortcut hint', () => {
    const { container } = render(<SearchBar />)
    const kbd = container.querySelector('kbd')
    expect(kbd?.textContent).toContain('K')
  })

  it('calls onChange when typing in controlled mode', () => {
    const onChange = vi.fn()
    const { container } = render(<SearchBar value="test" onChange={onChange} />)
    const input = container.querySelector('input')!
    fireEvent.change(input, { target: { value: 'hello' } })
    expect(onChange).toHaveBeenCalledWith('hello')
  })

  it('navigates to search page on Enter in uncontrolled mode', () => {
    mockPush.mockClear()
    const { container } = render(<SearchBar />)
    const input = container.querySelector('input')!
    fireEvent.change(input, { target: { value: 'test query' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(mockPush).toHaveBeenCalledWith('/dashboard/search?q=test%20query')
  })

  it('focuses input on Cmd+K', () => {
    const { container } = render(<SearchBar />)
    const input = container.querySelector('input')!
    fireEvent.keyDown(document, { key: 'k', metaKey: true })
    expect(document.activeElement).toBe(input)
  })

  it('focuses input on Ctrl+K', () => {
    const { container } = render(<SearchBar />)
    const input = container.querySelector('input')!
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    expect(document.activeElement).toBe(input)
  })

  it('displays custom placeholder', () => {
    const { container } = render(<SearchBar placeholder="Find stuff..." />)
    const input = container.querySelector('input')!
    expect(input.placeholder).toBe('Find stuff...')
  })
})
