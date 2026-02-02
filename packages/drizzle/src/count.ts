import type { Count, SanitizedCollectionConfig } from 'payload'

import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { buildQuery } from './queries/buildQuery.js'
import { getTransaction } from './utilities/getTransaction.js'

export const count: Count = async function count(
  this: DrizzleAdapter,
  { collection, locale, req, where: whereArg },
) {
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config

  const tableName = this.tableNameMap.get(toSnakeCase(collectionConfig.slug))

  const { joins, where } = buildQuery({
    adapter: this,
    fields: collectionConfig.flattenedFields,
    locale,
    tableName,
    where: whereArg,
  })

  const db = await getTransaction(this, req)

  const countResult = await this.countDistinct({
    db,
    joins,
    tableName,
    where,
  })

  return { totalDocs: countResult }
}
