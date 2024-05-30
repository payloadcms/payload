import type { Payload } from 'payload'
import type { DatabaseAdapterObj } from 'payload/database'

import {
  beginTransaction,
  commitTransaction,
  count,
  create,
  createGlobal,
  createGlobalVersion,
  createMigration,
  createVersion,
  deleteMany,
  deleteOne,
  deleteVersions,
  destroy,
  find,
  findGlobal,
  findGlobalVersions,
  findMigrationDir,
  findOne,
  findVersions,
  init,
  migrate,
  migrateDown,
  migrateFresh,
  migrateRefresh,
  migrateReset,
  migrateStatus,
  queryDrafts,
  rollbackTransaction,
  updateGlobal,
  updateGlobalVersion,
  updateOne,
  updateVersion,
} from '@payloadcms/drizzle'
import { pgSchema, pgTable } from 'drizzle-orm/pg-core'
import { createDatabaseAdapter } from 'payload/database'

import type { Args, PostgresAdapter } from './types.js'

import { connect } from './connect.js'
import { defaultDrizzleSnapshot } from './defaultSnapshot.js'
import { getMigrationTemplate } from './getMigrationTemplate.js'

export type { MigrateDownArgs, MigrateUpArgs } from './types.js'

export { sql } from 'drizzle-orm'

export function postgresAdapter(args: Args): DatabaseAdapterObj<PostgresAdapter> {
  const postgresIDType = args.idType || 'serial'
  const payloadIDType = postgresIDType === 'serial' ? 'number' : 'text'

  function adapter({ payload }: { payload: Payload }) {
    const migrationDir = findMigrationDir(args.migrationDir)
    let resolveInitializing
    let rejectInitializing

    const initializing = new Promise<void>((res, rej) => {
      resolveInitializing = res
      rejectInitializing = rej
    })

    return createDatabaseAdapter<PostgresAdapter>({
      name: 'postgres',
      defaultDrizzleSnapshot,
      drizzle: undefined,
      enums: {},
      features: {
        enum: true,
        json: true,
      },
      fieldConstraints: {},
      getMigrationTemplate,
      idType: postgresIDType,
      initializing,
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
      rejectInitializing,
      resolveInitializing,
      rollbackTransaction,
      tableFunction: args.schemaName ? pgSchema(args.schemaName).table : pgTable,
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
