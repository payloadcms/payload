import type { UpdateGlobalArgs } from 'payload'

import type { DrizzleAdapter } from './types.js'

import { upsertRow } from './upsertRow/index.js'
import { getGlobal, getTableQuery } from './utilities/getEntity.js'
import { getTransaction } from './utilities/getTransaction.js'

export async function updateGlobal<T extends Record<string, unknown>>(
  this: DrizzleAdapter,
  { slug: globalSlug, data, req, returning, select }: UpdateGlobalArgs,
): Promise<T> {
  const db = await getTransaction(this, req)
  const { globalConfig, tableName } = getGlobal({ adapter: this, globalSlug })
  const queryTable = getTableQuery({ adapter: this, tableName })
  const existingGlobal = await queryTable.findFirst({})

  const result = await upsertRow<{ globalType: string } & T>({
    ...(existingGlobal ? { id: existingGlobal.id, operation: 'update' } : { operation: 'create' }),
    adapter: this,
    data,
    db,
    fields: globalConfig.flattenedFields,
    ignoreResult: returning === false,
    req,
    select,
    tableName,
  })

  if (returning === false) {
    // @ts-expect-error dont want to change public api response type
    return null
  }

  result.globalType = globalSlug

  return result
}
