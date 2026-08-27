import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type { UpdateOne } from 'payload'

import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { buildQuery } from './queries/buildQuery.js'
import { selectDistinct } from './queries/selectDistinct.js'
import { transform } from './transform/read/index.js'
import { transformForWrite } from './transform/write/index.js'
import { upsertRow } from './upsertRow/index.js'
import { shouldUseOptimizedUpsertRow } from './upsertRow/shouldUseOptimizedUpsertRow.js'
import { getPrimaryDb } from './utilities/getPrimaryDb.js'
import { getTransaction } from './utilities/getTransaction.js'
import { markWrite } from './utilities/readAfterWrite.js'

export const updateOne: UpdateOne = async function updateOne(
  this: DrizzleAdapter,
  {
    id,
    collection: collectionSlug,
    data,
    joins: joinQuery,
    locale,
    options = { upsert: false },
    req,
    returning,
    select,
    where: whereArg,
  },
) {
  const collection = this.payload.collections[collectionSlug].config
  const tableName = this.tableNameMap.get(toSnakeCase(collection.slug))
  let idToUpdate = id

  const db = getPrimaryDb(this, await getTransaction(this, req))

  if (!idToUpdate) {
    const { joins, selectFields, where } = buildQuery({
      adapter: this,
      fields: collection.flattenedFields,
      locale,
      tableName,
      where: whereArg,
    })

    if (options.atomic === true) {
      if (!shouldUseOptimizedUpsertRow({ data, fields: collection.flattenedFields })) {
        throw new Error('Atomic where updates only support fields stored on the main table')
      }

      const { arraysToPush, row } = transformForWrite({
        adapter: this,
        data,
        enableAtomicWrites: true,
        fields: collection.flattenedFields,
        tableName,
      })

      if (arraysToPush && Object.keys(arraysToPush).length) {
        throw new Error('Atomic where updates do not support array operations')
      }

      markWrite(this)

      const docs = await (db as LibSQLDatabase)
        .update(this.tables[tableName])
        .set(row)
        .where(where)
        .returning()

      if (!docs[0]) {
        return null
      }

      return transform({
        adapter: this,
        config: this.payload.config,
        data: docs[0],
        fields: collection.flattenedFields,
        joinQuery: false,
        tableName,
      })
    }

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

  if (!idToUpdate && !options.upsert) {
    // TODO: In 4.0, if returning === false, we should differentiate between:
    // - No document found to update
    // - Document found, but returning === false
    return null
  }

  const result = await upsertRow({
    id: idToUpdate,
    adapter: this,
    collectionSlug,
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
