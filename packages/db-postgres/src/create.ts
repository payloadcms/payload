import type { Create } from 'payload/database'

import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from './types.js'

import { upsertRow } from './upsertRow/index.js'
import { getTableName } from './utilities/getTableName.js'

export const create: Create = async function create(
  this: PostgresAdapter,
  { collection: collectionSlug, data, req },
) {
  const db = this.sessions[req.transactionID]?.db || this.drizzle
  const collection = this.payload.collections[collectionSlug].config

  const tableName = getTableName({
    adapter: this,
    defaultTableName: toSnakeCase(collection.slug),
  })

  const result = await upsertRow({
    adapter: this,
    data,
    db,
    fields: collection.fields,
    operation: 'create',
    req,
    tableName,
  })

  return result
}
