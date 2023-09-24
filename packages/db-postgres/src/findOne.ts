import type { FindOneArgs } from 'payload/database'
import type { PayloadRequest, SanitizedCollectionConfig, TypeWithID } from 'payload/types'

import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from './types'

import { buildFindManyArgs } from './find/buildFindManyArgs'
import buildQuery from './queries/buildQuery'
import { transform } from './transform/read'

export async function findOne<T extends TypeWithID>(
  this: PostgresAdapter,
  { collection, locale, req = {} as PayloadRequest, where: incomingWhere }: FindOneArgs,
): Promise<T> {
  const db = this.sessions[req.transactionID] || this.db
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config
  const tableName = toSnakeCase(collection)

  const { where } = await buildQuery({
    adapter: this,
    fields: collectionConfig.fields,
    locale,
    tableName,
    where: incomingWhere,
  })

  const findManyArgs = buildFindManyArgs({
    adapter: this,
    depth: 0,
    fields: collectionConfig.fields,
    tableName,
  })

  findManyArgs.where = where

  const doc = await db.query[tableName].findFirst(findManyArgs)

  if (!doc) {
    return null
  }

  return transform<T>({
    config: this.payload.config,
    data: doc,
    fields: collectionConfig.fields,
  })
}
