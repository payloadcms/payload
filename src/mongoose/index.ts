import type { ConnectOptions } from 'mongoose';
import { createMigration } from '../database/migrations/createMigration';
import { migrate } from '../database/migrations/migrate';
import { migrateDown } from '../database/migrations/migrateDown';
import { migrateRefresh } from '../database/migrations/migrateRefresh';
import { migrateReset } from '../database/migrations/migrateReset';
import { migrateStatus } from '../database/migrations/migrateStatus';
import type { DatabaseAdapter } from '../database/types';
import { Payload } from '../index';
import { connect } from './connect';
import { findGlobalVersions } from './findGlobalVersions';
import { findVersions } from './findVersions';
import { init } from './init';
import { webpack } from './webpack';
import { queryDrafts } from './queryDrafts';
import { find } from './find';
import { create } from './create';
import { updateOne } from './updateOne';
import { deleteOne } from './deleteOne';
import { deleteVersions } from './deleteVersions';
import { findGlobal } from './findGlobal';
import { findOne } from './findOne';
import { updateGlobal } from './updateGlobal';
import { createGlobal } from './createGlobal';
import { CollectionModel, GlobalModel, TypeOfIndex } from './types';
import { SanitizedConfig } from '../config/types';
import { createVersion } from './createVersion';
import { updateVersion } from './updateVersion';

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


export interface Args {
  payload: PayloadMongoose,
  /** The URL to connect to MongoDB */
  url: string;
  migrationDir?: string;
  connectOptions?: ConnectOptions & {
    /** Set false to disable $facet aggregation in non-supporting databases, Defaults to true */
    useFacet?: boolean
  }
  collections?: {
    [slug: string]: {
      /**
       * Array of database indexes to create, including compound indexes that have multiple fields
       */
      indexes?: TypeOfIndex[]
    }
  },

}

export type MongooseAdapter = DatabaseAdapter &
  Args & {
    mongoMemoryServer: any;
    collections: {
      [slug: string]: {
        model?: CollectionModel
        /**
         * Array of database indexes to create, including compound indexes that have multiple fields
         */
        indexes?: TypeOfIndex[];
      }
    }
    globals: GlobalModel
    versions: {
      [slug: string]: CollectionModel;
    };
  };

export function mongooseAdapter({ payload, url, connectOptions, collections, migrationDir = '.migrations' }: Args): MongooseAdapter {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return {
    payload,
    url,
    connectOptions: connectOptions || {},
    collections: collections ?? {},
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
    findOne,
    find,
    create,
    updateOne,
    deleteOne,
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
