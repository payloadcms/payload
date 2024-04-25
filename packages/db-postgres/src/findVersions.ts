import type { FindVersions } from 'payload/database'
import type { PayloadRequest, SanitizedCollectionConfig } from 'payload/types'

import { buildVersionCollectionFields } from 'payload/versions'
import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from './types'

import { findMany } from './find/findMany'

export const findVersions: FindVersions = async function findVersions(
  this: PostgresAdapter,
  {
    collection,
    limit,
    locale,
    page,
    pagination,
    req = {} as PayloadRequest,
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
