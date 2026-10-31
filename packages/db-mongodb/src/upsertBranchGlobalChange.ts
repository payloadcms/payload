import type { UpsertBranchGlobalChange } from 'payload'

import { branchChangesCollectionSlug } from 'payload'

import type { MongooseAdapter } from './index.js'

import { getSession } from './utilities/getSession.js'

export const upsertBranchGlobalChange: UpsertBranchGlobalChange =
  async function upsertBranchGlobalChange(this: MongooseAdapter, { branch, globalSlug, req }) {
    const Model = this.collections[branchChangesCollectionSlug]
    const now = new Date().toISOString()

    if (!Model) {
      throw new Error(`Collection model "${branchChangesCollectionSlug}" is not initialized.`)
    }

    await Model.updateOne(
      { branch, globalSlug },
      {
        $setOnInsert: {
          branch,
          createdAt: now,
          entityType: 'global',
          globalSlug,
          operation: 'update',
          updatedAt: now,
        },
      },
      { session: await getSession(this, req), timestamps: false, upsert: true },
    )
  }
