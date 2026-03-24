'use client'

import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  readonly status: string
  readonly label?: string
}

const statusStyles: Record<string, string> = {
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  safe: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  flagged: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  skipped: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400',
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const style = statusStyles[status] ?? statusStyles.pending

  return (
    <span
      className={cn('inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium', style)}
      title={label ? `${label}: ${status}` : status}
    >
      {status}
    </span>
  )
}
