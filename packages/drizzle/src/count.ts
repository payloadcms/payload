import type { Count, SanitizedCollectionConfig } from 'payload'

import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import buildQuery from './queries/buildQuery.js'

export const count: Count = async function count(
  this: DrizzleAdapter,
  { collection, locale, req, where: whereArg },
) {
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config

  const tableName = this.tableNameMap.get(toSnakeCase(collectionConfig.slug))

  const db = this.sessions[await req?.transactionID]?.db || this.drizzle

  const { joins, where } = buildQuery({
    adapter: this,
    fields: collectionConfig.fields,
    locale,
    tableName,
    where: whereArg,
  })

  const countResult = await this.countDistinct({
    db,
    joins,
    tableName,
    where,
  })

  return { totalDocs: countResult }
}
