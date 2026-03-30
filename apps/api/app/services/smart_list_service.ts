import SmartList from '#models/smart_list'
import type { FilterQuery } from '#models/smart_list'
import Bookmark from '#models/bookmark'
import { PAGINATION } from '@mykb/shared'

interface ResolveOptions {
  readonly page?: number
  readonly limit?: number
}

export default class SmartListService {
  async listByUser(userId: number) {
    return SmartList.query().where('userId', userId).orderBy('name', 'asc')
  }

  async findById(id: number, userId: number) {
    return SmartList.query().where('id', id).where('userId', userId).firstOrFail()
  }

  async create(
    userId: number,
    data: { name: string; description?: string; icon?: string; filterQuery: FilterQuery }
  ) {
    return SmartList.create({
      userId,
      name: data.name,
      description: data.description ?? null,
      icon: data.icon ?? null,
      filterQuery: data.filterQuery,
    })
  }

  async update(
    id: number,
    userId: number,
    data: {
      name?: string
      description?: string | null
      icon?: string | null
      filterQuery?: FilterQuery
    }
  ) {
    const smartList = await this.findById(id, userId)
    smartList.merge(data)
    await smartList.save()
    return SmartList.findOrFail(smartList.id)
  }

  async delete(id: number, userId: number) {
    const smartList = await this.findById(id, userId)
    await smartList.delete()
  }

  async resolveBookmarks(id: number, userId: number, options: ResolveOptions = {}) {
    const smartList = await this.findById(id, userId)
    return this.executeFilter(userId, smartList.filterQuery, options)
  }

  private async executeFilter(userId: number, filter: FilterQuery, options: ResolveOptions) {
    const { page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT } = options
    const clampedLimit = Math.min(limit, PAGINATION.MAX_LIMIT)

    const query = Bookmark.query().where('userId', userId).preload('tags')

    if (filter.isFavorite !== undefined) {
      query.where('isFavorite', filter.isFavorite)
    }
    if (filter.isArchived !== undefined) {
      query.where('isArchived', filter.isArchived)
    }
    if (filter.tags && filter.tags.length > 0) {
      for (const tag of filter.tags) {
        query.whereHas('tags', (tagQuery) => {
          tagQuery.where('slug', tag)
        })
      }
    }
    if (filter.dateFrom) {
      query.where('createdAt', '>=', filter.dateFrom)
    }
    if (filter.dateTo) {
      // Append end-of-day time if only a date string (no T) is provided,
      // so "2026-03-28" includes the entire day, not just midnight.
      const endDate = filter.dateTo.includes('T') ? filter.dateTo : `${filter.dateTo}T23:59:59`
      query.where('createdAt', '<=', endDate)
    }

    query.orderBy('created_at', 'desc')

    return query.paginate(page, clampedLimit)
  }
}
