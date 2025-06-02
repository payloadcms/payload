import type { Count } from 'payload'

import type { DrizzleAdapter } from './types.js'

import { buildQuery } from './queries/buildQuery.js'
import { getCollection } from './utilities/getEntity.js'
import { getTransaction } from './utilities/getTransaction.js'

export const count: Count = async function count(
  this: DrizzleAdapter,
  { collection: collectionSlug, locale, req, where: whereArg = {} },
) {
  const { collectionConfig, tableName } = getCollection({ adapter: this, collectionSlug })

  const db = await getTransaction(this, req)

  const { joins, where } = buildQuery({
    adapter: this,
    fields: collectionConfig.flattenedFields,
    locale,
    tableName,
    where: whereArg,
  })

  const countResult = await this.countDistinct({
    db,
    joins,
    tableName,
    where,
  })

  return { totalDocs: countResult }
}
