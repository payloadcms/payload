import type { DeleteOne } from 'payload'

import { eq, getColumnTable } from 'drizzle-orm'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { buildFindManyArgs } from './find/buildFindManyArgs.js'
import { buildQuery } from './queries/buildQuery.js'
import { selectDistinct } from './queries/selectDistinct.js'
import { transform } from './transform/read/index.js'
import { getPrimaryDb } from './utilities/getPrimaryDb.js'
import { getTransaction } from './utilities/getTransaction.js'
import { markWrite } from './utilities/readAfterWrite.js'

export const deleteOne: DeleteOne = async function deleteOne(
  this: DrizzleAdapter,
  { collection: collectionSlug, req, returning, select, where: whereArg },
) {
  const collection = this.payload.collections[collectionSlug].config

  const tableName = this.tableNameMap.get(toSnakeCase(collection.slug))

  const { joins, selectFields, where } = buildQuery({
    adapter: this,
    fields: collection.flattenedFields,
    locale: req?.locale,
    tableName,
    where: whereArg,
  })

  const db = getPrimaryDb(this, await getTransaction(this, req))

  const selectDistinctResult = await selectDistinct({
    adapter: this,
    db,
    joins,
    query: ({ query }) => query.limit(1),
    selectFields,
    tableName,
    where,
  })

  if (selectDistinctResult && selectDistinctResult.length === 0) {
    return null
  }

  const findManyArgs = buildFindManyArgs({
    adapter: this,
    depth: 0,
    fields: collection.flattenedFields,
    joinQuery: false,
    select,
    tableName,
  })

  if (selectDistinctResult) {
    findManyArgs.where = { RAW: (table) => eq(table.id, selectDistinctResult[0].id) }
  } else if (where) {
    findManyArgs.where = {
      RAW: (table) =>
        buildQuery({
          adapter: this,
          aliasTable: getColumnTable(table.id),
          fields: collection.flattenedFields,
          locale: req?.locale,
          tableName,
          where: whereArg,
        }).where,
    }
  }

  const docToDelete: Record<string, unknown> = await db.query[tableName].findFirst(findManyArgs)

  if (!docToDelete) {
    return null
  }

  const result =
    returning === false
      ? null
      : transform({
          adapter: this,
          config: this.payload.config,
          data: docToDelete,
          fields: collection.flattenedFields,
          joinQuery: false,
          tableName,
        })

  await this.deleteWhere({
    db,
    tableName,
    where: eq(this.tables[tableName].id, docToDelete.id),
  })

  markWrite(this)

  return result
}
