import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    // SQLite doesn't support DROP INDEX directly on a column constraint,
    // so we recreate the table without the unique constraint on email.
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['email'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.unique(['email'])
    })
  }
}
