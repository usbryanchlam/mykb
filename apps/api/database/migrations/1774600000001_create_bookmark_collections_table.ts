import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'bookmark_collections'

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
        .integer('collection_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('collections')
        .onDelete('CASCADE')
      table.integer('sort_order').notNullable().defaultTo(0)
      table.timestamp('created_at').notNullable()

      table.primary(['bookmark_id', 'collection_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
