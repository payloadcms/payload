import type { FindOneArgs } from 'payload/database'
import type { PayloadRequest, SanitizedCollectionConfig, TypeWithID } from 'payload/types'

import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from './types'

import { findMany } from './find/findMany'

export async function findOne<T extends TypeWithID>(
  this: PostgresAdapter,
  { collection, depth, locale, req = {} as PayloadRequest, where: incomingWhere }: FindOneArgs,
): Promise<T> {
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config

  const { docs } = await findMany({
    adapter: this,
    depth,
    fields: collectionConfig.fields,
    limit: 1,
    locale,
    page: 1,
    pagination: false,
    req,
    sort: undefined,
    tableName: toSnakeCase(collection),
    where: incomingWhere,
  })

  return docs?.[0] || null
}
