import type { FindOneArgs, TypeWithID } from 'payload'

import type { DrizzleAdapter } from './types.js'

import { findMany } from './find/findMany.js'
import { getCollection } from './utilities/getEntity.js'

export async function findOne<T extends TypeWithID>(
  this: DrizzleAdapter,
  { collection: collectionSlug, draftsEnabled, joins, locale, req, select, where }: FindOneArgs,
): Promise<T> {
  const { collectionConfig, tableName } = getCollection({ adapter: this, collectionSlug })

  const { docs } = await findMany({
    adapter: this,
    collectionSlug,
    draftsEnabled,
    fields: collectionConfig.flattenedFields,
    joins,
    limit: 1,
    locale,
    page: 1,
    pagination: false,
    req,
    select,
    sort: undefined,
    tableName,
    where,
  })

  return docs?.[0] || null
}
