'use server'

import { apiFetch } from '@/lib/api-client'
import type { ApiResponse } from '@mykb/shared'

export interface AppStats {
  readonly users: number
  readonly bookmarks: number
  readonly tags: number
  readonly collections: number
  readonly smartLists: number
  readonly jobs: {
    readonly total: number
    readonly completed: number
    readonly failed: number
    readonly processing: number
  }
  readonly scrapeStats: {
    readonly completed: number
    readonly failed: number
    readonly pending: number
  }
  readonly safetyStats: {
    readonly safe: number
    readonly flagged: number
    readonly failed: number
  }
}

export async function getAdminStats(): Promise<ApiResponse<AppStats>> {
  const res = await apiFetch('/api/admin/stats')
  if (!res.ok) {
    if (res.status === 401) throw new Error('Please sign in to continue.')
    if (res.status === 403) throw new Error('Admin access required.')
    throw new Error('Failed to load admin stats.')
  }
  return res.json() as Promise<ApiResponse<AppStats>>
}
