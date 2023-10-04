import type { DeleteMany } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import { inArray } from 'drizzle-orm'
import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from './types'

import { findMany } from './find/findMany'
import { transform } from './transform/read'

export const deleteMany: DeleteMany = async function deleteMany(
  this: PostgresAdapter,
  { collection, req = {} as PayloadRequest, where },
) {
  const db = this.sessions?.[req.transactionID] || this.db
  const collectionConfig = this.payload.collections[collection].config
  const tableName = toSnakeCase(collection)

  const { docs } = await findMany({
    adapter: this,
    fields: collectionConfig.fields,
    limit: 0,
    locale: req.locale,
    page: 1,
    pagination: false,
    req,
    tableName,
    where,
  })

  const ids = []

  const result = docs.map((data) => {
    ids.push(data.id)

    return transform({
      config: this.payload.config,
      data,
      fields: collectionConfig.fields,
    })
  })

  await db.delete(this.tables[tableName]).where(inArray(this.tables[tableName].id, ids))

  return result
}
