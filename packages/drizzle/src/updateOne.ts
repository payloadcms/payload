import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type { UpdateOne } from 'payload'

import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import buildQuery from './queries/buildQuery.js'
import { selectDistinct } from './queries/selectDistinct.js'
import { upsertRow } from './upsertRow/index.js'
import { getTransaction } from './utilities/getTransaction.js'

export const updateOne: UpdateOne = async function updateOne(
  this: DrizzleAdapter,
  {
    id,
    collection: collectionSlug,
    data,
    joins: joinQuery,
    locale,
    req,
    returning,
    select,
    where: whereArg,
  },
) {
  const db = await getTransaction(this, req)
  const collection = this.payload.collections[collectionSlug].config
  const tableName = this.tableNameMap.get(toSnakeCase(collection.slug))
  let idToUpdate = id

  if (!idToUpdate) {
    const { joins, selectFields, where } = buildQuery({
      adapter: this,
      fields: collection.flattenedFields,
      locale,
      tableName,
      where: whereArg,
    })

    // selectDistinct will only return if there are joins
    const selectDistinctResult = await selectDistinct({
      adapter: this,
      db,
      joins,
      query: ({ query }) => query.limit(1),
      selectFields,
      tableName,
      where,
    })

    if (selectDistinctResult?.[0]?.id) {
      idToUpdate = selectDistinctResult?.[0]?.id
      // If id wasn't passed but `where` without any joins, retrieve it with findFirst
    } else if (whereArg && !joins.length) {
      const table = this.tables[tableName]

      const docsToUpdate = await (db as LibSQLDatabase)
        .select({
          id: table.id,
        })
        .from(table)
        .where(where)
        .limit(1)
      idToUpdate = docsToUpdate?.[0]?.id
    }
  }

  const result = await upsertRow({
    id: idToUpdate,
    adapter: this,
    data,
    db,
    fields: collection.flattenedFields,
    ignoreResult: returning === false,
    joinQuery,
    operation: 'update',
    req,
    select,
    tableName,
  })

  if (returning === false) {
    return null
  }

  return result
}
