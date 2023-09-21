import type { Payload } from 'payload'

import { createDatabaseAdapter } from 'payload/database'

import type { Args, PostgresAdapter, PostgresAdapterResult } from './types'

import { connect } from './connect'
import { create } from './create'
import { createGlobal } from './createGlobal'
import { createMigration } from './createMigration'
import { createVersion } from './createVersion'
// import { updateVersion } from './updateVersion';
import { deleteMany } from './deleteMany'
import { deleteOne } from './deleteOne'
import { deleteVersions } from './deleteVersions'
import { find } from './find'
import { findGlobal } from './findGlobal'
import { findGlobalVersions } from './findGlobalVersions'
import { findOne } from './findOne'
import { findVersions } from './findVersions'
import { init } from './init'
import { queryDrafts } from './queryDrafts'
import { beginTransaction } from './transactions/beginTransaction'
import { commitTransaction } from './transactions/commitTransaction'
import { rollbackTransaction } from './transactions/rollbackTransaction'
import { updateOne } from './update'
import { updateGlobal } from './updateGlobal'
import { webpack } from './webpack'

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
      createVersion,
      db: undefined,
      defaultIDType: 'number',
      findGlobalVersions,
      // destroy,
      name: 'postgres',
      deleteMany,
      deleteOne,
      enums: {},
      find,
      findGlobal,
      findOne,
      findVersions,
      init,
      payload,
      queryDrafts,
      relations: {},
      rollbackTransaction,
      sessions: {},
      tables: {},
      updateGlobal,
      updateOne,
      webpack,
      // updateVersion,
      deleteVersions,
    })
  }

  return adapter
}
