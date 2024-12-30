import type { UpdateOne } from 'payload'

import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { buildFindManyArgs } from './find/buildFindManyArgs.js'
import buildQuery from './queries/buildQuery.js'
import { selectDistinct } from './queries/selectDistinct.js'
import { upsertRow } from './upsertRow/index.js'
import { getTransaction } from './utilities/getTransaction.js'

export const updateOne: UpdateOne = async function updateOne(
  this: DrizzleAdapter,
  { id, collection: collectionSlug, data, joins: joinQuery, locale, req, select, where: whereArg },
) {
  const db = await getTransaction(this, req)
  const collection = this.payload.collections[collectionSlug].config
  const tableName = this.tableNameMap.get(toSnakeCase(collection.slug))
  const whereToUse = whereArg || { id: { equals: id } }
  let idToUpdate = id

  const { joins, selectFields, where } = buildQuery({
    adapter: this,
    fields: collection.flattenedFields,
    locale,
    tableName,
    where: whereToUse,
  })

  const selectDistinctResult = await selectDistinct({
    adapter: this,
    chainedMethods: [{ args: [1], method: 'limit' }],
    db,
    joins,
    selectFields,
    tableName,
    where,
  })

  if (selectDistinctResult?.[0]?.id) {
    idToUpdate = selectDistinctResult?.[0]?.id

    // If id wasn't passed but `where` without any joins, retrieve it with findFirst
  } else if (whereArg && !joins.length) {
    const findManyArgs = buildFindManyArgs({
      adapter: this,
      depth: 0,
      fields: collection.flattenedFields,
      joinQuery: false,
      select: {},
      tableName,
    })

    findManyArgs.where = where

    const docToUpdate = await db.query[tableName].findFirst(findManyArgs)
    idToUpdate = docToUpdate?.id
  }

  const result = await upsertRow({
    id: idToUpdate,
    adapter: this,
    data,
    db,
    fields: collection.flattenedFields,
    joinQuery,
    operation: 'update',
    req,
    select,
    tableName,
  })

  return result
}
