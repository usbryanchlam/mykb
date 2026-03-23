import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'job_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('job_type').notNullable()
      table
        .integer('bookmark_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('bookmarks')
        .onDelete('CASCADE')
      table.string('status').notNullable().defaultTo('pending')
      table.text('error_message').nullable()
      table.integer('attempt').notNullable().defaultTo(1)
      table.timestamp('started_at').notNullable()
      table.timestamp('completed_at').nullable()
      table.timestamp('created_at').notNullable()

      table.index(['bookmark_id'], 'idx_job_logs_bookmark_id')
      table.index(['job_type', 'status'], 'idx_job_logs_type_status')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
