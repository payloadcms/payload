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
  JsonObject,
  Payload,
  TypeWithVersion,
  UpdateGlobalArgs,
  UpdateGlobalVersionArgs,
  UpdateOneArgs,
  UpdateVersionArgs,
} from 'payload'

import mongoose from 'mongoose'
import { createDatabaseAdapter, defaultBeginTransaction, findMigrationDir } from 'payload'

import type {
  CollectionModel,
  GlobalModel,
  MigrateDownArgs,
  MigrateUpArgs,
  MongooseMigration,
} from './types.js'

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
import { findDistinct } from './findDistinct.js'
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
  afterCreateConnection?: (adapter: MongooseAdapter) => Promise<void> | void
  afterOpenConnection?: (adapter: MongooseAdapter) => Promise<void> | void
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
   * When true, bulk operations will process documents one at a time
   * in separate transactions instead of all at once in a single transaction.
   * Useful for avoiding transaction limitations with large datasets in DocumentDB and Cosmos DB.
   *
   * @default false
   */
  bulkOperationsSingleTransaction?: boolean

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
  /**
   * We add a secondary sort based on `createdAt` to ensure that results are always returned in the same order when sorting by a non-unique field.
   * This is because MongoDB does not guarantee the order of results, however in very large datasets this could affect performance.
   *
   * Set to `true` to disable this behaviour.
   */
  disableFallbackSort?: boolean
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
  prodMigrations?: MongooseMigration[]

  transactionOptions?: false | TransactionOptions

  /** The URL to connect to MongoDB or false to start payload and prevent connecting */
  url: false | string

  /**
   * Set to `true` to use an alternative `dropDatabase` implementation that calls `collection.deleteMany({})` on every collection instead of sending a raw `dropDatabase` command.
   * Payload only uses `dropDatabase` for testing purposes.
   * @default false
   */
  useAlternativeDropDatabase?: boolean

  /**
   * Set to `true` to use `BigInt` for custom ID fields of type `'number'`.
   * Useful for databases that don't support `double` or `int32` IDs.
   * @default false
   */
  useBigIntForNumberIDs?: boolean
  /**
   * Set to `false` to disable join aggregations (which use correlated subqueries) and instead populate join fields via multiple `find` queries.
   * @default true
   */
  useJoinAggregations?: boolean
  /**
   * Set to `false` to disable the use of `pipeline` in the `$lookup` aggregation in sorting.
   * @default true
   */
  usePipelineInSortLookup?: boolean
}

export type MongooseAdapter = {
  afterCreateConnection?: (adapter: MongooseAdapter) => Promise<void> | void
  afterOpenConnection?: (adapter: MongooseAdapter) => Promise<void> | void
  bulkOperationsSingleTransaction: boolean
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
  useAlternativeDropDatabase: boolean
  useBigIntForNumberIDs: boolean
  useJoinAggregations: boolean
  usePipelineInSortLookup: boolean
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
    updateGlobalVersion: <T extends JsonObject = JsonObject>(
      args: { options?: QueryOptions } & UpdateGlobalVersionArgs<T>,
    ) => Promise<TypeWithVersion<T>>

    updateOne: (args: { options?: QueryOptions } & UpdateOneArgs) => Promise<Document>
    updateVersion: <T extends JsonObject = JsonObject>(
      args: { options?: QueryOptions } & UpdateVersionArgs<T>,
    ) => Promise<TypeWithVersion<T>>
    useAlternativeDropDatabase: boolean
    useBigIntForNumberIDs: boolean
    useJoinAggregations: boolean
    usePipelineInSortLookup: boolean
    versions: {
      [slug: string]: CollectionModel
    }
  }
}

export function mongooseAdapter({
  afterCreateConnection,
  afterOpenConnection,
  allowAdditionalKeys = false,
  allowIDOnCreate = false,
  autoPluralization = true,
  bulkOperationsSingleTransaction = false,
  collation,
  collectionsSchemaOptions = {},
  connectOptions,
  disableFallbackSort = false,
  disableIndexHints = false,
  ensureIndexes = false,
  migrationDir: migrationDirArg,
  mongoMemoryServer,
  prodMigrations,
  transactionOptions = {},
  url,
  useAlternativeDropDatabase = false,
  useBigIntForNumberIDs = false,
  useJoinAggregations = true,
  usePipelineInSortLookup = true,
}: Args): DatabaseAdapterObj {
  function adapter({ payload }: { payload: Payload }) {
    const migrationDir = findMigrationDir(migrationDirArg)
    mongoose.set('strictQuery', false)

    return createDatabaseAdapter<MongooseAdapter>({
      name: 'mongoose',

      // Mongoose-specific
      afterCreateConnection,
      afterOpenConnection,
      autoPluralization,
      bulkOperationsSingleTransaction,
      collation,
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
      disableFallbackSort,
      find,
      findDistinct,
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
      useAlternativeDropDatabase,
      useBigIntForNumberIDs,
      useJoinAggregations,
      usePipelineInSortLookup,
    })
  }

  return {
    name: 'mongoose',
    allowIDOnCreate,
    defaultIDType: 'text',
    init: adapter,
  }
}

export { compatibilityOptions } from './utilities/compatibilityOptions.js'
