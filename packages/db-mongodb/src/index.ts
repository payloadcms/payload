import type { CollationOptions, TransactionOptions } from 'mongodb'
import type { MongoMemoryReplSet } from 'mongodb-memory-server'
import type {
  ClientSession,
  Connection,
  ConnectOptions,
  QueryOptions,
  SchemaOptions,
} from 'mongoose'
import type {
  BaseDatabaseAdapter,
  CollectionSlug,
  DatabaseAdapterObj,
  Migration,
  Payload,
  TypeWithID,
  TypeWithVersion,
  UpdateGlobalArgs,
  UpdateGlobalVersionArgs,
  UpdateOneArgs,
  UpdateVersionArgs,
} from 'payload'

import fs from 'fs'
import mongoose from 'mongoose'
import path from 'path'
import { createDatabaseAdapter, defaultBeginTransaction } from 'payload'

import type { CollectionModel, GlobalModel, MigrateDownArgs, MigrateUpArgs } from './types.js'

import { connect } from './connect.js'
import { count } from './count.js'
import { countGlobalVersions } from './countGlobalVersions.js'
import { countVersions } from './countVersions.js'
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
import { migrateFresh } from './migrateFresh.js'
import { queryDrafts } from './queryDrafts.js'
import { beginTransaction } from './transactions/beginTransaction.js'
import { commitTransaction } from './transactions/commitTransaction.js'
import { rollbackTransaction } from './transactions/rollbackTransaction.js'
import { updateGlobal } from './updateGlobal.js'
import { updateGlobalVersion } from './updateGlobalVersion.js'
import { updateJobs } from './updateJobs.js'
import { updateMany } from './updateMany.js'
import { updateOne } from './updateOne.js'
import { updateVersion } from './updateVersion.js'
import { upsert } from './upsert.js'

export type { MigrateDownArgs, MigrateUpArgs } from './types.js'

export interface Args {
  /**
   * By default, Payload strips all additional keys from MongoDB data that don't exist
   * in the Payload schema. If you have some data that you want to include to the result
   * but it doesn't exist in Payload, you can enable this flag
   * @default false
   */
  allowAdditionalKeys?: boolean
  /**
   * Enable this flag if you want to thread your own ID to create operation data, for example:
   * ```ts
   * import { Types } from 'mongoose'
   *
   * const id = new Types.ObjectId().toHexString()
   * const doc = await payload.create({ collection: 'posts', data: {id, title: "my title"}})
   * assertEq(doc.id, id)
   * ```
   */
  allowIDOnCreate?: boolean
  /** Set to false to disable auto-pluralization of collection names, Defaults to true */
  autoPluralization?: boolean

  /**
   * If enabled, collation allows for language-specific rules for string comparison.
   * This configuration can include the following options:
   *
   * - `strength` (number): Comparison level (1: Primary, 2: Secondary, 3: Tertiary (default), 4: Quaternary, 5: Identical)
   * - `caseLevel` (boolean): Include case comparison at strength level 1 or 2.
   * - `caseFirst` (string): Sort order of case differences during tertiary level comparisons ("upper", "lower", "off").
   * - `numericOrdering` (boolean): Compare numeric strings as numbers.
   * - `alternate` (string): Consider whitespace and punctuation as base characters ("non-ignorable", "shifted").
   * - `maxVariable` (string): Characters considered ignorable when `alternate` is "shifted" ("punct", "space").
   * - `backwards` (boolean): Sort strings with diacritics from back of the string.
   * - `normalization` (boolean): Check if text requires normalization and perform normalization.
   *
   * Available on MongoDB version 3.4 and up.
   * The locale that gets passed is your current project's locale but defaults to "en".
   *
   * Example:
   * {
   *   strength: 3
   * }
   *
   * Defaults to disabled.
   */
  collation?: Omit<CollationOptions, 'locale'>

  collectionsSchemaOptions?: Partial<Record<CollectionSlug, SchemaOptions>>
  /** Extra configuration options */
  connectOptions?: {
    /**
     * Set false to disable $facet aggregation in non-supporting databases, Defaults to true
     * @deprecated Payload doesn't use `$facet` anymore anywhere.
     */
    useFacet?: boolean
  } & ConnectOptions
  /** Set to true to disable hinting to MongoDB to use 'id' as index. This is currently done when counting documents for pagination. Disabling this optimization might fix some problems with AWS DocumentDB. Defaults to false */
  disableIndexHints?: boolean
  /**
   * Set to `true` to ensure that indexes are ready before completing connection.
   * NOTE: not recommended for production. This can slow down the initialization of Payload.
   */
  ensureIndexes?: boolean
  migrationDir?: string
  /**
   * typed as any to avoid dependency
   */
  mongoMemoryServer?: MongoMemoryReplSet
  prodMigrations?: Migration[]
  transactionOptions?: false | TransactionOptions

