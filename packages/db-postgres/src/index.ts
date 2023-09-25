import type { Payload } from 'payload'

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
import { destroy } from './destroy'
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
import { updateGlobalVersion } from './updateGlobalVersion'
import { updateVersion } from './updateVersion'
import { webpack } from './webpack'

export function postgresAdapter (args: Args): PostgresAdapterResult {
  function adapter ({ payload }: { payload: Payload }) {
    return createDatabaseAdapter<PostgresAdapter>({
      ...args,
      beginTransaction,
      commitTransaction,
      pool: undefined,
      ...(args.migrationDir && { migrationDir: args.migrationDir }),
      name: 'postgres',
      connect,
      create,
      createGlobal,
      createGlobalVersion,
      createMigration,
      createVersion,
      db: undefined,
      defaultIDType: 'number',
      deleteMany,
      deleteOne,
      deleteVersions,
      destroy,
      enums: {},
      find,
      findGlobal,
      findGlobalVersions,
      findOne,
      findVersions,
      init,
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
