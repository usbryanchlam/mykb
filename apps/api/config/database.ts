import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/lucid'

const dbConfig = defineConfig({
  connection: 'sqlite',

  connections: {
    sqlite: {
      client: 'better-sqlite3',

      connection: {
        filename: app.tmpPath('db.sqlite3'),
      },

      useNullAsDefault: true,

      pool: {
        afterCreate(conn: { pragma: (sql: string) => void }, done: (err: Error | null) => void) {
          conn.pragma('journal_mode = WAL')
          conn.pragma('busy_timeout = 5000')
          conn.pragma('synchronous = NORMAL')
          conn.pragma('foreign_keys = ON')
          conn.pragma('cache_size = -20000')
          done(null)
        },
      },

      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
  },
})

export default dbConfig
