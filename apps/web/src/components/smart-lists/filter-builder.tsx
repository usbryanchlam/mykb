'use client'

import { useState } from 'react'
import type { FilterQuery } from '@mykb/shared'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FilterBuilderProps {
  readonly value: FilterQuery
  readonly onChange: (value: FilterQuery) => void
}

export function FilterBuilder({ value, onChange }: FilterBuilderProps) {
  const [tagInput, setTagInput] = useState((value.tags ?? []).join(', '))

  function handleFavoriteChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value
    const updated = { ...value }
    if (v === 'true') {
      onChange({ ...updated, isFavorite: true })
    } else if (v === 'false') {
      onChange({ ...updated, isFavorite: false })
    } else {
      const { isFavorite: _, ...rest } = updated
      onChange(rest)
    }
  }

  function handleArchivedChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value
    const updated = { ...value }
    if (v === 'true') {
      onChange({ ...updated, isArchived: true })
    } else if (v === 'false') {
      onChange({ ...updated, isArchived: false })
    } else {
      const { isArchived: _, ...rest } = updated
      onChange(rest)
    }
  }

  function handleTagsChange(input: string) {
    setTagInput(input)
    const tags = input
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0)
    if (tags.length > 0) {
      onChange({ ...value, tags })
    } else {
      const { tags: _, ...rest } = value
      onChange(rest)
    }
  }

  function handleDateChange(field: 'dateFrom' | 'dateTo', dateValue: string) {
    if (dateValue) {
      onChange({ ...value, [field]: dateValue })
    } else {
      const { [field]: _, ...rest } = value
      onChange(rest)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-favorite">Favorite</Label>
          <select
            id="filter-favorite"
            value={value.isFavorite === undefined ? '' : String(value.isFavorite)}
            onChange={handleFavoriteChange}
            className="h-9 rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="">Any</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-archived">Archived</Label>
          <select
            id="filter-archived"
            value={value.isArchived === undefined ? '' : String(value.isArchived)}
            onChange={handleArchivedChange}
            className="h-9 rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="">Any</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-tags">Tags (comma-separated)</Label>
        <Input
          id="filter-tags"
          type="text"
          placeholder="e.g. javascript, react"
          value={tagInput}
          onChange={(e) => handleTagsChange(e.target.value)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-date-from">Created after</Label>
          <Input
            id="filter-date-from"
            type="date"
            value={value.dateFrom ?? ''}
            onChange={(e) => handleDateChange('dateFrom', e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-date-to">Created before</Label>
          <Input
            id="filter-date-to"
            type="date"
            value={value.dateTo ?? ''}
            onChange={(e) => handleDateChange('dateTo', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
