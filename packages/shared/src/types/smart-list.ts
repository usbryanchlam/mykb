export interface FilterQuery {
  readonly isFavorite?: boolean
  readonly isArchived?: boolean
  readonly tags?: readonly string[]
  readonly dateFrom?: string
  readonly dateTo?: string
}

export interface SmartList {
  readonly id: number
  readonly userId: number
  readonly name: string
  readonly description: string | null
  readonly icon: string | null
  readonly filterQuery: FilterQuery
  readonly createdAt: string
  readonly updatedAt: string
}
