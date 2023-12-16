import type { CreateGlobalArgs } from 'payload/database'
import type { PayloadRequest, TypeWithID } from 'payload/types'

import type { PostgresAdapter } from './types'

import { upsertRow } from './upsertRow'
import { getTableName } from './utilities/getTableName'

export async function createGlobal<T extends TypeWithID>(
  this: PostgresAdapter,
  { data, req = {} as PayloadRequest, slug }: CreateGlobalArgs,
): Promise<T> {
  const db = this.sessions[req.transactionID]?.db || this.drizzle
  const globalConfig = this.payload.globals.config.find((config) => config.slug === slug)

  const result = await upsertRow<T>({
    adapter: this,
    data,
    db,
    fields: globalConfig.fields,
    operation: 'create',
    req,
    tableName: getTableName(globalConfig),
  })

  return result
}
