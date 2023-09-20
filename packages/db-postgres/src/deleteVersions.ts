import type { DeleteVersions } from 'payload/database'
import type { PayloadRequest, SanitizedCollectionConfig } from 'payload/types'

import { inArray } from 'drizzle-orm'
import { buildVersionCollectionFields } from 'payload/versions'
import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from './types'

import { findMany } from './find/findMany'
import { transform } from './transform/read'

export const deleteVersions: DeleteVersions = async function deleteVersion(
  this: PostgresAdapter,
  { collection, locale, req = {} as PayloadRequest, where: where },
) {
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config

  const tableName = `_${toSnakeCase(collection)}_versions`
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

  const result = docs.map((data) => {
    ids.push(data.id)

    return transform({
      config: this.payload.config,
      data,
      fields: collectionConfig.fields,
    })
  })

  await this.db.delete(this.tables[tableName]).where(inArray(this.tables[tableName].id, ids))

  return result
}
