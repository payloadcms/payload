import type { UpdateOne } from 'payload/database'

import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from './types'

import buildQuery from './queries/buildQuery'
import { selectDistinct } from './queries/selectDistinct'
import { upsertRow } from './upsertRow'

export const updateOne: UpdateOne = async function updateOne(
  this: PostgresAdapter,
  { id, collection: collectionSlug, data, draft, locale, req, where: whereArg },
) {
  const db = this.sessions[await req.transactionID]?.db || this.drizzle
  const collection = this.payload.collections[collectionSlug].config
  const tableName = this.tableNameMap.get(toSnakeCase(collection.slug))
  const whereToUse = whereArg || { id: { equals: id } }
  let idToUpdate = id

  const { joinAliases, joins, selectFields, where } = await buildQuery({
    adapter: this,
    fields: collection.fields,
    locale,
    tableName,
    where: whereToUse,
  })

  const selectDistinctResult = await selectDistinct({
    adapter: this,
    chainedMethods: [{ args: [1], method: 'limit' }],
    db,
    joinAliases,
    joins,
    selectFields,
    tableName,
    where,
  })

  if (selectDistinctResult?.[0]?.id) {
    idToUpdate = selectDistinctResult?.[0]?.id
  }

  const result = await upsertRow({
    id: idToUpdate,
    adapter: this,
    data,
    db,
    fields: collection.fields,
    operation: 'update',
    req,
    tableName,
  })

  return result
}
