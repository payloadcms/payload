import type { UpdateGlobalArgs } from 'payload'

import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { upsertRow } from './upsertRow/index.js'
import { getTransaction } from './utilities/getTransaction.js'

export async function updateGlobal<T extends Record<string, unknown>>(
  this: DrizzleAdapter,
  { slug, data, req, select, returning }: UpdateGlobalArgs,
): Promise<T> {
  const db = await getTransaction(this, req)
  const globalConfig = this.payload.globals.config.find((config) => config.slug === slug)
  const tableName = this.tableNameMap.get(toSnakeCase(globalConfig.slug))

  const existingGlobal = await db.query[tableName].findFirst({})

  const result = await upsertRow<{ globalType: string } & T>({
    ...(existingGlobal ? { id: existingGlobal.id, operation: 'update' } : { operation: 'create' }),
    adapter: this,
    data,
    db,
    fields: globalConfig.flattenedFields,
    req,
    select,
    tableName,
    ignoreResult: returning === false,
  })

  if (returning === false) {
    return null
  }

  result.globalType = slug

  return result
}
