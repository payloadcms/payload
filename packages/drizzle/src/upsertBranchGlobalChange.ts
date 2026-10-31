import type { UpsertBranchGlobalChange } from 'payload'

import { branchChangesCollectionSlug } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { getPrimaryDb } from './utilities/getPrimaryDb.js'
import { getTransaction } from './utilities/getTransaction.js'
import { markWrite } from './utilities/readAfterWrite.js'

export const upsertBranchGlobalChange: UpsertBranchGlobalChange =
  async function upsertBranchGlobalChange(this: DrizzleAdapter, { branch, globalSlug, req }) {
    const tableName = this.tableNameMap.get(toSnakeCase(branchChangesCollectionSlug))
    const table = this.tables[tableName]
    const db = getPrimaryDb(this, await getTransaction(this, req))
    const now = new Date().toISOString()

    await this.insert({
      db,
      onConflictDoUpdate: {
        set: { globalSlug },
        target: [table.branch, table.globalSlug],
      },
      tableName,
      values: {
        branch,
        createdAt: now,
        entityType: 'global',
        globalSlug,
        operation: 'update',
        updatedAt: now,
      },
    })

    markWrite(this)
  }
