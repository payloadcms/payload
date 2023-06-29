import type { ConnectOptions } from 'mongoose';
import { CollectionModel } from '../collections/config/types';
import { migrate } from '../database/migrations/migrate';
import { migrateDown } from '../database/migrations/migrateDown';
import { migrateRefresh } from '../database/migrations/migrateRefresh';
import { migrateReset } from '../database/migrations/migrateReset';
import { migrateStatus } from '../database/migrations/migrateStatus';
import type { DatabaseAdapter } from '../database/types';
import { GlobalModel } from '../globals/config/types';
import type { Payload } from '../index';
import { connect } from './connect';
import { create } from './create';
import { find } from './find';
import { findGlobalVersions } from './findGlobalVersions';
import { findVersions } from './findVersions';
import { init } from './init';
import { queryDrafts } from './queryDrafts';
import { webpack } from './webpack';
import { createMigration } from '../database/migrations/createMigration';


export interface Args {
  payload: Payload;
  /** The URL to connect to MongoDB */
  url: string;
  migrationDir?: string;
  connectOptions?: ConnectOptions & {
    /** Set false to disable $facet aggregation in non-supporting databases, Defaults to true */
    useFacet?: boolean;
  };
}

export type MongooseAdapter = DatabaseAdapter &
  Args & {
    mongoMemoryServer: any;
    collections: {
      [slug: string]: CollectionModel;
    };
    globals: GlobalModel;
    versions: {
      [slug: string]: CollectionModel;
    };
  };

export function mongooseAdapter({
  payload,
  url,
  connectOptions,
  migrationDir = '.migrations',
}: Args): MongooseAdapter {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return {
    payload,
    url,
    connectOptions: connectOptions || {},
    collections: {},
    versions: {},
    connect,
    init,
    webpack,
    migrate,
    migrateStatus,
    migrateDown,
    migrateRefresh,
    migrateReset,
    migrateFresh: async () => null,
    migrationDir,
    createMigration: async (migrationName) => createMigration({ payload, migrationDir, migrationName }),
    transaction: async () => true,
    beginTransaction: async () => true,
    rollbackTransaction: async () => true,
    commitTransaction: async () => true,
    queryDrafts,
    find,
    findVersions,
    findGlobalVersions,
    create,
  };
}
