import Bookmark from '#models/bookmark'
import { PAGINATION } from '@mykb/shared'

interface ListOptions {
  readonly userId: number
  readonly page?: number
  readonly limit?: number
  readonly sort?: string
  readonly order?: 'asc' | 'desc'
  readonly isFavorite?: boolean
  readonly isArchived?: boolean
}

export default class BookmarkRepository {
  async findAllByUser(options: ListOptions) {
    const {
      userId,
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      sort = 'created_at',
      order = 'desc',
      isFavorite,
      isArchived,
    } = options

    const clampedLimit = Math.min(limit, PAGINATION.MAX_LIMIT)
    const allowedSorts = ['created_at', 'updated_at', 'title']
    const safeSort = allowedSorts.includes(sort) ? sort : 'created_at'

    const query = Bookmark.query().where('userId', userId).orderBy(safeSort, order)

    if (isFavorite !== undefined) {
      query.where('isFavorite', isFavorite)
    }
    if (isArchived !== undefined) {
      query.where('isArchived', isArchived)
    }

    return query.paginate(page, clampedLimit)
  }

  async findById(id: number, userId: number) {
    return Bookmark.query().where('id', id).where('userId', userId).firstOrFail()
  }

  async create(data: Partial<Bookmark>) {
    return Bookmark.create(data)
  }

  async update(bookmark: Bookmark, data: Partial<Bookmark>) {
    await bookmark.merge(data).save()
    return Bookmark.findOrFail(bookmark.id)
  }

  async delete(bookmark: Bookmark) {
    await bookmark.delete()
  }
}
