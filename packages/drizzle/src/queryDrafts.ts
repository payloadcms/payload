import type { QueryDrafts } from 'payload'

import { buildVersionCollectionFields, combineQueries } from 'payload'

import type { DrizzleAdapter } from './types.js'

import { findMany } from './find/findMany.js'
import { getCollection } from './utilities/getEntity.js'

export const queryDrafts: QueryDrafts = async function queryDrafts(
  this: DrizzleAdapter,
  {
    collection: collectionSlug,
    joins,
    limit,
    locale,
    page = 1,
    pagination,
    req,
    select,
    sort,
    where,
  },
) {
  const { collectionConfig, tableName } = getCollection({
    adapter: this,
    collectionSlug,
    versions: true,
  })
  const fields = buildVersionCollectionFields(this.payload.config, collectionConfig, true)

  const combinedWhere = combineQueries({ latest: { equals: true } }, where ?? {})

  const result = await findMany({
    adapter: this,
    collectionSlug,
    fields,
    joins,
    limit,
    locale,
    page,
    pagination,
    req,
    select,
    sort,
    tableName,
    versions: true,
    where: combinedWhere,
  })

  return {
    ...result,
    docs: result.docs.map((doc: any) => {
      doc = {
        id: doc.parent,
        ...doc.version,
      }

      return doc
    }),
  }
}
