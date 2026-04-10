import type { Find, SanitizedCollectionConfig } from 'payload'

import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { findMany } from './find/findMany.js'

export const find: Find = async function find(
  this: DrizzleAdapter,
  {
    collection,
    draftsEnabled,
    joins,
    limit,
    locale,
    page = 1,
    pagination,
    req,
    select,
    sort: sortArg,
    where,
  },
) {
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config
  const sort = sortArg !== undefined && sortArg !== null ? sortArg : collectionConfig.defaultSort

  const tableName = this.tableNameMap.get(toSnakeCase(collectionConfig.slug))

  return findMany({
    adapter: this,
    collectionSlug: collectionConfig.slug,
    draftsEnabled,
    fields: collectionConfig.flattenedFields,
    joins,
    limit,
    locale,
    page,
    pagination,
    req,
    select,
    sort,
    tableName,
    where,
  })
}
