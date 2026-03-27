import Collection from '#models/collection'

export default class CollectionRepository {
  async findAllByUser(userId: number) {
    return Collection.query()
      .where('userId', userId)
      .withCount('bookmarks')
      .orderBy('sort_order', 'asc')
      .orderBy('name', 'asc')
  }

  async findById(id: number, userId: number) {
    return Collection.query()
      .where('id', id)
      .where('userId', userId)
      .withCount('bookmarks')
      .firstOrFail()
  }

  async create(data: {
    userId: number
    name: string
    description?: string | null
    icon?: string | null
  }): Promise<Collection> {
    return Collection.create({
      userId: data.userId,
      name: data.name,
      description: data.description ?? null,
      icon: data.icon ?? null,
    })
  }

  async update(
    collection: Collection,
    data: { name?: string; description?: string | null; icon?: string | null; sortOrder?: number }
  ): Promise<Collection> {
    collection.merge(data)
    await collection.save()
    return Collection.query().where('id', collection.id).withCount('bookmarks').firstOrFail()
  }

  async delete(collection: Collection): Promise<void> {
    await collection.delete()
  }
}
