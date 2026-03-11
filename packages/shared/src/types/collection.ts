export interface Collection {
  readonly id: number
  readonly userId: number
  readonly name: string
  readonly description: string | null
  readonly icon: string | null
  readonly sortOrder: number
  readonly createdAt: string
  readonly updatedAt: string
}
