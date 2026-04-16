'use client'

import { useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SearchBarProps {
  readonly value?: string
  readonly onChange?: (value: string) => void
  readonly placeholder?: string
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search knowledge...',
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (onChange) {
      onChange(e.target.value)
    }
    // In uncontrolled mode (header), navigate only on Enter to avoid history spam
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !onChange) {
      const input = e.target as HTMLInputElement
      const q = input.value.trim()
      if (q) {
        router.push(`/dashboard/search?q=${encodeURIComponent(q)}`)
        input.value = ''
        input.blur()
      }
    }
  }

  return (
    <div className="relative w-full max-w-xl">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring md:pr-12"
        aria-label="Search knowledge"
      />
      <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground md:inline-block">
        ⌘K
      </kbd>
    </div>
  )
}
