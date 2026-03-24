import Tag from '#models/tag'

export default class TagRepository {
  async findAllByUser(userId: number) {
    return Tag.query().where('userId', userId).withCount('bookmarks').orderBy('name', 'asc')
  }

  async findById(id: number, userId: number) {
    return Tag.query().where('id', id).where('userId', userId).firstOrFail()
  }

  async findOrCreateBySlug(
    userId: number,
    name: string,
    isAiGenerated: boolean = false
  ): Promise<Tag> {
    const slug = Tag.generateSlugFromName(name)
    const existing = await Tag.query().where('userId', userId).where('slug', slug).first()

    if (existing) return existing

    return Tag.create({ userId, name, slug, isAiGenerated })
  }

  async create(data: Partial<Tag>): Promise<Tag> {
    return Tag.create(data)
  }

  async update(tag: Tag, data: Partial<Tag>): Promise<Tag> {
    tag.merge(data)
    await tag.save()
    return Tag.findOrFail(tag.id)
  }

  async delete(tag: Tag): Promise<void> {
    await tag.delete()
  }
}
