import type { ClientSession, Connection, ConnectOptions } from 'mongoose';
import mongoose from 'mongoose';
import { createMigration } from '@alessiogr/payloadtest/database';
import type { Payload } from '@alessiogr/payloadtest';
import type { DatabaseAdapter } from '@alessiogr/payloadtest/database';
import { createDatabaseAdapter } from '@alessiogr/payloadtest/database';
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
