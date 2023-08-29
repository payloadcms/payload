import type { Payload } from 'payload';
import { createDatabaseAdapter } from 'payload/database';
import { connect } from './connect.js';
import { init } from './init.js';
import { createMigration } from './createMigration.js';
import { webpack } from './webpack.js';
import { Args, PostgresAdapter, PostgresAdapterResult } from './types.js';
// import { createGlobal } from './createGlobal.js';
// import { createVersion } from './createVersion.js';
// import { beginTransaction } from './transactions/beginTransaction.js';
// import { rollbackTransaction } from './transactions/rollbackTransaction.js';
// import { commitTransaction } from './transactions/commitTransaction.js';
// import { queryDrafts } from './queryDrafts.js';
import { find } from './find.js';
// import { findGlobalVersions } from './findGlobalVersions.js';
// import { findVersions } from './findVersions.js';
import { create } from './create/index.js';
// import { deleteOne } from './deleteOne.js';
// import { deleteVersions } from './deleteVersions.js';
// import { findGlobal } from './findGlobal.js';
import { findOne } from './findOne.js';
// import { updateGlobal } from './updateGlobal.js';
import { updateOne } from './update/index.js';
// import { updateVersion } from './updateVersion.js';
// import { deleteMany } from './deleteMany.js';
// import { destroy } from './destroy.js';

export function postgresAdapter(args: Args): PostgresAdapterResult {
  function adapter({ payload }: { payload: Payload }) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
      // queryDrafts,
      findOne,
      find,
      create,
      updateOne,
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
