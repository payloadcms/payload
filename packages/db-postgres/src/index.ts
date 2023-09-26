import type { Payload } from 'payload'

import path from 'path'
import { createDatabaseAdapter } from 'payload/database'

import type { Args, PostgresAdapter, PostgresAdapterResult } from './types'

import { connect } from './connect'
import { create } from './create'
import { createGlobal } from './createGlobal'
import { createGlobalVersion } from './createGlobalVersion'
import { createMigration } from './createMigration'
import { createVersion } from './createVersion'
import { deleteMany } from './deleteMany'
import { deleteOne } from './deleteOne'
import { deleteVersions } from './deleteVersions'
import { find } from './find'
import { findGlobal } from './findGlobal'
import { findGlobalVersions } from './findGlobalVersions'
import { findOne } from './findOne'
import { findVersions } from './findVersions'
import { init } from './init'
import { migrate } from './migrate'
import { queryDrafts } from './queryDrafts'
import { beginTransaction } from './transactions/beginTransaction'
import { commitTransaction } from './transactions/commitTransaction'
import { rollbackTransaction } from './transactions/rollbackTransaction'
import { updateOne } from './update'
import { updateGlobal } from './updateGlobal'
import { updateGlobalVersion } from './updateGlobalVersion'
import { updateVersion } from './updateVersion'
import { webpack } from './webpack'

// import { destroy } from './destroy';

export function postgresAdapter(args: Args): PostgresAdapterResult {
  function adapter({ payload }: { payload: Payload }) {
    const migrationDir = args.migrationDir || path.resolve(__dirname, '../../../migrations')

    return createDatabaseAdapter<PostgresAdapter>({
      ...args,
      beginTransaction,
      commitTransaction,
      connect,
      create,
      createGlobal,
      createGlobalVersion,
      createMigration,
      createVersion,
      db: undefined,
      defaultIDType: 'number',
      findGlobalVersions,
      migrationDir,
      pool: undefined,
      // destroy,
      name: 'postgres',
      deleteMany,
      deleteOne,
      deleteVersions,
      enums: {},
      find,
      findGlobal,
      findOne,
      findVersions,
      init,
      migrate,
      payload,
      queryDrafts,
      relations: {},
      rollbackTransaction,
      schema: {},
      sessions: {},
      tables: {},
      updateGlobal,
      updateGlobalVersion,
      updateOne,
      updateVersion,
      webpack,
    })
  }

  return adapter
}
