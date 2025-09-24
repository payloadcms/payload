import type { FindOneArgs, SanitizedCollectionConfig, TypeWithID } from 'payload'

import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { findMany } from './find/findMany.js'

export async function findOne<T extends TypeWithID>(
  this: DrizzleAdapter,
  { collection, draftsEnabled, joins, locale, req, select, where }: FindOneArgs,
): Promise<T> {
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config

  const tableName = this.tableNameMap.get(toSnakeCase(collectionConfig.slug))

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
    select,
    sort: undefined,
    tableName,
    where,
  })

  return docs?.[0] || null
}
