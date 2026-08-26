import type { FindOneArgs, SanitizedCollectionConfig, TypeWithID } from 'payload'

import { applyBranchIDProjection, resolveBranchQuery, withBranchIDSelect } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { findMany } from './find/findMany.js'

export async function findOne<T extends TypeWithID>(
  this: DrizzleAdapter,
  { branch, collection, draftsEnabled, joins, locale, req, select, where }: FindOneArgs,
): Promise<null | T> {
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config

  const tableName = this.tableNameMap.get(toSnakeCase(collectionConfig.slug))

  const branchedWhere = await resolveBranchQuery({ branch, collectionSlug: collection, req, where })

  const { docs } = await findMany({
    adapter: this,
    collectionSlug: collection,
    draftsEnabled,
    fields: collectionConfig.flattenedFields,
    joins,
    limit: 1,
    locale,
    page: 1,
    pagination: false,
    req,
    select: withBranchIDSelect({ branch, collectionSlug: collection, req, select }),
    sort: undefined,
    tableName,
    where: branchedWhere,
  })

  applyBranchIDProjection({
    branch,
    collectionSlug: collection,
    docs: docs as Record<string, unknown>[],
    req,
  })

  return docs?.[0] || null
}
