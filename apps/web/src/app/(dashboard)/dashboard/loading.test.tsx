import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import DashboardLoading from './loading'

describe('DashboardLoading', () => {
  it('renders skeleton placeholders', () => {
    const { container } = render(<DashboardLoading />)
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBe(7) // 1 title + 6 cards
  })

  it('renders a 3-column grid', () => {
    const { container } = render(<DashboardLoading />)
    const grid = container.querySelector('.grid')
    expect(grid?.className).toContain('lg:grid-cols-3')
  })
})
