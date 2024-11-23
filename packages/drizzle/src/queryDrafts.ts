import type { PayloadRequest, QueryDrafts, SanitizedCollectionConfig } from 'payload'

import { buildVersionCollectionFields, combineQueries } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { findMany } from './find/findMany.js'

export const queryDrafts: QueryDrafts = async function queryDrafts(
  this: DrizzleAdapter,
  {
    collection,
    joins,
    limit,
    locale,
    page = 1,
    pagination,
    req = {} as PayloadRequest,
    select,
    sort,
    where,
  },
) {
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config
  const tableName = this.tableNameMap.get(
    `_${toSnakeCase(collectionConfig.slug)}${this.versionsSuffix}`,
  )
  const fields = buildVersionCollectionFields(this.payload.config, collectionConfig)

  const combinedWhere = combineQueries({ latest: { equals: true } }, where)

  const result = await findMany({
    adapter: this,
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

  result.docs = result.docs.map((doc) => {
    doc = doc.version
    if (!doc.id) {
      doc.id = doc.parent
    }

    return doc
  })

  return result
}
