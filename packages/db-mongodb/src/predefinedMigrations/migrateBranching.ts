import type { ClientSession } from 'mongoose'
import type { Payload } from 'payload'

import { branchField, MAIN_BRANCH } from 'payload'

import type { MongooseAdapter } from '../index.js'
import type { CollectionModel, GlobalModel } from '../types.js'

import { getBranchingIndexReplacements } from './getBranchingIndexReplacements.js'

type BranchingMigrationArgs = {
  payload: Payload
  session?: ClientSession
}

type BranchingModel = CollectionModel | GlobalModel

const legacyMainFilter = {
  $or: [{ [branchField]: { $exists: false } }, { [branchField]: null }],
}

/**
 * Backfills branch identity before replacing legacy indexes with the current schema indexes.
 *
 * Run this generated migration after enabling branching. Backfill errors stop the migration
 * before any indexes are removed, so uniqueness conflicts remain visible and recoverable.
 * All schema indexes are created and awaited before any legacy unique constraints are removed.
 * Only recognized unscoped counterparts of configured branch-scoped unique indexes are dropped;
 * unrelated indexes and indexes with custom options are preserved.
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
  const models = new Set<BranchingModel>()
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
    models.add(collectionModel)

    if (versionModel) {
      await versionModel.collection.updateMany(
        legacyMainFilter,
        { $set: { [branchField]: MAIN_BRANCH } },
        updateOptions,
      )
      models.add(versionModel)
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
    models.add(adapter.globals)

    for (const globalSlug of branching.branchableGlobals) {
      const versionModel = adapter.versions[globalSlug]

      if (versionModel) {
        await versionModel.collection.updateMany(
          legacyMainFilter,
          { $set: { [branchField]: MAIN_BRANCH } },
          updateOptions,
        )
        models.add(versionModel)
      }
    }
  }

  // Build every replacement before removing any constraint, including across collections.
  // Do not rely on autoIndex: it can be disabled or have already run before the backfill.
  for (const model of models) {
    await model.createIndexes()
  }

  const replacements = []

  for (const collectionSlug of branching.branchableCollections) {
    const model = adapter.collections[collectionSlug]!

    replacements.push(
      ...(await getBranchingIndexReplacements({
        collection: payload.collections[collectionSlug]!.config,
        model,
        payload,
      })),
    )
  }

  for (const { indexName, model } of replacements) {
    payload.logger.info({
      msg: `Replacing legacy branching index "${indexName}" on "${model.collection.name}"`,
    })
    await model.collection.dropIndex(indexName)
  }

  payload.logger.info({ msg: 'Branching data and index migration completed successfully' })
}
