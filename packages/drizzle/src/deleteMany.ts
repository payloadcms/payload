import type { DeleteMany } from 'payload'

import { type SQL } from 'drizzle-orm'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { buildQuery } from './queries/buildQuery.js'
import { parseParams } from './queries/parseParams.js'
import { getTransaction } from './utilities/getTransaction.js'

export const deleteMany: DeleteMany = async function deleteMany(
  this: DrizzleAdapter,
  { collection, req, where },
) {
  const db = await getTransaction(this, req)
  const collectionConfig = this.payload.collections[collection].config

  const tableName = this.tableNameMap.get(toSnakeCase(collectionConfig.slug))

  let whereSQL: SQL

  const bq = buildQuery({
    adapter: this,
    fields: collectionConfig.flattenedFields,
    locale: undefined,
    sort: undefined,
    tableName,
    where,
  })

  console.log('deleteMany', collection, where, '111bq', bq)

  if (where && Object.keys(where).length > 0) {
    whereSQL = parseParams({
      adapter: this,
      context: { sort: undefined },
      fields: collectionConfig.flattenedFields,
      joins: [],
      parentIsLocalized: false,
      selectFields: {},
      tableName,
      where,
    })
  }

  await this.deleteWhere({
    db,
    joins: bq.joins,
    tableName,
    where: whereSQL,
  })
}
