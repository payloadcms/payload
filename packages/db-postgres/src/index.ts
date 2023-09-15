import type { Payload } from 'payload';

// import { findGlobalVersions } from './findGlobalVersions';
import { createDatabaseAdapter } from 'payload/database';

import type { Args, PostgresAdapter, PostgresAdapterResult } from './types';

import { connect } from './connect';
// import { findVersions } from './findVersions';
import { create } from './create';
import { createGlobal } from './createGlobal';
import { createMigration } from './createMigration';
import { createVersion } from './createVersion';
// import { updateVersion } from './updateVersion';
import { deleteMany } from './deleteMany';
import { deleteOne } from './deleteOne';
import { find } from './find';
// import { deleteVersions } from './deleteVersions';
import { findGlobal } from './findGlobal';
import { findOne } from './findOne';
import { init } from './init';
import { queryDrafts } from './queryDrafts';
import { beginTransaction } from './transactions/beginTransaction';
import { commitTransaction } from './transactions/commitTransaction';
import { rollbackTransaction } from './transactions/rollbackTransaction';
import { updateOne } from './update';
import { updateGlobal } from './updateGlobal';
import { webpack } from './webpack';

// import { destroy } from './destroy';

export function postgresAdapter(args: Args): PostgresAdapterResult {
  function adapter({ payload }: { payload: Payload }) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return createDatabaseAdapter<PostgresAdapter>({
      ...args,
      beginTransaction,
      commitTransaction,
      ...(args.migrationDir && { migrationDir: args.migrationDir }),
      connect,
      create,
      createGlobal,
      createMigration,
      // findGlobalVersions,
      createVersion,
      db: undefined,
      // destroy,
      deleteMany,
      deleteOne,
      enums: {},
      find,
      findGlobal,
      findOne,
      init,
      payload,
      queryDrafts,
      relations: {},
      rollbackTransaction,
      sessions: {},
      tables: {},
      updateGlobal,
      updateOne,
      // findVersions,
      webpack,
      // updateVersion,
      // deleteVersions,
    });
  }

  return adapter;
}
