import type { CreateGlobalArgs } from 'payload'

import type { DrizzleAdapter } from './types.js'

import { upsertRow } from './upsertRow/index.js'
import { getGlobal } from './utilities/getEntity.js'
import { getTransaction } from './utilities/getTransaction.js'

export async function createGlobal<T extends Record<string, unknown>>(
  this: DrizzleAdapter,
  { slug: globalSlug, data, req, returning }: CreateGlobalArgs,
): Promise<T> {
  const db = await getTransaction(this, req)
  const { globalConfig, tableName } = getGlobal({ adapter: this, globalSlug })

  data.createdAt = new Date().toISOString()

  const result = await upsertRow<{ globalType: string } & T>({
    adapter: this,
    data,
    db,
    fields: globalConfig.flattenedFields,
    ignoreResult: returning === false,
    operation: 'create',
    req,
    tableName,
  })

  if (returning === false) {
    return null as unknown as T
  }

  result.globalType = globalSlug

  return result
}
