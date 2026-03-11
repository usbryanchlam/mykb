export interface ApiResponse<T> {
  readonly success: true
  readonly data: T
  readonly error: null
}

export interface ApiErrorResponse {
  readonly success: false
  readonly data: null
  readonly error: string
}

export interface PaginationMeta {
  readonly total: number
  readonly page: number
  readonly limit: number
}

export interface PaginatedResponse<T> {
  readonly success: true
  readonly data: readonly T[]
  readonly error: null
  readonly meta: PaginationMeta
}
