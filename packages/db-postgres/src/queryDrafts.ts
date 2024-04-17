import type { PayloadRequest, SanitizedCollectionConfig } from 'payload/types'

import { type QueryDrafts, combineQueries } from 'payload/database'
import { buildVersionCollectionFields } from 'payload/versions'

import { findMany } from './find/findMany'
import { getTableName } from './schema/getTableName'

export const queryDrafts: QueryDrafts = async function queryDrafts({
  collection,
  limit,
  locale,
  page = 1,
  pagination,
  req = {} as PayloadRequest,
  sort,
  where,
}) {
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config
  const tableName = getTableName({
    adapter: this,
    config: collectionConfig,
    versions: true,
  })
  const fields = buildVersionCollectionFields(collectionConfig)

  const combinedWhere = combineQueries({ latest: { equals: true } }, where)

  const result = await findMany({
    adapter: this,
    fields,
    limit,
    locale,
    page,
    pagination,
    req,
    sort,
    tableName,
    where: combinedWhere,
  })

  return {
    ...result,
    docs: result.docs.map((doc) => {
      // eslint-disable-next-line no-param-reassign
      doc = {
        id: doc.parent,
        ...doc.version,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }

      return doc
    }),
  }
}
