/* eslint-disable no-param-reassign */
import type { MarkOptional } from 'ts-essentials'
import type { Configuration } from 'webpack'

import type {
  BeginTransaction,
  CommitTransaction,
  DatabaseAdapter,
  RollbackTransaction,
} from './types.js'

import { createMigration } from './migrations/createMigration.js'
import { migrate } from './migrations/migrate.js'
import { migrateDown } from './migrations/migrateDown.js'
import { migrateRefresh } from './migrations/migrateRefresh.js'
import { migrateReset } from './migrations/migrateReset.js'
import { migrateStatus } from './migrations/migrateStatus.js'
import { transaction } from './transaction.js'

const beginTransaction: BeginTransaction = async () => null
const rollbackTransaction: RollbackTransaction = async () => null
const commitTransaction: CommitTransaction = async () => null

export function createDatabaseAdapter<T extends DatabaseAdapter>(
  args: MarkOptional<
    T,
    | 'createMigration'
    | 'migrate'
    | 'migrateDown'
    | 'migrateFresh'
    | 'migrateRefresh'
    | 'migrateReset'
    | 'migrateStatus'
    | 'migrationDir'
    | 'transaction'
  >,
): T {
  // Need to implement DB Webpack config extensions here
  if (args.webpack) {
    const existingWebpackConfig = args.payload.config.admin.webpack
      ? args.payload.config.admin.webpack
      : (webpackConfig) => webpackConfig
    args.payload.config.admin.webpack = (webpackConfig: Configuration) => {
      return args.webpack(existingWebpackConfig(webpackConfig))
    }
  }

  return {
    // Default 'null' transaction functions
    beginTransaction,
    commitTransaction,
    createMigration,
    migrate,
    migrateDown,
    migrateFresh: async () => null,
    migrateRefresh,
    migrateReset,

    migrateStatus,
    rollbackTransaction,
    transaction,

    ...args,
  } as T
}
