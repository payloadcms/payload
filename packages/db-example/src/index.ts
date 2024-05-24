import type { Payload } from 'payload'
import type { BaseDatabaseAdapter } from 'payload/database'

import { createDatabaseAdapter } from 'payload/database'

import { connect } from './connect'
import { count } from './count'
import { create } from './create'
import { createGlobal } from './createGlobal'
import { createGlobalVersion } from './createGlobalVersion'
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
import { queryDrafts } from './queryDrafts'
import { beginTransaction } from './transactions/beginTransaction'
import { commitTransaction } from './transactions/commitTransaction'
import { rollbackTransaction } from './transactions/rollbackTransaction'
import { updateGlobal } from './updateGlobal'
import { updateGlobalVersion } from './updateGlobalVersion'
import { updateOne } from './updateOne'
import { updateVersion } from './updateVersion'

/**
 * Configure any adapter-specific options here
 *
 * For example: connection options, transaction options, etc.
 */
export interface Args {
  url: string
}

/**
 * The exported adapter Type
 *
 * _Optionally_, expose any adapter-specific methods here. How much you expose here relies on your underlying implementation.
 */
export type ExampleAdapter = BaseDatabaseAdapter &
  Args & {
    /**
     * This will allow access to the underlying model via `payload.db.collections.<slug>.find()
     *
     * This optional
     */
    collections: {
      [slug: string]: unknown
    }

    /**
     * Access to underlying global model via `payload.db.globals`
     */
    globals: {
      [slug: string]: unknown
    }
  }

type ExampleAdapterResult = (args: { payload: Payload }) => ExampleAdapter

/**
 * This declaration injects the proper types for the DB Adapter into Payload when accessing the adapter in code
 *
 * Optional
 */
declare module 'payload' {
  export interface DatabaseAdapter extends BaseDatabaseAdapter {
    collections: {
      [slug: string]: unknown
    }
    globals: {
      [slug: string]: unknown
    }
    versions: {
      [slug: string]: unknown
    }
  }
}

export function exampleAdapter({ url }: Args): ExampleAdapterResult {
  function adapter({ payload }: { payload: Payload }) {
    return createDatabaseAdapter<ExampleAdapter>({
      name: 'example',

      // Example adapter-specific
      collections: {},
      count,
      globals: undefined,
      url,

      /**
       * Configure DatabaseAdapter
       *
       * Many of these are optional and will fallback on some default functionality if not defined.
       */
      beginTransaction,
      commitTransaction,
      connect,
      create,
      createGlobal,
      createGlobalVersion,
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
