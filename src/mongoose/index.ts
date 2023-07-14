import type { ConnectOptions } from 'mongoose';
import { createMigration } from '../database/migrations/createMigration';
import { migrate } from '../database/migrations/migrate';
import { migrateDown } from '../database/migrations/migrateDown';
import { migrateRefresh } from '../database/migrations/migrateRefresh';
import { migrateReset } from '../database/migrations/migrateReset';
import { migrateStatus } from '../database/migrations/migrateStatus';
import type { DatabaseAdapter } from '../database/types';
import { Payload } from '../index';
import type { SanitizedConfig } from '../config/types';
import { connect } from './connect';
import { create } from './create';
import { find } from './find';
import { findGlobalVersions } from './findGlobalVersions';
import { findVersions } from './findVersions';
import { init } from './init';
import { queryDrafts } from './queryDrafts';
import { webpack } from './webpack';

import { createGlobal } from './createGlobal';
import { createVersion } from './createVersion';
import { deleteOne } from './deleteOne';
import { deleteVersions } from './deleteVersions';
import { findGlobal } from './findGlobal';
import { findOne } from './findOne';
import { updateGlobal } from './updateGlobal';
import { updateOne } from './updateOne';
import { updateVersion } from './updateVersion';
import type { CollectionModel, GlobalModel } from './types';
import { deleteMany } from './deleteMany';

export interface Args {
  payload: PayloadMongoose;
  /** The URL to connect to MongoDB */
  url: string;
  migrationDir?: string;
  connectOptions?: ConnectOptions & {
    /** Set false to disable $facet aggregation in non-supporting databases, Defaults to true */
    useFacet?: boolean;
  };
}
export type SanitizedPayloadMongooseConfig = Omit<
SanitizedConfig,
'db'
> & {
  db: MongooseAdapter;
}


export class PayloadMongoose extends Payload {
  db: MongooseAdapter;

  config: SanitizedPayloadMongooseConfig;
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
  return {
    payload,
    url,
    connectOptions: connectOptions || {},
    collections: {},
    versions: {},
    globals: undefined,
    mongoMemoryServer: undefined,
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
    findOne,
    find,
    create,
    updateOne,
    deleteOne,
    deleteMany,
    findGlobal,
    createGlobal,
    updateGlobal,
    findVersions,
    findGlobalVersions,
    createVersion,
    updateVersion,
    deleteVersions,
  };
}
