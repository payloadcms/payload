import type { Payload } from 'payload';
import { createDatabaseAdapter } from 'payload/dist/database/createAdapter';
import { connect } from './connect';
import { init } from './init';
import { createMigration } from './createMigration';
import { webpack } from './webpack';
import { Args, PostgresAdapter, PostgresAdapterResult } from './types';
import { createGlobal } from './createGlobal';
import { createVersion } from './createVersion';
// import { beginTransaction } from './transactions/beginTransaction';
// import { rollbackTransaction } from './transactions/rollbackTransaction';
// import { commitTransaction } from './transactions/commitTransaction';
import { queryDrafts } from './queryDrafts';
import { find } from './find';
// import { findGlobalVersions } from './findGlobalVersions';
// import { findVersions } from './findVersions';
import { create } from './create';
import { deleteOne } from './deleteOne';
// import { deleteVersions } from './deleteVersions';
import { findGlobal } from './findGlobal';
import { findOne } from './findOne';
import { updateGlobal } from './updateGlobal';
import { updateOne } from './update';
// import { updateVersion } from './updateVersion';
import { deleteMany } from './deleteMany';
// import { destroy } from './destroy';

export function postgresAdapter(args: Args): PostgresAdapterResult {
  function adapter({ payload }: { payload: Payload }) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return createDatabaseAdapter<PostgresAdapter>({
      ...args,
      enums: {},
      relations: {},
      tables: {},
      payload,
      connect,
      db: undefined,
      // destroy,
      init,
      webpack,
      createMigration,
      // beginTransaction,
      // rollbackTransaction,
      // commitTransaction,
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
      // findVersions,
      // findGlobalVersions,
      createVersion,
      // updateVersion,
      // deleteVersions,
    });
  }

  return adapter;
}
