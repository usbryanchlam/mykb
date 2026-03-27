import { mkdir } from 'node:fs/promises'
import { assert } from '@japa/assert'
import { apiClient } from '@japa/api-client'
import app from '@adonisjs/core/services/app'
import type { Config } from '@japa/runner/types'
import { pluginAdonisJS } from '@japa/plugin-adonisjs'
import testUtils from '@adonisjs/core/services/test_utils'
import { startJwksServer, stopJwksServer } from '#tests/helpers/auth'

/**
 * Configure Japa plugins in the plugins array.
 * Learn more - https://japa.dev/docs/runner-config#plugins-optional
 */
export const plugins: Config['plugins'] = [assert(), pluginAdonisJS(app), apiClient()]

/**
 * Configure lifecycle function to run before and after all the
 * tests.
 */
export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
  setup: [
    async () => {
      await startJwksServer()
    },
    async () => {
      await mkdir(app.tmpPath(), { recursive: true })
    },
    () => testUtils.db().migrate(),
  ],
  teardown: [
    () => stopJwksServer(),
    // truncateAllTables is incompatible with FTS5 shadow tables (bookmarks_fts_*).
    // The migrate() in setup already does a full rollback + re-migrate, so data
    // isolation between test runs is ensured without explicit truncation.
  ],
}

/**
 * Configure suites by tapping into the test suite instance.
 * Learn more - https://japa.dev/docs/test-suites#lifecycle-hooks
 */
export const configureSuite: Config['configureSuite'] = (suite) => {
  if (['browser', 'functional', 'e2e'].includes(suite.name)) {
    return suite.setup(() => testUtils.httpServer().start())
  }
}
