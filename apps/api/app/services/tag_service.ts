import TagRepository from '#repositories/tag_repository'
import BookmarkRepository from '#repositories/bookmark_repository'
import Tag from '#models/tag'

export default class TagService {
  constructor(
    private readonly tagRepo: TagRepository = new TagRepository(),
    private readonly bookmarkRepo: BookmarkRepository = new BookmarkRepository()
  ) {}

  async listByUser(userId: number) {
    return this.tagRepo.findAllByUser(userId)
  }

  async findById(id: number, userId: number) {
    return this.tagRepo.findById(id, userId)
  }

  async create(userId: number, name: string) {
    const slug = Tag.generateSlugFromName(name)
    await this.assertSlugAvailable(userId, slug)
    return this.tagRepo.create({ userId, name, slug } as Partial<Tag>)
  }

  async rename(id: number, userId: number, name: string) {
    const tag = await this.tagRepo.findById(id, userId)
    const slug = Tag.generateSlugFromName(name)
    await this.assertSlugAvailable(userId, slug, tag.id)
    return this.tagRepo.update(tag, { name, slug } as Partial<Tag>)
  }

  private async assertSlugAvailable(userId: number, slug: string, excludeId?: number) {
    const existing = await Tag.query()
      .where('userId', userId)
      .where('slug', slug)
      .if(excludeId, (q) => q.whereNot('id', excludeId!))
      .first()

    if (existing) {
      const error = new Error('Tag with this name already exists')
      ;(error as any).status = 409
      throw error
    }
  }

  async delete(id: number, userId: number) {
    const tag = await this.tagRepo.findById(id, userId)
    await this.tagRepo.delete(tag)
  }

  async addTagsToBookmark(bookmarkId: number, userId: number, tagNames: readonly string[]) {
    const bookmark = await this.bookmarkRepo.findById(bookmarkId, userId)
    const tags = await Promise.all(
      tagNames.map((name) => this.tagRepo.findOrCreateBySlug(userId, name))
    )
    const tagIds = tags.map((t) => t.id)
    await bookmark.related('tags').sync(tagIds, false)
    return tags
  }

  async removeTagFromBookmark(bookmarkId: number, userId: number, tagId: number) {
    const bookmark = await this.bookmarkRepo.findById(bookmarkId, userId)
    await this.tagRepo.findById(tagId, userId)
    await bookmark.related('tags').detach([tagId])
  }
}
