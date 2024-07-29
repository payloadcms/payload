import type { CollationOptions, TransactionOptions } from 'mongodb'
import type { ClientSession, ConnectOptions, Connection, SchemaOptions } from 'mongoose'
import type { Payload } from 'payload'
import type { BaseDatabaseAdapter } from 'payload/database'

import fs from 'fs'
import mongoose from 'mongoose'
import path from 'path'
import { createDatabaseAdapter } from 'payload/database'

import type { CollectionModel, GlobalModel } from './types'

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
import { migrateFresh } from './migrateFresh'
import { queryDrafts } from './queryDrafts'
import { beginTransaction } from './transactions/beginTransaction'
import { commitTransaction } from './transactions/commitTransaction'
import { rollbackTransaction } from './transactions/rollbackTransaction'
import { updateGlobal } from './updateGlobal'
import { updateGlobalVersion } from './updateGlobalVersion'
import { updateOne } from './updateOne'
import { updateVersion } from './updateVersion'

export type { MigrateDownArgs, MigrateUpArgs } from './types'

export interface Args {
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
  /** Define Mongoose options on a collection-by-collection basis.
   */
  collections?: {
    [slug: string]: {
      /** Define Mongoose schema options for a given collection.
       */
      schemaOptions?: SchemaOptions
    }
  }
  /** Extra configuration options */
  connectOptions?: ConnectOptions & {
    /** Set false to disable $facet aggregation in non-supporting databases, Defaults to true */
    useFacet?: boolean
  }

  /** Set to true to disable hinting to MongoDB to use 'id' as index. This is currently done when counting documents for pagination. Disabling this optimization might fix some problems with AWS DocumentDB. Defaults to false */
  disableIndexHints?: boolean
  /** Define Mongoose options for the globals collection.
   */
  globals?: {
    schemaOptions?: SchemaOptions
  }
  /** Set to false to disable the automatic JSON stringify/parse of data queried by MongoDB. For example, if you have data not tracked by Payload such as `Date` fields and similar, you can use this option to ensure that existing `Date` properties remain as `Date` and not strings. */
  jsonParse?: boolean
  migrationDir?: string
  /** Define default Mongoose schema options for all schemas created.
   */
  schemaOptions?: SchemaOptions
  transactionOptions?: TransactionOptions | false
  /** The URL to connect to MongoDB or false to start payload and prevent connecting */
  url: false | string
}

export type MongooseAdapter = BaseDatabaseAdapter &
  Args & {
    collectionOptions: {
      [slug: string]: {
        schemaOptions?: SchemaOptions
      }
    }
    collections: {
      [slug: string]: CollectionModel
    }
    connection: Connection
    globals: GlobalModel
    globalsOptions: {
      schemaOptions?: SchemaOptions
    }
    jsonParse: boolean
    mongoMemoryServer: any
    schemaOptions?: SchemaOptions
    sessions: Record<number | string, ClientSession>
    versions: {
      [slug: string]: CollectionModel
    }
  }

type MongooseAdapterResult = (args: { payload: Payload }) => MongooseAdapter

declare module 'payload' {
  export interface DatabaseAdapter
    extends Omit<BaseDatabaseAdapter, 'sessions'>,
      Omit<Args, 'collections' | 'globals' | 'migrationDir'> {
    collectionOptions: {
      [slug: string]: {
        schemaOptions?: SchemaOptions
      }
    }
    collections: {
      [slug: string]: CollectionModel
    }
    connection: Connection
    globals: GlobalModel
    globalsOptions: {
      schemaOptions?: SchemaOptions
    }
    jsonParse: boolean
    mongoMemoryServer: any
    schemaOptions?: SchemaOptions

    sessions: Record<number | string, ClientSession>
    transactionOptions: TransactionOptions
    versions: {
      [slug: string]: CollectionModel
    }
  }
}

export function mongooseAdapter({
  autoPluralization = true,
  collections,
  connectOptions,
  disableIndexHints = false,
  globals,
  jsonParse = true,
  migrationDir: migrationDirArg,
  schemaOptions,
  transactionOptions = {},
  url,
}: Args): MongooseAdapterResult {
  function adapter({ payload }: { payload: Payload }) {
    const migrationDir = findMigrationDir(migrationDirArg)
    mongoose.set('strictQuery', false)

    return createDatabaseAdapter<MongooseAdapter>({
      name: 'mongoose',

      // Mongoose-specific
      autoPluralization,
      collectionOptions: collections || {},
      collections: {},
      connectOptions: connectOptions || {},
      connection: undefined,
      count,
      disableIndexHints,
      globals: undefined,
      globalsOptions: globals || {},
      jsonParse,
      mongoMemoryServer: undefined,
      schemaOptions: schemaOptions || {},
      sessions: {},
      transactionOptions: transactionOptions === false ? undefined : transactionOptions,
      url,
      versions: {},

      // DatabaseAdapter
      beginTransaction: transactionOptions ? beginTransaction : undefined,
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
