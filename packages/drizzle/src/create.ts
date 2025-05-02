import type { Create } from 'payload'

import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { upsertRow } from './upsertRow/index.js'
import { getTransaction } from './utilities/getTransaction.js'

export const create: Create = async function create(
  this: DrizzleAdapter,
  { collection: collectionSlug, data, req, returning, select },
) {
  const db = await getTransaction(this, req)
  const collection = this.payload.collections[collectionSlug].config

  const tableName = this.tableNameMap.get(toSnakeCase(collection.slug))

  const result = await upsertRow({
    adapter: this,
    data,
    db,
    fields: collection.flattenedFields,
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
