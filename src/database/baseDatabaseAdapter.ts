/* eslint-disable no-param-reassign */
import { Configuration } from 'webpack';
import { transaction } from './transaction';
import { migrate } from './migrations/migrate';
import { migrateStatus } from './migrations/migrateStatus';
import { migrateDown } from './migrations/migrateDown';
import { migrateRefresh } from './migrations/migrateRefresh';
import { migrateReset } from './migrations/migrateReset';
import { DatabaseAdapter } from './types';
import type { Payload } from '../index';
import { createMigration } from './migrations/createMigration';

type BaseDatabaseAdapter = Omit<DatabaseAdapter,
  | 'transaction'
  | 'migrate'
  | 'createMigration'
  | 'migrateStatus'
  | 'migrateDown'
  | 'migrateRefresh'
  | 'migrateReset'
  | 'migrateFresh'
  | 'migrationDir'
>

type Args = {
  payload: Payload,
  migrationDir?: string,
}
export function withBaseDatabaseAdapter<T extends BaseDatabaseAdapter>(args: T): T {
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
    ...args,
  };
}
