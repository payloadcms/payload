import type { UpdateGlobalArgs } from 'payload'

import { recordBranchGlobalChange, resolveBranchGlobalWrite } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { upsertRow } from './upsertRow/index.js'
import { getPrimaryDb } from './utilities/getPrimaryDb.js'
import { getTransaction } from './utilities/getTransaction.js'

export async function updateGlobal<T extends Record<string, unknown>>(
  this: DrizzleAdapter,
  { slug, branch, data, req, returning, select }: UpdateGlobalArgs,
): Promise<T> {
  const globalConfig = this.payload.globals.config.find((config) => config.slug === slug)
  const tableName = this.tableNameMap.get(toSnakeCase(globalConfig.slug))

  const db = getPrimaryDb(this, await getTransaction(this, req))

  const writeBranch = resolveBranchGlobalWrite({ branch, globalSlug: slug, req })

  // Each global has its own table holding one row per branch. On a branch the
  // write targets that branch's row, seeded from main's content the first time
  // the global is touched.
  const rows = await db.query[tableName].findMany({})
  const existingGlobal = writeBranch
    ? rows.find((row: Record<string, unknown>) => row._branch === writeBranch)
    : rows.find((row: Record<string, unknown>) => (row._branch ?? 'main') === 'main')

  const mainRow = rows.find((row: Record<string, unknown>) => (row._branch ?? 'main') === 'main')

  const dataToWrite =
    writeBranch && !existingGlobal
      ? { ...(mainRow ?? {}), ...data, id: undefined, _branch: writeBranch }
      : writeBranch
        ? { ...data, _branch: writeBranch }
        : data

  if (writeBranch) {
    await recordBranchGlobalChange({ branch: writeBranch, globalSlug: slug, req })
  }

  const result = await upsertRow<{ globalType: string } & T>({
    ...(existingGlobal ? { id: existingGlobal.id, operation: 'update' } : { operation: 'create' }),
    adapter: this,
    data: dataToWrite,
    db,
    fields: globalConfig.flattenedFields,
    globalSlug: slug,
    ignoreResult: returning === false,
    req,
    select,
    tableName,
  })

  if (returning === false) {
    return null
  }

  result.globalType = slug

  return result
}
