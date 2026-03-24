export type ScrapeStatus = 'pending' | 'processing' | 'completed' | 'failed'

export type AiStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped'

export type SafetyStatus = 'pending' | 'safe' | 'flagged' | 'skipped' | 'failed'

export interface Bookmark {
  readonly id: number
  readonly userId: number
  readonly url: string
  readonly title: string | null
  readonly description: string | null
  readonly summary: string | null
  readonly content: string | null
  readonly plainText: string | null
  readonly faviconUrl: string | null
  readonly ogImageUrl: string | null
  readonly thumbnailKey: string | null
  readonly screenshotKey: string | null
  readonly isFavorite: boolean
  readonly isArchived: boolean
  readonly scrapeStatus: ScrapeStatus
  readonly aiStatus: AiStatus
  readonly safetyStatus: SafetyStatus
  readonly safetyReasons: readonly string[] | null
  readonly scrapeError: string | null
  readonly aiError: string | null
  readonly createdAt: string
  readonly updatedAt: string
}
