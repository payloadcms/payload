import type { ClientSession, Connection, ConnectOptions } from 'mongoose';
import mongoose from 'mongoose';
import { createMigration } from 'payload/dist/database/migrations/createMigration';
import type { Payload } from 'payload';
import type { DatabaseAdapter } from 'payload/dist/database/types';
import { createDatabaseAdapter } from 'payload/dist/database/createAdapter';
import { connect } from './connect';
import { init } from './init';
import { webpack } from './webpack';
import { createGlobal } from './createGlobal';
import { createVersion } from './createVersion';
import { beginTransaction } from './transactions/beginTransaction';
import { rollbackTransaction } from './transactions/rollbackTransaction';
import { commitTransaction } from './transactions/commitTransaction';
import { queryDrafts } from './queryDrafts';
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
import { deleteMany } from './deleteMany';
import { destroy } from './destroy';
import type { CollectionModel, GlobalModel } from './types';

export interface Args {
  /** The URL to connect to MongoDB or false to start payload and prevent connecting */
  url: string | false;
  migrationDir?: string;
  /** Extra configuration options */
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
    sessions: Record<string | number, ClientSession>
    connection: Connection
  }

type MongooseAdapterResult = (args: { payload: Payload }) => MongooseAdapter

export function mongooseAdapter({
  url,
  connectOptions,
  migrationDir,
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
      globals: undefined,
      collections: {},
      versions: {},
      connect,
      destroy,
      init,
      webpack,
      createMigration: async (migrationName) => createMigration({ payload, migrationDir, migrationName }),
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
