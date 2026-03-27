import BookmarkRepository from '#repositories/bookmark_repository'
import type Bookmark from '#models/bookmark'

interface CreateBookmarkData {
  readonly url: string
  readonly title?: string
}

interface UpdateBookmarkData {
  readonly title?: string
  readonly description?: string
}

interface ListBookmarksOptions {
  readonly userId: number
  readonly page?: number
  readonly limit?: number
  readonly sort?: string
  readonly order?: 'asc' | 'desc'
  readonly isFavorite?: boolean
  readonly isArchived?: boolean
  readonly tag?: string
}

export default class BookmarkService {
  constructor(private readonly repository: BookmarkRepository = new BookmarkRepository()) {}

  async list(options: ListBookmarksOptions) {
    return this.repository.findAllByUser(options)
  }

  async findById(id: number, userId: number) {
    return this.repository.findById(id, userId)
  }

  async create(userId: number, data: CreateBookmarkData) {
    try {
      return await this.repository.create({
        userId,
        url: data.url,
        title: data.title,
      } as Partial<Bookmark>)
    } catch (error: unknown) {
      const err = error as { code?: string }
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.code === 'SQLITE_CONSTRAINT') {
        const conflictError = new Error('Bookmark with this URL already exists')
        ;(conflictError as any).status = 409
        throw conflictError
      }
      throw error
    }
  }

  async update(id: number, userId: number, data: UpdateBookmarkData) {
    const bookmark = await this.repository.findById(id, userId)
    return this.repository.update(bookmark, data as Partial<Bookmark>)
  }

  async delete(id: number, userId: number) {
    const bookmark = await this.repository.findById(id, userId)
    await this.repository.delete(bookmark)
  }

  async toggleFavorite(id: number, userId: number) {
    const bookmark = await this.repository.findById(id, userId)
    return this.repository.update(bookmark, {
      isFavorite: !bookmark.isFavorite,
    } as Partial<Bookmark>)
  }

  async toggleArchive(id: number, userId: number) {
    const bookmark = await this.repository.findById(id, userId)
    return this.repository.update(bookmark, {
      isArchived: !bookmark.isArchived,
    } as Partial<Bookmark>)
  }

  async resetForRescrape(id: number, userId: number) {
    const bookmark = await this.repository.findById(id, userId)

    if (bookmark.scrapeStatus === 'processing') {
      const error = new Error('Bookmark is currently being processed')
      ;(error as any).status = 409
      throw error
    }

    return this.repository.update(bookmark, {
      scrapeStatus: 'pending',
      scrapeError: null,
      safetyStatus: 'pending',
      safetyReasons: null,
    } as Partial<Bookmark>)
  }
}
