import BookmarkRepository from '#repositories/bookmark_repository'
import type Bookmark from '#models/bookmark'

const repository = new BookmarkRepository()

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
}

export default class BookmarkService {
  async list(options: ListBookmarksOptions) {
    return repository.findAllByUser(options)
  }

  async findById(id: number, userId: number) {
    return repository.findById(id, userId)
  }

  async create(userId: number, data: CreateBookmarkData) {
    return repository.create({
      userId,
      url: data.url,
      title: data.title ?? null,
    } as Partial<Bookmark>)
  }

  async update(id: number, userId: number, data: UpdateBookmarkData) {
    const bookmark = await repository.findById(id, userId)
    return repository.update(bookmark, data as Partial<Bookmark>)
  }

  async delete(id: number, userId: number) {
    const bookmark = await repository.findById(id, userId)
    await repository.delete(bookmark)
  }

  async toggleFavorite(id: number, userId: number) {
    const bookmark = await repository.findById(id, userId)
    return repository.update(bookmark, { isFavorite: !bookmark.isFavorite } as Partial<Bookmark>)
  }

  async toggleArchive(id: number, userId: number) {
    const bookmark = await repository.findById(id, userId)
    return repository.update(bookmark, { isArchived: !bookmark.isArchived } as Partial<Bookmark>)
  }
}
