import type { CreateGlobalArgs } from 'payload'

import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { upsertRow } from './upsertRow/index.js'
import { getTransaction } from './utilities/getTransaction.js'

export async function createGlobal<T extends Record<string, unknown>>(
  this: DrizzleAdapter,
  { slug, data, req, returning }: CreateGlobalArgs,
): Promise<T> {
  const db = await getTransaction(this, req)
  const globalConfig = this.payload.globals.config.find((config) => config.slug === slug)

  const tableName = this.tableNameMap.get(toSnakeCase(globalConfig.slug))

  data.createdAt = new Date().toISOString()

  const result = await upsertRow<{ globalType: string } & T>({
    adapter: this,
    data,
    db,
    fields: globalConfig.flattenedFields,
    operation: 'create',
    req,
    tableName,
    ignoreResult: returning === false,
  })

  if (returning === false) {
    return null
  }

  result.globalType = slug

  return result
}
