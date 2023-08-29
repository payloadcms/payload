import type { ClientSession, Connection, ConnectOptions } from 'mongoose';
import mongoose from 'mongoose';
import { createMigration } from 'payload/database';
import type { Payload } from 'payload';
import type { DatabaseAdapter } from 'payload/database';
import { createDatabaseAdapter } from 'payload/database';
import { connect } from './connect.js';
import { init } from './init.js';
import { webpack } from './webpack.js';
import { createGlobal } from './createGlobal.js';
import { createVersion } from './createVersion.js';
import { beginTransaction } from './transactions/beginTransaction.js';
import { rollbackTransaction } from './transactions/rollbackTransaction.js';
import { commitTransaction } from './transactions/commitTransaction.js';
import { queryDrafts } from './queryDrafts.js';
import { find } from './find.js';
import { findGlobalVersions } from './findGlobalVersions.js';
import { findVersions } from './findVersions.js';
import { create } from './create.js';
import { deleteOne } from './deleteOne.js';
import { deleteVersions } from './deleteVersions.js';
import { findGlobal } from './findGlobal.js';
import { findOne } from './findOne.js';
import { updateGlobal } from './updateGlobal.js';
import { updateOne } from './updateOne.js';
import { updateVersion } from './updateVersion.js';
import { deleteMany } from './deleteMany.js';
import { destroy } from './destroy.js';
import type { CollectionModel, GlobalModel } from './types.js';

export interface Args {
  /** The URL to connect to MongoDB or false to start payload and prevent connecting */
  url: string | false;
  migrationDir?: string;
  /** Extra configuration options */
  connectOptions?: ConnectOptions & {
    /** Set false to disable $facet aggregation in non-supporting databases, Defaults to true */
    useFacet?: boolean;
  };
  /** Set to false to disable auto-pluralization of collection names, Defaults to true */
  autoPluralization?: boolean;
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
    sessions: Record<string | number, ClientSession>
    connection: Connection
  }

type MongooseAdapterResult = (args: { payload: Payload }) => MongooseAdapter

export function mongooseAdapter({
  url,
  connectOptions,
  migrationDir,
  autoPluralization = true,
}: Args): MongooseAdapterResult {
  function adapter({ payload }: { payload: Payload }) {
    mongoose.set('strictQuery', false);

    return createDatabaseAdapter<MongooseAdapter>({
      payload,
      migrationDir,
      connection: undefined,
      mongoMemoryServer: undefined,
      sessions: {},
      url,
      connectOptions: connectOptions || {},
      autoPluralization,
      globals: undefined,
      collections: {},
      versions: {},
      connect,
      destroy,
      init,
      webpack,
      createMigration,
      beginTransaction,
      rollbackTransaction,
      commitTransaction,
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
    });
  }

  return adapter;
}
