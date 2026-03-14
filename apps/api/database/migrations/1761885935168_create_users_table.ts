import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('auth0_sub').notNullable().unique()
      table.string('email', 254).notNullable().unique()
      table.string('name').notNullable()
      table.string('avatar_url').nullable()
      table.string('role').notNullable().defaultTo('viewer')
      table.timestamp('last_login_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
