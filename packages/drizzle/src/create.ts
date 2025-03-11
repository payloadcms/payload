import type { Create } from 'payload'

import type { DrizzleAdapter } from './types.js'

import { upsertRow } from './upsertRow/index.js'
import { getCollection } from './utilities/getEntity.js'
import { getTransaction } from './utilities/getTransaction.js'

export const create: Create = async function create(
  this: DrizzleAdapter,
  { collection: collectionSlug, data, req, returning, select },
) {
  const db = await getTransaction(this, req)
  const { collectionConfig, tableName } = getCollection({ adapter: this, collectionSlug })

  const result = await upsertRow({
    adapter: this,
    data,
    db,
    fields: collectionConfig.flattenedFields,
    ignoreResult: returning === false,
    operation: 'create',
    req,
    select,
    tableName,
  })

  if (returning === false) {
    return null
  }

  return result
}
