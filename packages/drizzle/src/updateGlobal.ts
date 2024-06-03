import type { UpdateGlobalArgs } from 'payload/database'
import type { PayloadRequestWithData, TypeWithID } from 'payload/types'

import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { upsertRow } from './upsertRow/index.js'

export async function updateGlobal<T extends TypeWithID>(
  this: DrizzleAdapter,
  { slug, data, req = {} as PayloadRequestWithData }: UpdateGlobalArgs,
): Promise<T> {
  const db = this.sessions[req.transactionID].db
  const globalConfig = this.payload.globals.config.find((config) => config.slug === slug)
  const tableName = this.tableNameMap.get(toSnakeCase(globalConfig.slug))

  const existingGlobal = await db.query[tableName].findFirst({})

  const result = await upsertRow<T>({
    ...(existingGlobal ? { id: existingGlobal.id, operation: 'update' } : { operation: 'create' }),
    adapter: this,
    data,
    db,
    fields: globalConfig.fields,
    req,
    tableName,
  })

  return result
}
