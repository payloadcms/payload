import type { Payload } from 'payload';
import type { DatabaseAdapter } from 'payload/dist/database/types';
// import { connect } from './connect';
import { createDatabaseAdapter } from 'payload/dist/database/createAdapter';
import { init } from './init';
import { webpack } from './webpack';
// import { createGlobal } from './createGlobal';
// import { createVersion } from './createVersion';
// import { beginTransaction } from './transactions/beginTransaction';
// import { rollbackTransaction } from './transactions/rollbackTransaction';
// import { commitTransaction } from './transactions/commitTransaction';
// import { queryDrafts } from './queryDrafts';
// import { find } from './find';
// import { findGlobalVersions } from './findGlobalVersions';
// import { findVersions } from './findVersions';
// import { create } from './create';
// import { deleteOne } from './deleteOne';
// import { deleteVersions } from './deleteVersions';
// import { findGlobal } from './findGlobal';
// import { findOne } from './findOne';
// import { updateGlobal } from './updateGlobal';
// import { updateOne } from './updateOne';
// import { updateVersion } from './updateVersion';
// import { deleteMany } from './deleteMany';
// import { destroy } from './destroy';

export interface Args {
  /** The URL to connect to Postgres or false to start payload and prevent connecting */
  url: string | false;
  migrationDir?: string;
}

export type PostgresAdapter = DatabaseAdapter & Args

type PostgresAdapterResult = (args: { payload: Payload }) => PostgresAdapter

export function postgresAdapter({
  url,
  migrationDir,
}: Args): PostgresAdapterResult {
  function adapter({ payload }: { payload: Payload }) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return createDatabaseAdapter<PostgresAdapter>({
      payload,
      migrationDir,
      url,
      // connect,
      // destroy,
      init,
      webpack,
      // createMigration: async (migrationName) => createMigration({ payload, migrationDir, migrationName }),
      // beginTransaction,
      // rollbackTransaction,
      // commitTransaction,
      // queryDrafts,
      // findOne,
      // find,
      // create,
      // updateOne,
      // deleteOne,
      // deleteMany,
      // findGlobal,
      // createGlobal,
      // updateGlobal,
      // findVersions,
      // findGlobalVersions,
      // createVersion,
      // updateVersion,
      // deleteVersions,
    });
  }

  return adapter;
}
