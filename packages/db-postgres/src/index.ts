import type { Payload } from 'payload'
import type { DatabaseAdapterObj } from 'payload/database'

import fs from 'fs'
import path from 'path'
import { createDatabaseAdapter } from 'payload/database'

import type { Args, PostgresAdapter } from './types.d.ts'

import { connect } from './connect.js'
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

export type { MigrateDownArgs, MigrateUpArgs } from './types.d.ts'

export function postgresAdapter(args: Args): DatabaseAdapterObj<PostgresAdapter> {
  function adapter({ payload }: { payload: Payload }) {
    const migrationDir = findMigrationDir(args.migrationDir)
    const idType = args.idType || 'serial'

    return createDatabaseAdapter<PostgresAdapter>({
      name: 'postgres',

      // Postgres-specific
      drizzle: undefined,
      enums: {},
      fieldConstraints: {},
      idType,
      logger: args.logger,
      pgSchema: undefined,
      pool: undefined,
      poolOptions: args.pool,
      push: args.push,
      relations: {},
      schema: {},
      schemaName: args.schemaName,
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
      /**
       * This represents how a default ID is treated in Payload as were a field type
       */
      defaultIDType: idType === 'serial' ? 'number' : 'text',
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
    defaultIDType: 'number',
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
