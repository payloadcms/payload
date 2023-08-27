/* eslint-disable no-param-reassign */
import { Configuration } from 'webpack';
import { MarkOptional } from 'ts-essentials';
import { transaction } from './transaction.js';
import { migrate } from './migrations/migrate.js';
import { migrateStatus } from './migrations/migrateStatus.js';
import { migrateDown } from './migrations/migrateDown.js';
import { migrateRefresh } from './migrations/migrateRefresh.js';
import { migrateReset } from './migrations/migrateReset.js';
import { BeginTransaction, CommitTransaction, DatabaseAdapter, RollbackTransaction } from './types.js';
import { createMigration } from './migrations/createMigration.js';

const beginTransaction: BeginTransaction = async () => null;
const rollbackTransaction: RollbackTransaction = async () => null;
const commitTransaction: CommitTransaction = async () => null;

export function createDatabaseAdapter<T extends DatabaseAdapter>(args: MarkOptional<T,
  | 'transaction'
  | 'migrate'
  | 'createMigration'
  | 'migrateStatus'
  | 'migrateDown'
  | 'migrateRefresh'
  | 'migrateReset'
  | 'migrateFresh'
  | 'migrationDir'
>): T {
  // Need to implement DB Webpack config extensions here
  if (args.webpack) {
    const existingWebpackConfig = args.payload.config.admin.webpack ? args.payload.config.admin.webpack : (webpackConfig) => webpackConfig;
    args.payload.config.admin.webpack = (webpackConfig: Configuration) => {
      return args.webpack(
        existingWebpackConfig(webpackConfig),
      );
    };
  }

  return {
    transaction,
    migrate,
    createMigration,
    migrateStatus,
    migrateDown,
    migrateRefresh,
    migrateReset,
    migrateFresh: async () => null,

    // Default 'null' transaction functions
    beginTransaction,
    commitTransaction,
    rollbackTransaction,

    ...args,
  } as T;
}
