import type { SQL } from 'drizzle-orm'
import type { DeleteOne } from 'payload'

import { eq } from 'drizzle-orm'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter, TransactionPg, TransactionSQLite } from './types.js'

import { buildQuery } from './queries/buildQuery.js'
import { selectDistinct } from './queries/selectDistinct.js'
import { transform } from './transform/read/index.js'
import { getPrimaryDb } from './utilities/getPrimaryDb.js'
import { getTransaction } from './utilities/getTransaction.js'
import { markWrite } from './utilities/readAfterWrite.js'

export const deleteOne: DeleteOne = async function deleteOne(
  this: DrizzleAdapter,
  { collection: collectionSlug, req, returning, where: whereArg },
) {
  const collection = this.payload.collections[collectionSlug].config

  const tableName = this.tableNameMap.get(toSnakeCase(collection.slug))
  const table = this.tables[tableName]

  const { joins, selectFields, where } = buildQuery({
    adapter: this,
    fields: collection.flattenedFields,
    locale: req?.locale,
    tableName,
    where: whereArg,
  })

  const db = getPrimaryDb(this, await getTransaction(this, req))

  let whereToDelete: SQL = where

  if (joins?.length) {
    const selectDistinctResult = await selectDistinct({
      adapter: this,
      db,
      joins,
      query: ({ query }) => query.limit(1),
      selectFields,
      tableName,
      where,
    })

    if (!selectDistinctResult?.[0]?.id) {
      return null
    }

    whereToDelete = eq(table.id, selectDistinctResult[0].id)
  }

  if (returning === false) {
    await this.deleteWhere({
      db,
      tableName,
      where: whereToDelete,
    })

    markWrite(this)

    return null
  }

  let deletedRows: Record<string, unknown>[]

  if (this.name === 'postgres') {
    deletedRows = (await (db as TransactionPg)
      .delete(table)
      .where(whereToDelete)
      .returning()) as Record<string, unknown>[]
  } else {
    deletedRows = (await (db as TransactionSQLite)
      .delete(table)
      .where(whereToDelete)
      .returning()) as Record<string, unknown>[]
  }

  if (!deletedRows.length) {
    return null
  }

  markWrite(this)

  return transform({
    adapter: this,
    config: this.payload.config,
    data: deletedRows[0],
    fields: collection.flattenedFields,
    joinQuery: false,
    tableName,
  })
}
