import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'bookmarks'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('url').notNullable()
      table.string('title').nullable()
      table.text('description').nullable()
      table.text('summary').nullable()
      table.text('content').nullable()
      table.text('plain_text').nullable()
      table.string('favicon_url').nullable()
      table.string('og_image_url').nullable()
      table.string('thumbnail_key').nullable()
      table.string('screenshot_key').nullable()
      table.integer('is_favorite').notNullable().defaultTo(0)
      table.integer('is_archived').notNullable().defaultTo(0)
      table.string('scrape_status').notNullable().defaultTo('pending')
      table.string('ai_status').notNullable().defaultTo('pending')
      table.string('safety_status').notNullable().defaultTo('pending')
      table.text('safety_reasons').nullable()
      table.text('scrape_error').nullable()
      table.text('ai_error').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['user_id', 'url'])
      table.index(['user_id'], 'idx_bookmarks_user_id')
      table.index(['created_at'], 'idx_bookmarks_created_at')
      table.index(['user_id', 'is_favorite'], 'idx_bookmarks_favorite')
      table.index(['user_id', 'is_archived'], 'idx_bookmarks_archived')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
