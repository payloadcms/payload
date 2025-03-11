import type { DeleteMany } from 'payload'

import { inArray } from 'drizzle-orm'

import type { DrizzleAdapter } from './types.js'

import { findMany } from './find/findMany.js'
import { getCollection } from './utilities/getEntity.js'
import { getTransaction } from './utilities/getTransaction.js'

export const deleteMany: DeleteMany = async function deleteMany(
  this: DrizzleAdapter,
  { collection: collectionSlug, req, where },
) {
  const db = await getTransaction(this, req)
  const { collectionConfig, tableName } = getCollection({ adapter: this, collectionSlug })

  const result = await findMany({
    adapter: this,
    fields: collectionConfig.flattenedFields,
    joins: false,
    limit: 0,
    locale: req?.locale ?? undefined,
    page: 1,
    pagination: false,
    req,
    tableName,
    where,
  })

  const ids: (number | string)[] = []

  result.docs.forEach((data: any) => {
    ids.push(data.id)
  })

  if (ids.length > 0) {
    await this.deleteWhere({
      db,
      tableName,
      where: inArray(this.tables[tableName].id, ids),
    })
  }
}
