import type { Create } from 'payload/database'

import type { PostgresAdapter } from './types'

import { getTableName } from './schema/getTableName'
import { upsertRow } from './upsertRow'

export const create: Create = async function create(
  this: PostgresAdapter,
  { collection: collectionSlug, data, req },
) {
  const db = this.sessions[req.transactionID]?.db || this.drizzle
  const collection = this.payload.collections[collectionSlug].config

  const result = await upsertRow({
    adapter: this,
    data,
    db,
    fields: collection.fields,
    operation: 'create',
    req,
    tableName: getTableName({
      adapter: this,
      config: collection,
    }),
  })

  return result
}
