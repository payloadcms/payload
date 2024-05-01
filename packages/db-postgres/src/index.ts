import type { Payload } from 'payload'

import fs from 'fs'
import path from 'path'
import { createDatabaseAdapter } from 'payload/database'

import type { Args, PostgresAdapter, PostgresAdapterResult } from './types'

import { connect } from './connect'
import { count } from './count'
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
  const postgresIDType = args.idType || 'serial'
  const payloadIDType = postgresIDType === 'serial' ? 'number' : 'text'

  function adapter({ payload }: { payload: Payload }) {
    const migrationDir = findMigrationDir(args.migrationDir)

    return createDatabaseAdapter<PostgresAdapter>({
      name: 'postgres',
      drizzle: undefined,
      enums: {},
      fieldConstraints: {},
      idType: postgresIDType,
      localesSuffix: args.localesSuffix || '_locales',
      logger: args.logger,
      pgSchema: undefined,
      pool: undefined,
      poolOptions: args.pool,
      push: args.push,
      relations: {},
      relationshipsSuffix: args.relationshipsSuffix || '_rels',
      schema: {},
      schemaName: args.schemaName,
      sessions: {},
      tableNameMap: new Map<string, string>(),
      tables: {},
      versionsSuffix: args.versionsSuffix || '_v',

      // DatabaseAdapter
      beginTransaction,
      commitTransaction,
      connect,
      count,
      create,
      createGlobal,
      createGlobalVersion,
      createMigration,
      createVersion,
      defaultIDType: payloadIDType,
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

/**
 * Attempt to find migrations directory.
 *
 * Checks for the following directories in order:
 * - `migrationDir` argument from Payload config
 * - `src/migrations`
 * - `dist/migrations`
 * - `migrations`
 *
 * Defaults to `src/migrations`
 *
 * @param migrationDir
 * @returns
 */
function findMigrationDir(migrationDir?: string): string {
  const cwd = process.cwd()
  const srcDir = path.resolve(cwd, 'src/migrations')
  const distDir = path.resolve(cwd, 'dist/migrations')
  const relativeMigrations = path.resolve(cwd, 'migrations')

  // Use arg if provided
  if (migrationDir) return migrationDir

  // Check other common locations
  if (fs.existsSync(srcDir)) {
    return srcDir
  }

  if (fs.existsSync(distDir)) {
    return distDir
  }

  if (fs.existsSync(relativeMigrations)) {
    return relativeMigrations
  }

  return srcDir
}