  /** The URL to connect to MongoDB or false to start payload and prevent connecting */
  url: false | string
}

export type MongooseAdapter = {
  collections: {
    [slug: string]: CollectionModel
  }
  connection: Connection
  ensureIndexes: boolean
  globals: GlobalModel
  mongoMemoryServer: MongoMemoryReplSet
  prodMigrations?: {
    down: (args: MigrateDownArgs) => Promise<void>
    name: string
    up: (args: MigrateUpArgs) => Promise<void>
  }[]
  sessions: Record<number | string, ClientSession>
  versions: {
    [slug: string]: CollectionModel
  }
} & Args &
  BaseDatabaseAdapter

declare module 'payload' {
  export interface DatabaseAdapter
    extends Omit<BaseDatabaseAdapter, 'sessions'>,
      Omit<Args, 'migrationDir'> {
    collections: {
      [slug: string]: CollectionModel
    }
    connection: Connection
    ensureIndexes: boolean
    globals: GlobalModel
    mongoMemoryServer: MongoMemoryReplSet
    prodMigrations?: {
      down: (args: MigrateDownArgs) => Promise<void>
      name: string
      up: (args: MigrateUpArgs) => Promise<void>
    }[]
    sessions: Record<number | string, ClientSession>
    transactionOptions: TransactionOptions
    updateGlobal: <T extends Record<string, unknown>>(
      args: { options?: QueryOptions } & UpdateGlobalArgs<T>,
    ) => Promise<T>
    updateGlobalVersion: <T extends TypeWithID = TypeWithID>(
      args: { options?: QueryOptions } & UpdateGlobalVersionArgs<T>,
    ) => Promise<TypeWithVersion<T>>

    updateOne: (args: { options?: QueryOptions } & UpdateOneArgs) => Promise<Document>
    updateVersion: <T extends TypeWithID = TypeWithID>(
      args: { options?: QueryOptions } & UpdateVersionArgs<T>,
    ) => Promise<TypeWithVersion<T>>
    versions: {
      [slug: string]: CollectionModel
    }
  }
}

export function mongooseAdapter({
  allowAdditionalKeys = false,
  allowIDOnCreate = false,
  autoPluralization = true,
  collectionsSchemaOptions = {},
  connectOptions,
  disableIndexHints = false,
  ensureIndexes = false,
  migrationDir: migrationDirArg,
  mongoMemoryServer,
  prodMigrations,
  transactionOptions = {},
  url,
}: Args): DatabaseAdapterObj {
  function adapter({ payload }: { payload: Payload }) {
    const migrationDir = findMigrationDir(migrationDirArg)
    mongoose.set('strictQuery', false)

    return createDatabaseAdapter<MongooseAdapter>({
      name: 'mongoose',

      // Mongoose-specific
      autoPluralization,
      collections: {},
      // @ts-expect-error initialize without a connection
      connection: undefined,
      connectOptions: connectOptions || {},
      disableIndexHints,
      ensureIndexes,
      // @ts-expect-error don't have globals model yet
      globals: undefined,
      // @ts-expect-error Should not be required
      mongoMemoryServer,
      sessions: {},
      transactionOptions: transactionOptions === false ? undefined : transactionOptions,
      updateJobs,
      updateMany,
      url,
      versions: {},
      // DatabaseAdapter
      allowAdditionalKeys,
      allowIDOnCreate,
      beginTransaction: transactionOptions === false ? defaultBeginTransaction() : beginTransaction,
      collectionsSchemaOptions,
      commitTransaction,
      connect,
      count,
      countGlobalVersions,
      countVersions,
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
      packageName: '@payloadcms/db-mongodb',
      payload,
      prodMigrations,
      queryDrafts,
      rollbackTransaction,
      updateGlobal,
      updateGlobalVersion,
      updateOne,
      updateVersion,
      upsert,
    })
  }

  return {
    name: 'mongoose',
    allowIDOnCreate,
    defaultIDType: 'text',
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
  if (migrationDir) {
    return migrationDir
  }

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
