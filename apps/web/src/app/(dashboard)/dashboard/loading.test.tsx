import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import DashboardLoading from './loading'

describe('DashboardLoading', () => {
  it('renders skeleton placeholders', () => {
    const { container } = render(<DashboardLoading />)
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(6)
  })

  it('renders a 3-column grid', () => {
    const { container } = render(<DashboardLoading />)
    const grid = container.querySelector('.grid')
    expect(grid?.className).toContain('lg:grid-cols-3')
  })
})
