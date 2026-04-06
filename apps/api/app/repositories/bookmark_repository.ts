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
  readonly tag?: string
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
      tag,
    } = options

    const clampedLimit = Math.min(limit, PAGINATION.MAX_LIMIT)
    const allowedSorts = ['created_at', 'updated_at', 'title']
    const safeSort = allowedSorts.includes(sort) ? sort : 'created_at'

    const query = Bookmark.query().where('userId', userId).preload('tags').orderBy(safeSort, order)

    if (isFavorite !== undefined) {
      query.where('isFavorite', isFavorite)
    }
    if (isArchived !== undefined) {
      query.where('isArchived', isArchived)
    }
    if (tag) {
      query.whereHas('tags', (tagQuery) => {
        tagQuery.where('slug', tag)
      })
    }

    return query.paginate(page, clampedLimit)
  }

  async findById(id: number, userId: number) {
    return Bookmark.query().where('id', id).where('userId', userId).preload('tags').firstOrFail()
  }

  async create(data: Partial<Bookmark>) {
    return Bookmark.create(data)
  }

  async update(bookmark: Bookmark, data: Partial<Bookmark>) {
    await bookmark.merge(data).save()
    return Bookmark.query().where('id', bookmark.id).preload('tags').firstOrFail()
  }

  async delete(bookmark: Bookmark) {
    await bookmark.delete()
  }
}
