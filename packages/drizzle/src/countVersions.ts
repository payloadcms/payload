import type { CountVersions } from 'payload'

import { buildVersionCollectionFields } from 'payload'

import type { DrizzleAdapter } from './types.js'

import { buildQuery } from './queries/buildQuery.js'
import { getCollection } from './utilities/getEntity.js'
import { getTransaction } from './utilities/getTransaction.js'

export const countVersions: CountVersions = async function countVersions(
  this: DrizzleAdapter,
  { collection: collectionSlug, locale, req, where: whereArg = {} },
) {
  const { collectionConfig, tableName } = getCollection({
    adapter: this,
    collectionSlug,
    versions: true,
  })

  const db = await getTransaction(this, req)

  const fields = buildVersionCollectionFields(this.payload.config, collectionConfig, true)

  const { joins, where } = buildQuery({
    adapter: this,
    fields,
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
