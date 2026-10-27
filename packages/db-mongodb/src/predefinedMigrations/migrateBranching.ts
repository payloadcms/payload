import type { ClientSession } from 'mongoose'
import type { Payload } from 'payload'

import { branchField, MAIN_BRANCH } from 'payload'

import type { MongooseAdapter } from '../index.js'
import type { CollectionModel, GlobalModel } from '../types.js'

type BranchingMigrationArgs = {
  payload: Payload
  session?: ClientSession
}

type SyncableModel = CollectionModel | GlobalModel

const legacyMainFilter = {
  $or: [{ [branchField]: { $exists: false } }, { [branchField]: null }],
}

/**
 * Backfills branch identity before replacing legacy indexes with the current schema indexes.
 *
 * Run this generated migration after enabling branching. Backfill errors stop the migration
 * before any indexes are removed, so uniqueness conflicts remain visible and recoverable.
 */
export const migrateBranching = async ({
  payload,
  session,
}: BranchingMigrationArgs): Promise<void> => {
  const branching = payload.config.branching

  if (!branching?.enabled) {
    payload.logger.info({ msg: 'Branching is not enabled, skipping branching migration' })
    return
  }

  const adapter = payload.db as MongooseAdapter
  const modelsToSync = new Set<SyncableModel>()
  const updateOptions = session ? { session } : {}

  payload.logger.info({ msg: 'Starting branching data and index migration' })

  for (const collectionSlug of branching.branchableCollections) {
    const collectionModel = adapter.collections[collectionSlug]
    const versionModel = adapter.versions[collectionSlug]

    if (!collectionModel) {
      throw new Error(`Could not find MongoDB model for branchable collection "${collectionSlug}".`)
    }

    await collectionModel.collection.updateMany(
      legacyMainFilter,
      { $set: { [branchField]: MAIN_BRANCH } },
      updateOptions,
    )
    modelsToSync.add(collectionModel)

    if (versionModel) {
      await versionModel.collection.updateMany(
        legacyMainFilter,
        { $set: { [branchField]: MAIN_BRANCH } },
        updateOptions,
      )
      modelsToSync.add(versionModel)
    }
  }

  if (branching.branchableGlobals.size) {
    await adapter.globals.collection.updateMany(
      {
        ...legacyMainFilter,
        globalType: { $in: Array.from(branching.branchableGlobals) },
      },
      { $set: { [branchField]: MAIN_BRANCH } },
      updateOptions,
    )
    modelsToSync.add(adapter.globals)

    for (const globalSlug of branching.branchableGlobals) {
      const versionModel = adapter.versions[globalSlug]

      if (versionModel) {
        await versionModel.collection.updateMany(
          legacyMainFilter,
          { $set: { [branchField]: MAIN_BRANCH } },
          updateOptions,
        )
        modelsToSync.add(versionModel)
      }
    }
  }

  for (const model of modelsToSync) {
    await model.syncIndexes()
  }

  payload.logger.info({ msg: 'Branching data and index migration completed successfully' })
}
