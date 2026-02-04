import type { LocalizeStatusArgs as MongoArgs } from './mongo/index.js'
import type { LocalizeStatusArgs as SqlArgs } from './sql/index.js'

import { localizeStatus as mongoLocalizeStatus } from './mongo/index.js'
import { localizeStatus as sqlLocalizeStatus } from './sql/index.js'

type LocalizeStatusMigration = {
  down: (args: any) => Promise<void>
  up: (args: any) => Promise<void>
}

/**
 * Main entry point for localizeStatus migration.
 * Detects database type and dispatches to appropriate implementation.
 */
export const localizeStatus: LocalizeStatusMigration = {
  async up(args: MongoArgs | SqlArgs): Promise<void> {
    // Detect database type by checking which parameters are present
    if ('db' in args && 'sql' in args) {
      // SQL database (Postgres, SQLite, etc.)
      return sqlLocalizeStatus.up(args)
    } else if ('payload' in args && !('db' in args)) {
      // MongoDB
      return mongoLocalizeStatus.up(args)
    } else {
      throw new Error(
        'Unable to detect database type. Expected either { db, sql } for SQL databases ' +
          'or { payload } for MongoDB.',
      )
    }
  },

  async down(args: MongoArgs | SqlArgs): Promise<void> {
    // Detect database type by checking which parameters are present
    if ('db' in args && 'sql' in args) {
      // SQL database (Postgres, SQLite, etc.)
      return sqlLocalizeStatus.down(args)
    } else if ('payload' in args && !('db' in args)) {
      // MongoDB
      return mongoLocalizeStatus.down(args)
    } else {
      throw new Error(
        'Unable to detect database type. Expected either { db, sql } for SQL databases ' +
          'or { payload } for MongoDB.',
      )
    }
  },
}

export type { LocalizeStatusArgs as MongoLocalizeStatusArgs } from './mongo/index.js'
// Re-export types for convenience
export type { LocalizeStatusArgs as SqlLocalizeStatusArgs } from './sql/index.js'
