import type { UpdateOne } from 'payload/database'

import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from '../types'

import buildQuery from '../queries/buildQuery'
import { upsertRow } from '../upsertRow'

export const updateOne: UpdateOne = async function updateOne(
  this: PostgresAdapter,
  { id, collection: collectionSlug, data, draft, locale, req, where: whereArg },
) {
  const db = this.sessions[req.transactionID]?.db || this.db
  const collection = this.payload.collections[collectionSlug].config
  const tableName = toSnakeCase(collectionSlug)
  const whereToUse = whereArg || { id: { equals: id } }

  const { where } = await buildQuery({
    adapter: this,
    fields: collection.fields,
    locale,
    tableName,
    where: whereToUse,
  })

  const result = await upsertRow({
    id,
    adapter: this,
    data,
    db,
    fields: collection.fields,
    operation: 'update',
    tableName: toSnakeCase(collectionSlug),
    where,
  })

  return result
}
