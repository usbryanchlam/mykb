import CollectionRepository from '#repositories/collection_repository'
import Bookmark from '#models/bookmark'

export default class CollectionService {
  constructor(private readonly repository: CollectionRepository = new CollectionRepository()) {}

  async listByUser(userId: number) {
    return this.repository.findAllByUser(userId)
  }

  async findById(id: number, userId: number) {
    return this.repository.findById(id, userId)
  }

  async create(userId: number, data: { name: string; description?: string; icon?: string }) {
    return this.repository.create({ userId, ...data })
  }

  async update(
    id: number,
    userId: number,
    data: { name?: string; description?: string | null; icon?: string | null; sortOrder?: number }
  ) {
    const collection = await this.repository.findById(id, userId)
    return this.repository.update(collection, data)
  }

  async delete(id: number, userId: number) {
    const collection = await this.repository.findById(id, userId)
    await this.repository.delete(collection)
  }

  async addBookmark(collectionId: number, userId: number, bookmarkId: number) {
    const collection = await this.repository.findById(collectionId, userId)
    // Verify bookmark belongs to user
    await Bookmark.query().where('id', bookmarkId).where('userId', userId).firstOrFail()
    // Idempotent: sync with false = don't detach existing, avoids duplicate constraint errors
    await collection.related('bookmarks').sync([bookmarkId], false)
    return this.repository.findById(collectionId, userId)
  }

  async removeBookmark(collectionId: number, userId: number, bookmarkId: number) {
    const collection = await this.repository.findById(collectionId, userId)
    // Verify bookmark belongs to user
    await Bookmark.query().where('id', bookmarkId).where('userId', userId).firstOrFail()
    await collection.related('bookmarks').detach([bookmarkId])
  }

  async listBookmarks(collectionId: number, userId: number) {
    const collection = await this.repository.findById(collectionId, userId)
    await collection.load('bookmarks', (query) => {
      query.preload('tags').orderBy('bookmark_collections.sort_order', 'asc')
    })
    return collection.bookmarks
  }
}
