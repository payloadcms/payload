import type { DeleteVersions } from 'payload'

import { inArray } from 'drizzle-orm'
import { buildVersionCollectionFields } from 'payload'

import type { DrizzleAdapter } from './types.js'

import { findMany } from './find/findMany.js'
import { getCollection } from './utilities/getEntity.js'
import { getTransaction } from './utilities/getTransaction.js'

export const deleteVersions: DeleteVersions = async function deleteVersion(
  this: DrizzleAdapter,
  { collection: collectionSlug, locale, req, where: where },
) {
  const db = await getTransaction(this, req)
  const { collectionConfig, tableName } = getCollection({
    adapter: this,
    collectionSlug,
    versions: true,
  })

  const fields = buildVersionCollectionFields(this.payload.config, collectionConfig, true)

  const { docs } = await findMany({
    adapter: this,
    fields,
    joins: false,
    limit: 0,
    locale,
    page: 1,
    pagination: false,
    req,
    tableName,
    where,
  })

  const ids: (number | string)[] = []

  docs.forEach((doc: any) => {
    ids.push(doc.id)
  })

  if (ids.length > 0) {
    await this.deleteWhere({
      db,
      tableName,
      where: inArray(this.tables[tableName].id, ids),
    })
  }

  return docs
}
