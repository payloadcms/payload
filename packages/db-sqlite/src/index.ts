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
import { createDatabaseAdapter } from 'payload/database'

import type { Args, SQLiteAdapter } from './types.js'

import { connect } from './connect.js'
import { countDistinct } from './countDistinct.js'
import { defaultDrizzleSnapshot } from './defaultSnapshot.js'
import { deleteWhere } from './deleteWhere.js'
import { dropTables } from './dropTables.js'
import { execute } from './execute.js'
import { generateDrizzleJSON } from './generateDrizzleJSON.js'
import { getMigrationTemplate } from './getMigrationTemplate.js'
import { init } from './init.js'
import { insert } from './insert.js'

export type { MigrateDownArgs, MigrateUpArgs } from './types.js'

export { sql } from 'drizzle-orm'

export function sqliteAdapter(args: Args): DatabaseAdapterObj<SQLiteAdapter> {
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

    return createDatabaseAdapter<SQLiteAdapter>({
      name: 'sqlite',
      client: undefined,
      defaultDrizzleSnapshot,
      drizzle: undefined,
      enums: {},
      features: {
        json: true,
      },
      fieldConstraints: {},
      getMigrationTemplate,
      idType: postgresIDType,
      initializing,
      localesSuffix: args.localesSuffix || '_locales',
      logger: args.logger,
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
      countDistinct,
      create,
      createGlobal,
      createGlobalVersion,
      createMigration,
      createVersion,
      defaultIDType: payloadIDType,
      deleteMany,
      deleteOne,
      deleteVersions,
      deleteWhere,
      destroy,
      dropTables,
      execute,
      find,
      findGlobal,
      findGlobalVersions,
      findOne,
      findVersions,
      generateDrizzleJSON,
      init,
      insert,
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
