'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  Archive,
  Bookmark,
  FolderOpen,
  Heart,
  Loader2,
  Shield,
  Sparkles,
  Tags,
  Users,
} from 'lucide-react'
import { getAdminStats, type AppStats } from '@/actions/admin'

export default function AdminPage() {
  const [stats, setStats] = useState<AppStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      try {
        const res = await getAdminStats()
        setStats(res.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats.')
      } finally {
        setIsLoading(false)
      }
    })
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading admin dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <Shield className="size-12 text-destructive" />
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">Admin Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Users} label="Users" value={stats.users} />
        <StatCard icon={Bookmark} label="Bookmarks" value={stats.bookmarks} />
        <StatCard icon={Heart} label="Favorites" value={stats.favoriteBookmarks} />
        <StatCard icon={Archive} label="Archived" value={stats.archivedBookmarks} />
        <StatCard icon={Tags} label="Tags" value={stats.tags} />
        <StatCard icon={FolderOpen} label="Collections" value={stats.collections} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-medium">Scrape Status</h2>
          <div className="flex flex-col gap-2">
            <StatRow label="Completed" value={stats.scrapeStats.completed} color="text-green-600" />
            <StatRow label="Failed" value={stats.scrapeStats.failed} color="text-red-600" />
            <StatRow label="Pending" value={stats.scrapeStats.pending} color="text-yellow-600" />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-medium">Safety Status</h2>
          <div className="flex flex-col gap-2">
            <StatRow label="Safe" value={stats.safetyStats.safe} color="text-green-600" />
            <StatRow label="Flagged" value={stats.safetyStats.flagged} color="text-red-600" />
            <StatRow label="Failed" value={stats.safetyStats.failed} color="text-yellow-600" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-medium">Job Queue</h2>
          <div className="flex flex-col gap-2">
            <StatRow label="Total" value={stats.jobs.total} />
            <StatRow label="Completed" value={stats.jobs.completed} color="text-green-600" />
            <StatRow label="Failed" value={stats.jobs.failed} color="text-red-600" />
            <StatRow label="Processing" value={stats.jobs.processing} color="text-yellow-600" />
          </div>
        </div>

        <StatCard icon={Sparkles} label="Smart Lists" value={stats.smartLists} />
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  readonly icon: typeof Users
  readonly label: string
  readonly value: number
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
      <Icon className="size-8 text-muted-foreground" />
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

function StatRow({
  label,
  value,
  color,
}: {
  readonly label: string
  readonly value: number
  readonly color?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${color ?? ''}`}>{value}</span>
    </div>
  )
}
