import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UserMenu } from './user-menu'

const mockUseAuth = vi.fn()

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock('next/image', () => ({
  // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
  default: (props: Record<string, unknown>) => <img {...props} />,
}))

describe('UserMenu', () => {
  beforeEach(() => {
    mockUseAuth.mockReset()
  })

  it('shows loading skeleton when auth is loading', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: true })
    const { container } = render(<UserMenu />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows loading skeleton when user is null', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false })
    const { container } = render(<UserMenu />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('renders avatar from trusted URL', () => {
    mockUseAuth.mockReturnValue({
      user: {
        name: 'Test User',
        email: 'test@example.com',
        picture: 'https://lh3.googleusercontent.com/photo.jpg',
      },
      isLoading: false,
    })
    render(<UserMenu />)
    const img = screen.getByAltText('Test User')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://lh3.googleusercontent.com/photo.jpg')
  })

  it('shows initials fallback for untrusted avatar URL', () => {
    mockUseAuth.mockReturnValue({
      user: {
        name: 'Test User',
        email: 'test@example.com',
        picture: 'https://evil.com/avatar.jpg',
      },
      isLoading: false,
    })
    const { container } = render(<UserMenu />)
    expect(container.querySelector('img')).not.toBeInTheDocument()
    expect(container).toHaveTextContent('TE')
  })

  it('shows initials from name when no picture', () => {
    mockUseAuth.mockReturnValue({
      user: { name: 'Jane Doe', email: 'jane@example.com', picture: null },
      isLoading: false,
    })
    const { container } = render(<UserMenu />)
    expect(container).toHaveTextContent('JA')
  })

  it('renders user name', () => {
    mockUseAuth.mockReturnValue({
      user: { name: 'Test User', email: 'test@example.com', picture: null },
      isLoading: false,
    })
    const { container } = render(<UserMenu />)
    expect(container).toHaveTextContent('Test User')
  })

  it('renders sign out button with POST form', () => {
    mockUseAuth.mockReturnValue({
      user: { name: 'Test', email: 'test@example.com', picture: null },
      isLoading: false,
    })
    const { container } = render(<UserMenu />)
    const form = container.querySelector('form')
    expect(form).toHaveAttribute('action', '/auth/logout')
    expect(form).toHaveAttribute('method', 'POST')
    const button = form?.querySelector('button[aria-label="Sign out"]')
    expect(button).toBeInTheDocument()
  })
})
