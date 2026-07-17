import type { DeleteOne } from 'payload'

import { eq } from 'drizzle-orm'
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

  let docToDelete: Record<string, unknown>

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
    // Resolve the target id via a manual select so the relational fetch only filters by primary
    // key (RQB v2 aliases the base table, breaking raw SQL that references real table names).
    forceRun: true,
    joins,
    query: ({ query }) => query.limit(1),
    selectFields,
    tableName,
    where,
  })

  if (selectDistinctResult?.[0]?.id) {
    docToDelete = await db.query[tableName].findFirst({
      where: { RAW: (table) => eq(table.id, selectDistinctResult[0].id) },
    })
  } else if (!selectDistinctResult) {
    const findManyArgs = buildFindManyArgs({
      adapter: this,
      depth: 0,
      fields: collection.flattenedFields,
      joinQuery: false,
      select,
      tableName,
    })

    findManyArgs.where = { RAW: where }

    docToDelete = await db.query[tableName].findFirst(findManyArgs)
  }

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
