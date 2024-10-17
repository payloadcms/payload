import type { Create } from 'payload'

import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { upsertRow } from './upsertRow/index.js'

export const create: Create = async function create(
  this: DrizzleAdapter,
  { collection: collectionSlug, data, req, select },
) {
  const db = this.sessions[await req?.transactionID]?.db || this.drizzle
  const collection = this.payload.collections[collectionSlug].config

  const tableName = this.tableNameMap.get(toSnakeCase(collection.slug))

  const result = await upsertRow({
    adapter: this,
    data,
    db,
    fields: collection.fields,
    operation: 'create',
    req,
    select,
    tableName,
  })

  return result
}
