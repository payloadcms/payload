import type { Find } from 'payload'

import type { DrizzleAdapter } from './types.js'

import { findMany } from './find/findMany.js'
import { getCollection } from './utilities/getEntity.js'

export const find: Find = async function find(
  this: DrizzleAdapter,
  {
    collection: collectionSlug,
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
  const { collectionConfig, tableName } = getCollection({ adapter: this, collectionSlug })
  const sort = sortArg !== undefined && sortArg !== null ? sortArg : collectionConfig.defaultSort

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
