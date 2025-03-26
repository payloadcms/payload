import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type { UpdateMany } from 'payload'

import toSnakeCase from 'to-snake-case'

import type { ChainedMethods, DrizzleAdapter } from './types.js'

import { chainMethods } from './find/chainMethods.js'
import buildQuery from './queries/buildQuery.js'
import { selectDistinct } from './queries/selectDistinct.js'
import { upsertRow } from './upsertRow/index.js'
import { getTransaction } from './utilities/getTransaction.js'

export const updateMany: UpdateMany = async function updateMany(
  this: DrizzleAdapter,
  {
    collection: collectionSlug,
    data,
    joins: joinQuery,
    limit,
    locale,
    req,
    returning,
    select,
    sort: sortArg,
    where: whereToUse,
  },
) {
  const db = await getTransaction(this, req)
  const collection = this.payload.collections[collectionSlug].config
  const tableName = this.tableNameMap.get(toSnakeCase(collection.slug))

  const sort = sortArg !== undefined && sortArg !== null ? sortArg : collection.defaultSort

  const { joins, orderBy, selectFields, where } = buildQuery({
    adapter: this,
    fields: collection.flattenedFields,
    locale,
    sort,
    tableName,
    where: whereToUse,
  })

  let idsToUpdate: (number | string)[] = []

  const selectDistinctResult = await selectDistinct({
    adapter: this,
    chainedMethods: orderBy
      ? [
          {
            args: [() => orderBy.map(({ column, order }) => order(column))],
            method: 'orderBy',
          },
        ]
      : [],
    db,
    joins,
    selectFields,
    tableName,
    where,
  })

  if (selectDistinctResult?.[0]?.id) {
    idsToUpdate = selectDistinctResult?.map((doc) => doc.id)
  } else if (whereToUse && !joins.length) {
    // If id wasn't passed but `where` without any joins, retrieve it with findFirst

    const _db = db as LibSQLDatabase

    const table = this.tables[tableName]

    const query = _db.select({ id: table.id }).from(table).where(where)

    const chainedMethods: ChainedMethods = []

    if (typeof limit === 'number' && limit > 0) {
      chainedMethods.push({
        args: [limit],
        method: 'limit',
      })
    }

    if (orderBy) {
      chainedMethods.push({
        args: [() => orderBy.map(({ column, order }) => order(column))],
        method: 'orderBy',
      })
    }

    const docsToUpdate = await chainMethods({
      methods: chainedMethods,
      query,
    })

    idsToUpdate = docsToUpdate?.map((doc) => doc.id)
  }

  if (!idsToUpdate.length) {
    return []
  }

  const results = []

  // TODO: We need to batch this to reduce the amount of db calls. This can get very slow if we are updating a lot of rows.
  for (const idToUpdate of idsToUpdate) {
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
    results.push(result)
  }

  if (returning === false) {
    return null
  }

  return results
}
