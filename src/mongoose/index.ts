import type { ClientSession, Connection, ConnectOptions } from 'mongoose';
import { createMigration } from '../database/migrations/createMigration';
import { migrate } from '../database/migrations/migrate';
import { migrateDown } from '../database/migrations/migrateDown';
import { migrateRefresh } from '../database/migrations/migrateRefresh';
import { migrateReset } from '../database/migrations/migrateReset';
import { migrateStatus } from '../database/migrations/migrateStatus';
import { CollectionModel } from '../collections/config/types';
import type { DatabaseAdapter } from '../database/types';
import type { Payload } from '../index';
import { connect } from './connect';
import { init } from './init';
import { webpack } from './webpack';

import { createGlobal } from './createGlobal';
import { createVersion } from './createVersion';
import { transaction } from './transactions/transaction';
import { beginTransaction } from './transactions/beginTransaction';
import { rollbackTransaction } from './transactions/rollbackTransaction';
import { commitTransaction } from './transactions/commitTransaction';
import { queryDrafts } from './queryDrafts';
import { GlobalModel } from '../globals/config/types';
import { find } from './find';
import { findGlobalVersions } from './findGlobalVersions';
import { findVersions } from './findVersions';
import { create } from './create';
import { deleteOne } from './deleteOne';
import { deleteVersions } from './deleteVersions';
import { findGlobal } from './findGlobal';
import { findOne } from './findOne';
import { updateGlobal } from './updateGlobal';
import { updateOne } from './updateOne';
import { updateVersion } from './updateVersion';

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
      [slug: string]: CollectionModel
    }
    session: ClientSession
    connection: Connection
  }

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
    transaction,
    beginTransaction,
    rollbackTransaction,
    commitTransaction,
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
