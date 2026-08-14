import type { DeleteBranchGlobal } from 'payload'

import { eq } from 'drizzle-orm'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { getTransaction } from './utilities/getTransaction.js'
import { markWrite } from './utilities/readAfterWrite.js'

/**
 * Drops a branch's copy of a global.
 *
 * Each global has its own table holding one row per branch, so this deletes by the branch
 * column. Main's row is the one where that column is null, and `branch` is always a real
 * branch by the time this is called, so main's row can never match.
 */
export const deleteBranchGlobal: DeleteBranchGlobal = async function deleteBranchGlobal(
  this: DrizzleAdapter,
  { branch, globalSlug, req },
) {
  const tableName = this.tableNameMap.get(toSnakeCase(globalSlug))
  const table = this.tables[tableName]

  // Absent when branching is off for this global, in which case there is no copy to drop.
  if (!table?._branch) {
    return
  }

  const db = await getTransaction(this, req)

  await this.deleteWhere({
    db,
    tableName,
    where: eq(table._branch, branch),
  })

  markWrite(this)
}
