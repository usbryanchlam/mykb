import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tags'

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
      table.string('name').notNullable()
      table.string('slug').notNullable()
      table.boolean('is_ai_generated').notNullable().defaultTo(false)
      table.timestamp('created_at').notNullable()

      table.unique(['user_id', 'slug'], { indexName: 'idx_tags_user_slug' })
      table.index(['user_id'], 'idx_tags_user_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
