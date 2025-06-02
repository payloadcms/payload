import type { FindVersions } from 'payload'

import { buildVersionCollectionFields } from 'payload'

import type { DrizzleAdapter } from './types.js'

import { findMany } from './find/findMany.js'
import { getCollection } from './utilities/getEntity.js'

export const findVersions: FindVersions = async function findVersions(
  this: DrizzleAdapter,
  {
    collection: collectionSlug,
    limit,
    locale,
    page,
    pagination,
    req,
    select,
    skip,
    sort: sortArg,
    where,
  },
) {
  const { collectionConfig, tableName } = getCollection({
    adapter: this,
    collectionSlug,
    versions: true,
  })
  const sort = sortArg !== undefined && sortArg !== null ? sortArg : collectionConfig.defaultSort

  const fields = buildVersionCollectionFields(this.payload.config, collectionConfig, true)

  return findMany({
    adapter: this,
    fields,
    joins: false,
    limit,
    locale,
    page,
    pagination,
    req,
    select,
    skip,
    sort,
    tableName,
    where,
  })
}
