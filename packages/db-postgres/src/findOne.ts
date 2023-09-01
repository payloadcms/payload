import type { FindOne } from 'payload/database'
import type { SanitizedCollectionConfig } from 'payload/types'
import type { PayloadRequest } from 'payload/types'

import toSnakeCase from 'to-snake-case'

import { buildFindManyArgs } from './find/buildFindManyArgs'
import buildQuery from './queries/buildQuery'
import { transform } from './transform/read'

export const findOne: FindOne = async function findOne({
  collection,
  locale,
  req = {} as PayloadRequest,
  where,
}) {
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config
  const tableName = toSnakeCase(collection)

  const query = await buildQuery({
    adapter: this,
    collectionSlug: collection,
    locale,
    where,
  })

  const findManyArgs = buildFindManyArgs({
    adapter: this,
    collection: collectionConfig,
    config: this.payload.config,
    depth: 0,
    fallbackLocale: req.fallbackLocale,
    locale: req.locale,
  })

  findManyArgs.where = query

  const doc = await this.db.query[tableName].findFirst(findManyArgs)

  const result = transform({
    config: this.payload.config,
    data: doc,
    fallbackLocale: req.fallbackLocale,
    fields: collectionConfig.fields,
    locale: req.locale,
  })

  return result
}
