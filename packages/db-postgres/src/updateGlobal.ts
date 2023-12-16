import type { UpdateGlobalArgs } from 'payload/database'
import type { PayloadRequest, TypeWithID } from 'payload/types'

import type { PostgresAdapter } from './types'

import { upsertRow } from './upsertRow'
import { getTableName } from './utilities/getTableName'

export async function updateGlobal<T extends TypeWithID>(
  this: PostgresAdapter,
  { data, req = {} as PayloadRequest, slug }: UpdateGlobalArgs,
): Promise<T> {
  const db = this.sessions[req.transactionID]?.db || this.drizzle
  const globalConfig = this.payload.globals.config.find((config) => config.slug === slug)
  const tableName = getTableName(globalConfig)

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
