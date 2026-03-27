import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'
import type { BookmarkTag } from '@mykb/shared'
import type { ReactNode } from 'react'
import { TagManager } from './tag-manager'

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: ReactNode
    className?: string
    onClick?: (e: React.MouseEvent) => void
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

const mockAddTagsToBookmark = vi.fn()
const mockRemoveTagFromBookmark = vi.fn()
const mockListTags = vi.fn()

vi.mock('@/actions/tags', () => ({
  addTagsToBookmark: (...args: unknown[]) => mockAddTagsToBookmark(...args),
  removeTagFromBookmark: (...args: unknown[]) => mockRemoveTagFromBookmark(...args),
  listTags: (...args: unknown[]) => mockListTags(...args),
}))

function createTag(overrides: Partial<BookmarkTag> = {}): BookmarkTag {
  return {
    id: 1,
    name: 'javascript',
    slug: 'javascript',
    isAiGenerated: false,
    ...overrides,
  }
}

describe('TagManager', () => {
  const defaultProps = {
    bookmarkId: 42,
    tags: [
      createTag({ id: 1, name: 'javascript', slug: 'javascript' }),
      createTag({ id: 2, name: 'react', slug: 'react', isAiGenerated: true }),
    ] as readonly BookmarkTag[],
    canEdit: true,
    onTagsChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockListTags.mockResolvedValue({ data: [] })
  })

  it('renders existing tags', () => {
    const { container } = render(<TagManager {...defaultProps} />)
    const links = container.querySelectorAll('a')
    const tagNames = Array.from(links).map((l) => l.textContent)
    expect(tagNames).toContain('javascript')
    expect(tagNames).toContain('react')
  })

  it('shows "No tags" when empty', () => {
    const { container } = render(<TagManager {...defaultProps} tags={[]} />)
    expect(container.textContent).toContain('No tags')
  })

  it('shows Add tag button when canEdit is true', () => {
    const { container } = render(<TagManager {...defaultProps} />)
    const buttons = Array.from(container.querySelectorAll('button'))
    const addBtn = buttons.find((b) => b.textContent?.includes('Add tag'))
    expect(addBtn).toBeTruthy()
  })

  it('hides Add tag button when canEdit is false', () => {
    const { container } = render(<TagManager {...defaultProps} canEdit={false} />)
    // No add button, no remove buttons
    const buttons = container.querySelectorAll('button')
    expect(buttons.length).toBe(0)
  })

  it('hides remove buttons when canEdit is false', () => {
    const { container } = render(<TagManager {...defaultProps} canEdit={false} />)
    const removeButtons = container.querySelectorAll('button[aria-label]')
    expect(removeButtons.length).toBe(0)
  })

  it('shows remove buttons for each tag when canEdit is true', () => {
    const { container } = render(<TagManager {...defaultProps} />)
    const removeButtons = container.querySelectorAll('button[aria-label^="Remove tag"]')
    expect(removeButtons.length).toBe(2)
  })

  it('opens input when Add tag clicked', async () => {
    const { container } = render(<TagManager {...defaultProps} />)
    const addBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Add tag'),
    )!
    fireEvent.click(addBtn)
    await waitFor(() => {
      const input = container.querySelector('input')
      expect(input).toBeTruthy()
    })
  })

  it('calls removeTagFromBookmark when remove button clicked', async () => {
    mockRemoveTagFromBookmark.mockResolvedValue({ success: true, data: null, error: null })
    const onTagsChange = vi.fn()
    const { container } = render(<TagManager {...defaultProps} onTagsChange={onTagsChange} />)
    const removeBtn = container.querySelector('button[aria-label="Remove tag javascript"]')!
    fireEvent.click(removeBtn)

    await waitFor(() => {
      expect(mockRemoveTagFromBookmark).toHaveBeenCalledWith(42, 1)
    })
  })

  it('shows error message when remove fails', async () => {
    mockRemoveTagFromBookmark.mockRejectedValue(new Error('Network error'))
    const { container } = render(<TagManager {...defaultProps} />)
    const removeBtn = container.querySelector('button[aria-label="Remove tag javascript"]')!
    fireEvent.click(removeBtn)

    await waitFor(() => {
      expect(container.textContent).toContain('Network error')
    })
  })

  it('calls addTagsToBookmark when Enter pressed in input', async () => {
    mockAddTagsToBookmark.mockResolvedValue({
      success: true,
      data: [createTag({ id: 3, name: 'typescript', slug: 'typescript' })],
      error: null,
    })
    const onTagsChange = vi.fn()
    const { container } = render(<TagManager {...defaultProps} onTagsChange={onTagsChange} />)

    // Open input
    const addBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Add tag'),
    )!
    fireEvent.click(addBtn)

    await waitFor(() => {
      const input = container.querySelector('input')!
      fireEvent.change(input, { target: { value: 'typescript' } })
      fireEvent.keyDown(input, { key: 'Enter' })
    })

    await waitFor(() => {
      expect(mockAddTagsToBookmark).toHaveBeenCalledWith(42, ['typescript'])
    })
  })

  it('closes input on Escape', async () => {
    const { container } = render(<TagManager {...defaultProps} />)

    const addBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Add tag'),
    )!
    fireEvent.click(addBtn)

    await waitFor(() => {
      const input = container.querySelector('input')!
      fireEvent.keyDown(input, { key: 'Escape' })
    })

    await waitFor(() => {
      const input = container.querySelector('input')
      expect(input).toBeNull()
    })
  })
})
