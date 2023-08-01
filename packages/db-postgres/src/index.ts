import type { ClientConfig, PoolConfig } from 'pg';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Payload } from 'payload';
import type { DatabaseAdapter } from 'payload/dist/database/types';
import { createDatabaseAdapter } from 'payload/dist/database/createAdapter';
import { connect } from './connect';
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

type BaseArgs = {
  migrationDir?: string;
}

type ClientArgs = {
  /** Client connection options for the Node package `pg` */
  client?: ClientConfig | string | false
} & BaseArgs

type PoolArgs = {
  /** Pool connection options for the Node package `pg` */
  pool?: PoolConfig | false
} & BaseArgs

export type Args = ClientArgs | PoolArgs

export type PostgresAdapter = DatabaseAdapter & Args & {
  db: NodePgDatabase<Record<string, never>>
}

type PostgresAdapterResult = (args: { payload: Payload }) => PostgresAdapter

export function postgresAdapter(args: Args): PostgresAdapterResult {
  function adapter({ payload }: { payload: Payload }) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return createDatabaseAdapter<PostgresAdapter>({
      ...args,
      payload,
      connect,
      db: undefined,
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
