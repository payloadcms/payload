import type { DeleteMany } from 'payload'

import { inArray } from 'drizzle-orm'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { findMany } from './find/findMany.js'
import { getTransaction } from './utilities/getTransaction.js'

export const deleteMany: DeleteMany = async function deleteMany(
  this: DrizzleAdapter,
  { collection, req, where },
) {
  const db = await getTransaction(this, req)
  const collectionConfig = this.payload.collections[collection].config

  const tableName = this.tableNameMap.get(toSnakeCase(collectionConfig.slug))

  const result = await findMany({
    adapter: this,
    fields: collectionConfig.flattenedFields,
    joins: false,
    limit: 0,
    locale: req?.locale,
    page: 1,
    pagination: false,
    req,
    tableName,
    where,
  })

  const ids = []

  result.docs.forEach((data) => {
    ids.push(data.id)
  })

  if (ids.length > 0) {
    await this.deleteWhere({
      db,
      tableName,
      where: inArray(this.tables[tableName].id, ids),
    })
  }
}
