import type { CountVersions, SanitizedCollectionConfig } from 'payload'

import { buildVersionCollectionFields, resolveBranchVersionHistoryQuery } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { buildQuery } from './queries/buildQuery.js'
import { getTransaction } from './utilities/getTransaction.js'

export const countVersions: CountVersions = async function countVersions(
  this: DrizzleAdapter,
  { branch, collection, locale, req, where: whereArg },
) {
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config

  const tableName = this.tableNameMap.get(
    `_${toSnakeCase(collectionConfig.slug)}${this.versionsSuffix}`,
  )

  const fields = buildVersionCollectionFields(this.payload.config, collectionConfig, true)

  // Shares the list's predicate so the count in the Versions tab can never
  // disagree with the rows the Versions view actually renders.
  const branchedWhere = resolveBranchVersionHistoryQuery({
    branch,
    collectionSlug: collection,
    req,
    where: whereArg,
  })

  const { joins, where } = buildQuery({
    adapter: this,
    fields,
    locale,
    tableName,
    where: branchedWhere,
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
