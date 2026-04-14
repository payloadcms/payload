import type { DeleteMany } from 'payload'

import { inArray } from 'drizzle-orm'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { findMany } from './find/findMany.js'
import { buildQuery } from './queries/buildQuery.js'
import { getTransaction } from './utilities/getTransaction.js'
import { markWrite } from './utilities/readAfterWrite.js'

export const deleteMany: DeleteMany = async function deleteMany(
  this: DrizzleAdapter,
  { collection, req, where: whereArg },
) {
  const collectionConfig = this.payload.collections[collection].config

  const tableName = this.tableNameMap.get(toSnakeCase(collectionConfig.slug))

  const table = this.tables[tableName]

  const { joins, where } = buildQuery({
    adapter: this,
    fields: collectionConfig.flattenedFields,
    locale: req?.locale,
    tableName,
    where: whereArg,
  })

  let whereToUse = where

  if (joins?.length) {
    // Difficult to support joins (through where referencing other tables) in deleteMany. => 2 separate queries.
    // We can look into supporting this using one single query (through a subquery) in the future, though that's difficult to do in a generic way.
    const result = await findMany({
      adapter: this,
      fields: collectionConfig.flattenedFields,
      joins: false,
      limit: 0,
      locale: req?.locale,
      page: 1,
      pagination: false,
      req,
      select: {
        id: true,
      },
      tableName,
      where: whereArg,
    })

    whereToUse = inArray(
      table.id,
      result.docs.map((doc) => doc.id),
    )
  }

  // No getPrimaryDb needed: db is only used for deleteWhere (a write, always routed to primary
  // by drizzle's withReplicas). findMany resolves its own db via getTransaction, which returns
  // the transaction db (always primary) or falls back to shouldReadFromPrimary.
  const db = await getTransaction(this, req)

  await this.deleteWhere({
    db,
    tableName,
    where: whereToUse,
  })

  markWrite(this)
}
