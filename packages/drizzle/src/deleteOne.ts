import type { DeleteOne, SelectType } from 'payload'

import { eq } from 'drizzle-orm'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { buildQuery } from './queries/buildQuery.js'
import { transform } from './transform/read/index.js'
import { getTransaction } from './utilities/getTransaction.js'

export const deleteOne: DeleteOne = async function deleteOne(
  this: DrizzleAdapter,
  { collection: collectionSlug, req, returning, select: selectArg, where: whereArg },
) {
  const select: SelectType | undefined =
    returning === false
      ? {
          id: true,
        }
      : selectArg

  const db = await getTransaction(this, req)
  const collection = this.payload.collections[collectionSlug].config

  const tableName = this.tableNameMap.get(toSnakeCase(collection.slug))

  const { joins, where } = buildQuery({
    adapter: this,
    fields: collection.flattenedFields,
    locale: req?.locale,
    tableName,
    where: whereArg,
  })

  let whereToUse = where

  let docToDelete: Record<string, unknown> = null

  if (joins?.length || returning !== false) {
    // Difficult to support joins (through where referencing other tables) in this.deleteWhere of deleteOne. => 2 separate queries.
    // We can look into supporting this using one single query (through a subquery) in the future, though that's difficult to do in a generic way.
    docToDelete = await this.findOne({
      collection: collectionSlug,
      req,
      select,
      where: whereArg,
    })
    if (!docToDelete) {
      return null
    }

    whereToUse = eq(this.tables[tableName].id, docToDelete.id)
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
    where: whereToUse,
  })

  return result
}
