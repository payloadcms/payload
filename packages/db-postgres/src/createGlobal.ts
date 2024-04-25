import type { CreateGlobalArgs } from 'payload/database'
import type { PayloadRequestWithData, TypeWithID } from 'payload/types'

import type { PostgresAdapter } from './types.js'

import { getTableName } from './schema/getTableName.js'
import { upsertRow } from './upsertRow/index.js'

export async function createGlobal<T extends TypeWithID>(
  this: PostgresAdapter,
  { slug, data, req = {} as PayloadRequestWithData }: CreateGlobalArgs,
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
