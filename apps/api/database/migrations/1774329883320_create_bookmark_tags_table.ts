import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'bookmark_tags'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table
        .integer('bookmark_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('bookmarks')
        .onDelete('CASCADE')
      table
        .integer('tag_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('tags')
        .onDelete('CASCADE')
      table.timestamp('created_at').notNullable()

      table.primary(['bookmark_id', 'tag_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
