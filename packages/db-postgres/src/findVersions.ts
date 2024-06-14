import type { FindVersions, PayloadRequestWithData, SanitizedCollectionConfig } from 'payload'

import { buildVersionCollectionFields } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from './types.js'

import { findMany } from './find/findMany.js'

export const findVersions: FindVersions = async function findVersions(
  this: PostgresAdapter,
  {
    collection,
    limit,
    locale,
    page,
    pagination,
    req = {} as PayloadRequestWithData,
    skip,
    sort: sortArg,
    where,
  },
) {
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config
  const sort = typeof sortArg === 'string' ? sortArg : collectionConfig.defaultSort

  const tableName = this.tableNameMap.get(
    `_${toSnakeCase(collectionConfig.slug)}${this.versionsSuffix}`,
  )

  const fields = buildVersionCollectionFields(collectionConfig)

  return findMany({
    adapter: this,
    fields,
    limit,
    locale,
    page,
    pagination,
    req,
    skip,
    sort,
    tableName,
    where,
  })
}
