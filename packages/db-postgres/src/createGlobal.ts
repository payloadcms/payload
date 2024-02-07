import type { CreateGlobalArgs } from 'payload/database'
import type { PayloadRequest, TypeWithID } from 'payload/types'

import type { PostgresAdapter } from './types'

import { getTableName } from './schema/getTableName'
import { upsertRow } from './upsertRow'

export async function createGlobal<T extends TypeWithID>(
  this: PostgresAdapter,
  { slug, data, req = {} as PayloadRequest }: CreateGlobalArgs,
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
    tableName: getTableName({
      adapter: this,
      config: globalConfig,
    }),
  })

  return result
}
