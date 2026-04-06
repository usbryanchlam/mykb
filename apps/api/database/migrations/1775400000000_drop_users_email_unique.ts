import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  // Disable transaction wrapping — SQLite can't DROP TABLE inside a transaction,
  // and PRAGMA foreign_keys can't be set inside a transaction either.
  disableTransactions = true

  protected tableName = 'users'

  async up() {
    // SQLite inline UNIQUE constraints are stored as sqlite_autoindex_* and cannot
    // be dropped with DROP INDEX. Must rebuild the table without the constraint.
    // Also make email nullable to represent "no email provided" instead of empty string.
    this.schema.raw('PRAGMA foreign_keys = OFF')
    this.schema.raw(`
      CREATE TABLE users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        auth0_sub VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(254),
        name VARCHAR(255) NOT NULL DEFAULT '',
        avatar_url VARCHAR(2048),
        role VARCHAR(50) NOT NULL DEFAULT 'viewer',
        last_login_at DATETIME,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      )
    `)
    this.schema.raw('INSERT INTO users_new SELECT * FROM users')
    this.schema.raw('DROP TABLE users')
    this.schema.raw('ALTER TABLE users_new RENAME TO users')
    this.schema.raw('PRAGMA foreign_keys = ON')
  }

  async down() {
    // WARNING: This rollback will fail if multiple users share the same email.
    this.schema.alterTable(this.tableName, (table) => {
      table.unique(['email'])
    })
  }
}
