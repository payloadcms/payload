import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type { UpdateOne } from 'payload'

import { applyBranchIDProjection, resolveBranchRowID, withBranchIDSelect } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { buildQuery } from './queries/buildQuery.js'
import { selectDistinct } from './queries/selectDistinct.js'
import { upsertRow } from './upsertRow/index.js'
import { getPrimaryDb } from './utilities/getPrimaryDb.js'
import { getTransaction } from './utilities/getTransaction.js'

export const updateOne: UpdateOne = async function updateOne(
  this: DrizzleAdapter,
  {
    id,
    branch,
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
  let idToUpdate =
    id === undefined || id === null
      ? id
      : await resolveBranchRowID({ id, branch, collectionSlug, req })

  const db = getPrimaryDb(this, await getTransaction(this, req))

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
    select: withBranchIDSelect({ branch, collectionSlug, req, select }),
    tableName,
  })

  if (returning === false) {
    return null
  }

  // The row written on a branch is the shadow row, so the document it returns
  // carries that row's primary key rather than the document's canonical ID.
  applyBranchIDProjection({
    branch,
    collectionSlug,
    docs: [result as Record<string, unknown>],
    req,
  })

  return result
}
