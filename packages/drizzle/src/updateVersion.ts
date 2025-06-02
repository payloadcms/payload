import type { TypeWithID, TypeWithVersion, UpdateVersionArgs } from 'payload'

import { buildVersionCollectionFields } from 'payload'

import type { DrizzleAdapter } from './types.js'

import { buildQuery } from './queries/buildQuery.js'
import { upsertRow } from './upsertRow/index.js'
import { getCollection } from './utilities/getEntity.js'
import { getTransaction } from './utilities/getTransaction.js'

export async function updateVersion<T extends TypeWithID>(
  this: DrizzleAdapter,
  {
    id,
    collection: collectionSlug,
    locale,
    req,
    returning,
    select,
    versionData,
    where: whereArg,
  }: UpdateVersionArgs<T>,
) {
  const db = await getTransaction(this, req)
  const { collectionConfig, tableName } = getCollection({
    adapter: this,
    collectionSlug,
    versions: true,
  })
  const whereToUse = whereArg || { id: { equals: id } }

  const fields = buildVersionCollectionFields(this.payload.config, collectionConfig, true)

  const { where } = buildQuery({
    adapter: this,
    fields,
    locale,
    tableName,
    where: whereToUse,
  })

  const result = await upsertRow<TypeWithVersion<T>>({
    id,
    adapter: this,
    data: versionData,
    db,
    fields,
    ignoreResult: returning === false,
    joinQuery: false,
    operation: 'update',
    req,
    select,
    tableName,
    where,
  })

  if (returning === false) {
    return null
  }

  return result
}
