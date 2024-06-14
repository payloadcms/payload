import type { DeleteVersions, PayloadRequestWithData, SanitizedCollectionConfig } from 'payload'

import { inArray } from 'drizzle-orm'
import { buildVersionCollectionFields } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from './types.js'

import { findMany } from './find/findMany.js'

export const deleteVersions: DeleteVersions = async function deleteVersion(
  this: PostgresAdapter,
  { collection, locale, req = {} as PayloadRequestWithData, where: where },
) {
  const db = this.sessions[req.transactionID]?.db || this.drizzle
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config

  const tableName = this.tableNameMap.get(
    `_${toSnakeCase(collectionConfig.slug)}${this.versionsSuffix}`,
  )

  const fields = buildVersionCollectionFields(collectionConfig)

  const { docs } = await findMany({
    adapter: this,
    fields,
    limit: 0,
    locale,
    page: 1,
    pagination: false,
    req,
    tableName,
    where,
  })

  const ids = []

  docs.forEach((doc) => {
    ids.push(doc.id)
  })

  if (ids.length > 0) {
    await db.delete(this.tables[tableName]).where(inArray(this.tables[tableName].id, ids))
  }

  return docs
}
