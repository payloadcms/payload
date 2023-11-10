import type { ClientSession, ConnectOptions, Connection } from 'mongoose'
import type { Payload } from 'payload'
import type { BaseDatabaseAdapter } from 'payload/database'

import mongoose from 'mongoose'
import path from 'path'
import { createDatabaseAdapter } from 'payload/database'

export type { MigrateDownArgs, MigrateUpArgs } from './types'

import type { CollectionModel, GlobalModel } from './types'

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
import { migrateFresh } from './migrateFresh'
import { queryDrafts } from './queryDrafts'
import { beginTransaction } from './transactions/beginTransaction'
import { commitTransaction } from './transactions/commitTransaction'
import { rollbackTransaction } from './transactions/rollbackTransaction'
import { updateGlobal } from './updateGlobal'
import { updateGlobalVersion } from './updateGlobalVersion'
import { updateOne } from './updateOne'
import { updateVersion } from './updateVersion'

export interface Args {
  /** Set to false to disable auto-pluralization of collection names, Defaults to true */
  autoPluralization?: boolean
  /** Extra configuration options */
  connectOptions?: ConnectOptions & {
    /** Set false to disable $facet aggregation in non-supporting databases, Defaults to true */
    useFacet?: boolean
  }
  /** Set to true to disable hinting to MongoDB to use 'id' as index. This is currently done when counting documents for pagination. Disabling this optimization might fix some problems with AWS DocumentDB. Defaults to false */
  disableIndexHints?: boolean
  migrationDir?: string
  /** The URL to connect to MongoDB or false to start payload and prevent connecting */
  url: false | string
}

export type MongooseAdapter = BaseDatabaseAdapter &
  Args & {
    collections: {
      [slug: string]: CollectionModel
    }
    connection: Connection
    globals: GlobalModel
    mongoMemoryServer: any
    sessions: Record<number | string, ClientSession>
    versions: {
      [slug: string]: CollectionModel
    }
  }

type MongooseAdapterResult = (args: { payload: Payload }) => MongooseAdapter

declare module 'payload' {
  export interface DatabaseAdapter
    extends Omit<BaseDatabaseAdapter, 'sessions'>,
      Omit<Args, 'migrationDir'> {
    collections: {
      [slug: string]: CollectionModel
    }
    connection: Connection
    globals: GlobalModel
    mongoMemoryServer: any
    sessions: Record<number | string, ClientSession>
    versions: {
      [slug: string]: CollectionModel
    }
  }
}

export function mongooseAdapter({
  autoPluralization = true,
  connectOptions,
  disableIndexHints = false,
  migrationDir: migrationDirArg,
  url,
}: Args): MongooseAdapterResult {
  function adapter({ payload }: { payload: Payload }) {
    const migrationDir = migrationDirArg || path.resolve(process.cwd(), 'src/migrations')
    mongoose.set('strictQuery', false)

    extendWebpackConfig(payload.config)
    extendViteConfig(payload.config)

    return createDatabaseAdapter<MongooseAdapter>({
      name: 'mongoose',

      // Mongoose-specific
      autoPluralization,
      collections: {},
      connectOptions: connectOptions || {},
      connection: undefined,
      disableIndexHints,
      globals: undefined,
      mongoMemoryServer: undefined,
      sessions: {},
      url,
      versions: {},

      // DatabaseAdapter
      beginTransaction,
      commitTransaction,
      connect,
      create,
      createGlobal,
      createGlobalVersion,
      createMigration,
      createVersion,
      defaultIDType: 'text',
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
      migrateFresh,
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
