import type { UpdateGlobalArgs } from 'payload'

import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { upsertRow } from './upsertRow/index.js'
import { getTransaction } from './utilities/getTransaction.js'

export async function updateGlobal<T extends Record<string, unknown>>(
  this: DrizzleAdapter,
  { slug, data, req, returning, select }: UpdateGlobalArgs,
): Promise<T> {
  const globalConfig = this.payload.globals.config.find((config) => config.slug === slug)
  const tableName = this.tableNameMap.get(toSnakeCase(globalConfig.slug))

  const db = await getTransaction(this, req)
  const existingGlobal = await db.query[tableName].findFirst({})

  const result = await upsertRow<{ globalType: string } & T>({
    ...(existingGlobal ? { id: existingGlobal.id, operation: 'update' } : { operation: 'create' }),
    adapter: this,
    data,
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
