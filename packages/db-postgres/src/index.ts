import type { Payload } from 'payload'
import type { DatabaseAdapterObj } from 'payload/database'

import fs from 'fs'
import path from 'path'
import { createDatabaseAdapter } from 'payload/database'

import type { Args, PostgresAdapter } from './types.js'

import { connect } from './connect.js'
import { count } from './count.js'
import { create } from './create.js'
import { createGlobal } from './createGlobal.js'
import { createGlobalVersion } from './createGlobalVersion.js'
import { createMigration } from './createMigration.js'
import { createVersion } from './createVersion.js'
import { deleteMany } from './deleteMany.js'
import { deleteOne } from './deleteOne.js'
import { deleteVersions } from './deleteVersions.js'
import { destroy } from './destroy.js'
import { find } from './find.js'
import { findGlobal } from './findGlobal.js'
import { findGlobalVersions } from './findGlobalVersions.js'
import { findOne } from './findOne.js'
import { findVersions } from './findVersions.js'
import { init } from './init.js'
import { migrate } from './migrate.js'
import { migrateDown } from './migrateDown.js'
import { migrateFresh } from './migrateFresh.js'
import { migrateRefresh } from './migrateRefresh.js'
import { migrateReset } from './migrateReset.js'
import { migrateStatus } from './migrateStatus.js'
import { queryDrafts } from './queryDrafts.js'
import { beginTransaction } from './transactions/beginTransaction.js'
import { commitTransaction } from './transactions/commitTransaction.js'
import { rollbackTransaction } from './transactions/rollbackTransaction.js'
import { updateOne } from './update.js'
import { updateGlobal } from './updateGlobal.js'
import { updateGlobalVersion } from './updateGlobalVersion.js'
import { updateVersion } from './updateVersion.js'

export type { MigrateDownArgs, MigrateUpArgs } from './types.js'

export { sql } from 'drizzle-orm'

export function postgresAdapter(args: Args): DatabaseAdapterObj<PostgresAdapter> {
  const postgresIDType = args.idType || 'serial'
  const payloadIDType = postgresIDType === 'serial' ? 'number' : 'text'

  function adapter({ payload }: { payload: Payload }) {
    const migrationDir = findMigrationDir(args.migrationDir)

    return createDatabaseAdapter<PostgresAdapter>({
      name: 'postgres',

      // Postgres-specific
      blockTableNames: {},
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

  return {
    defaultIDType: payloadIDType,
    init: adapter,
  }
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
