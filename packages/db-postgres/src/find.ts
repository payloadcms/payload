import type { Find } from 'payload/database'
import type { PayloadRequest, SanitizedCollectionConfig } from 'payload/types'

import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from './types'

import { findMany } from './find/findMany'

export const find: Find = async function find(
  this: PostgresAdapter,
  {
    collection,
    limit: limitArg,
    locale,
    page = 1,
    pagination,
    req = {} as PayloadRequest,
    sort: sortArg,
    where: whereArg,
  },
) {
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config
  const sort = typeof sortArg === 'string' ? sortArg : collectionConfig.defaultSort

  return findMany({
    adapter: this,
    fields: collectionConfig.fields,
    limit: limitArg,
    locale,
    page,
    pagination,
    req,
    sort,
    tableName: toSnakeCase(collection),
    where: whereArg,
  });
}
