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
import { destroy } from './destroy'
import { extendViteConfig } from './extendViteConfig'
import { extendWebpackConfig } from './extendWebpackConfig'
import { find } from './find'
import { findGlobal } from './findGlobal'
import { findGlobalVersions } from './findGlobalVersions'
import { findOne } from './findOne'
import { findVersions } from './findVersions'
import { init } from './init'
import { migrate } from './migrate'
import { migrateDown } from './migrateDown'
import { migrateFresh } from './migrateFresh'
import { migrateRefresh } from './migrateRefresh'
import { migrateReset } from './migrateReset'
import { migrateStatus } from './migrateStatus'
import { queryDrafts } from './queryDrafts'
import { beginTransaction } from './transactions/beginTransaction'
import { commitTransaction } from './transactions/commitTransaction'
import { rollbackTransaction } from './transactions/rollbackTransaction'
import { updateOne } from './update'
import { updateGlobal } from './updateGlobal'
import { updateGlobalVersion } from './updateGlobalVersion'
import { updateVersion } from './updateVersion'

export type { MigrateDownArgs, MigrateUpArgs } from './types'

export function postgresAdapter(args: Args): PostgresAdapterResult {
  function adapter({ payload }: { payload: Payload }) {
    const migrationDir = args.migrationDir || path.resolve(process.cwd(), 'src/migrations')

    extendWebpackConfig(payload.config)
    extendViteConfig(payload.config)

    return createDatabaseAdapter<PostgresAdapter>({
      name: 'postgres',
      connectTimeout: args.connectTimeout || 10,

      // Postgres-specific
      drizzle: undefined,
      enums: {},
      pool: undefined,
      poolOptions: args.pool,
      push: args.push,
      relations: {},
      schema: {},
      sessions: {},
      tables: {},

      // DatabaseAdapter
      beginTransaction,
      commitTransaction,
      connect,
      create,
      createGlobal,
      createGlobalVersion,
      createMigration,
      createVersion,
      defaultIDType: 'number',
      deleteMany,
      deleteOne,
      deleteVersions,
      destroy,
      find,
      findGlobal,
      findGlobalVersions,
      findOne,
      findVersions,
      init,
      migrate,
      migrateDown,
      migrateFresh,
      migrateRefresh,
      migrateReset,
      migrateStatus,
      migrationDir,
      payload,
      queryDrafts,
      rollbackTransaction,
      updateGlobal,
      updateGlobalVersion,
      updateOne,
      updateVersion,
    })
  }

  return adapter
}
