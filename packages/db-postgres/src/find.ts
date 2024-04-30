import type { Find } from 'payload/database'
import type { PayloadRequestWithData, SanitizedCollectionConfig } from 'payload/types'

import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from './types.js'

import { findMany } from './find/findMany.js'

export const find: Find = async function find(
  this: PostgresAdapter,
  {
    collection,
    limit,
    locale,
    page = 1,
    pagination,
    req = {} as PayloadRequestWithData,
    select,
    sort: sortArg,
    where,
  },
) {
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config
  const sort = typeof sortArg === 'string' ? sortArg : collectionConfig.defaultSort

  const tableName = this.tableNameMap.get(toSnakeCase(collectionConfig.slug))

  return findMany({
    adapter: this,
    fields: collectionConfig.fields,
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
