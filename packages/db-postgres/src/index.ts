import type { Payload } from 'payload';

import { createDatabaseAdapter } from 'payload/database';

import type { Args, PostgresAdapter, PostgresAdapterResult } from './types';

import { connect } from './connect';
import { createMigration } from './createMigration';
import { init } from './init';
import { webpack } from './webpack';
// import { createGlobal } from './createGlobal';
// import { createVersion } from './createVersion';
// import { beginTransaction } from './transactions/beginTransaction';
// import { rollbackTransaction } from './transactions/rollbackTransaction';
// import { commitTransaction } from './transactions/commitTransaction';
// import { queryDrafts } from './queryDrafts';
import { find } from './find';
// import { findGlobalVersions } from './findGlobalVersions';
// import { findVersions } from './findVersions';
import { create } from './create';
// import { deleteOne } from './deleteOne';
// import { deleteVersions } from './deleteVersions';
// import { findGlobal } from './findGlobal';
import { findOne } from './findOne';
// import { updateGlobal } from './updateGlobal';
import { updateOne } from './update';
// import { updateVersion } from './updateVersion';
// import { deleteMany } from './deleteMany';
// import { destroy } from './destroy';

export function postgresAdapter(args: Args): PostgresAdapterResult {
  function adapter({ payload }: { payload: Payload }) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return createDatabaseAdapter<PostgresAdapter>({
      ...args,
      connect,
      create,
      createMigration,
      db: undefined,
      enums: {},
      find,
      // queryDrafts,
      findOne,
      // destroy,
      init,
      payload,
      // beginTransaction,
      // rollbackTransaction,
      // commitTransaction,
      relations: {},
      tables: {},
      updateOne,
      webpack,
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
