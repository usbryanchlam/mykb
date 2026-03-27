import { describe, expect, it, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import type { FilterQuery } from '@mykb/shared'
import { FilterBuilder } from './filter-builder'

describe('FilterBuilder', () => {
  it('renders all filter fields', () => {
    const { container } = render(<FilterBuilder value={{}} onChange={vi.fn()} />)
    expect(container.querySelector('#filter-favorite')).toBeTruthy()
    expect(container.querySelector('#filter-archived')).toBeTruthy()
    expect(container.querySelector('#filter-tags')).toBeTruthy()
    expect(container.querySelector('#filter-date-from')).toBeTruthy()
    expect(container.querySelector('#filter-date-to')).toBeTruthy()
  })

  it('calls onChange with isFavorite when favorite selected', () => {
    const onChange = vi.fn()
    const { container } = render(<FilterBuilder value={{}} onChange={onChange} />)
    const select = container.querySelector('#filter-favorite') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'true' } })
    expect(onChange).toHaveBeenCalledWith({ isFavorite: true })
  })

  it('removes isFavorite when Any selected', () => {
    const onChange = vi.fn()
    const { container } = render(<FilterBuilder value={{ isFavorite: true }} onChange={onChange} />)
    const select = container.querySelector('#filter-favorite') as HTMLSelectElement
    fireEvent.change(select, { target: { value: '' } })
    expect(onChange).toHaveBeenCalledWith({})
  })

  it('calls onChange with isArchived', () => {
    const onChange = vi.fn()
    const { container } = render(<FilterBuilder value={{}} onChange={onChange} />)
    const select = container.querySelector('#filter-archived') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'false' } })
    expect(onChange).toHaveBeenCalledWith({ isArchived: false })
  })

  it('parses comma-separated tags', () => {
    const onChange = vi.fn()
    const { container } = render(<FilterBuilder value={{}} onChange={onChange} />)
    const input = container.querySelector('#filter-tags') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'javascript, react' } })
    expect(onChange).toHaveBeenCalledWith({ tags: ['javascript', 'react'] })
  })

  it('removes tags when input cleared', () => {
    const onChange = vi.fn()
    const { container } = render(<FilterBuilder value={{ tags: ['old'] }} onChange={onChange} />)
    const input = container.querySelector('#filter-tags') as HTMLInputElement
    fireEvent.change(input, { target: { value: '' } })
    expect(onChange).toHaveBeenCalledWith({})
  })

  it('sets dateFrom when date entered', () => {
    const onChange = vi.fn()
    const { container } = render(<FilterBuilder value={{}} onChange={onChange} />)
    const input = container.querySelector('#filter-date-from') as HTMLInputElement
    fireEvent.change(input, { target: { value: '2026-01-01' } })
    expect(onChange).toHaveBeenCalledWith({ dateFrom: '2026-01-01' })
  })

  it('sets dateTo when date entered', () => {
    const onChange = vi.fn()
    const { container } = render(<FilterBuilder value={{}} onChange={onChange} />)
    const input = container.querySelector('#filter-date-to') as HTMLInputElement
    fireEvent.change(input, { target: { value: '2026-12-31' } })
    expect(onChange).toHaveBeenCalledWith({ dateTo: '2026-12-31' })
  })
})
