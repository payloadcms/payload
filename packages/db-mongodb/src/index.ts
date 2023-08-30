import type { ClientSession, ConnectOptions, Connection } from 'mongoose'
import type { Payload } from 'payload'
import type { DatabaseAdapter } from 'payload/database'

import mongoose from 'mongoose'
import { createDatabaseAdapter } from 'payload/database'
import { createMigration } from 'payload/database'

import type { CollectionModel, GlobalModel } from './types.js'

import { connect } from './connect.js'
import { create } from './create.js'
import { createGlobal } from './createGlobal.js'
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
import { queryDrafts } from './queryDrafts.js'
import { beginTransaction } from './transactions/beginTransaction.js'
import { commitTransaction } from './transactions/commitTransaction.js'
import { rollbackTransaction } from './transactions/rollbackTransaction.js'
import { updateGlobal } from './updateGlobal.js'
import { updateOne } from './updateOne.js'
import { updateVersion } from './updateVersion.js'
import { webpack } from './webpack.js'

export interface Args {
  /** Set to false to disable auto-pluralization of collection names, Defaults to true */
  autoPluralization?: boolean
  /** Extra configuration options */
  connectOptions?: ConnectOptions & {
    /** Set false to disable $facet aggregation in non-supporting databases, Defaults to true */
    useFacet?: boolean
  }
  migrationDir?: string
  /** The URL to connect to MongoDB or false to start payload and prevent connecting */
  url: false | string
}

export type MongooseAdapter = DatabaseAdapter &
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

export function mongooseAdapter({
  autoPluralization = true,
  connectOptions,
  migrationDir,
  url,
}: Args): MongooseAdapterResult {
  function adapter({ payload }: { payload: Payload }) {
    mongoose.set('strictQuery', false)

    return createDatabaseAdapter<MongooseAdapter>({
      autoPluralization,
      beginTransaction,
      collections: {},
      commitTransaction,
      connect,
      connectOptions: connectOptions || {},
      connection: undefined,
      create,
      createGlobal,
      createMigration,
      createVersion,
      deleteMany,
      deleteOne,
      deleteVersions,
      destroy,
      find,
      findGlobal,
      findGlobalVersions,
      findOne,
      findVersions,
      globals: undefined,
      init,
      migrationDir,
      mongoMemoryServer: undefined,
      payload,
      queryDrafts,
      rollbackTransaction,
      sessions: {},
      updateGlobal,
      updateOne,
      updateVersion,
      url,
      versions: {},
      webpack,
    })
  }

  return adapter
}
