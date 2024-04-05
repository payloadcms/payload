import type { UpdateOne } from 'payload/database'

import type { PostgresAdapter } from './types.js'

import buildQuery from './queries/buildQuery.js'
import { selectDistinct } from './queries/selectDistinct.js'
import { getTableName } from './schema/getTableName.js'
import { upsertRow } from './upsertRow/index.js'

export const updateOne: UpdateOne = async function updateOne(
  this: PostgresAdapter,
  { id, collection: collectionSlug, data, draft, locale, req, where: whereArg },
) {
  const db = this.sessions[req.transactionID]?.db || this.drizzle
  const collection = this.payload.collections[collectionSlug].config
  const tableName = getTableName({
    adapter: this,
    config: collection,
  })
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
