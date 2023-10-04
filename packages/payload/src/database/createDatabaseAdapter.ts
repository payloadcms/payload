/* eslint-disable no-param-reassign */
import type { MarkOptional } from 'ts-essentials'
import type { Configuration } from 'webpack'

import type {
  BaseDatabaseAdapter,
  BeginTransaction,
  CommitTransaction,
  RollbackTransaction,
} from './types'

import { createMigration } from './migrations/createMigration'
import { migrate } from './migrations/migrate'
import { migrateDown } from './migrations/migrateDown'
import { migrateRefresh } from './migrations/migrateRefresh'
import { migrateReset } from './migrations/migrateReset'
import { migrateStatus } from './migrations/migrateStatus'
import { transaction } from './transaction'

const beginTransaction: BeginTransaction = async () => null
const rollbackTransaction: RollbackTransaction = async () => null
const commitTransaction: CommitTransaction = async () => null

export function createDatabaseAdapter<T extends BaseDatabaseAdapter>(
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

    // Ensure migrationDir is set
    migrationDir: args.migrationDir || 'migrations',
  } as T
}
