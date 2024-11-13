import type { CountVersions, SanitizedCollectionConfig } from 'payload'

import { buildVersionCollectionFields } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import buildQuery from './queries/buildQuery.js'

export const countVersions: CountVersions = async function countVersions(
  this: DrizzleAdapter,
  { collection, locale, req, where: whereArg },
) {
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config

  const tableName = this.tableNameMap.get(
    `_${toSnakeCase(collectionConfig.slug)}${this.versionsSuffix}`,
  )

  const db = this.sessions[await req?.transactionID]?.db || this.drizzle

  const fields = buildVersionCollectionFields(this.payload.config, collectionConfig)

  const { joins, where } = buildQuery({
    adapter: this,
    fields,
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
