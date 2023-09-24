import type { UpdateVersion } from 'payload/database'
import type { PayloadRequest, SanitizedCollectionConfig } from 'payload/types'

import { buildVersionCollectionFields } from 'payload/versions'
import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from './types'

import buildQuery from './queries/buildQuery'
import { upsertRow } from './upsertRow'

export const updateVersion: UpdateVersion = async function updateVersion(
  this: PostgresAdapter,
  { id, collection, locale, req = {} as PayloadRequest, versionData, where: whereArg },
) {
  const db = this.sessions[req.transactionID] || this.db
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config
  const whereToUse = whereArg || { id: { equals: id } }
  const tableName = `_${toSnakeCase(collection)}_v`
  const fields = buildVersionCollectionFields(collectionConfig)

  const { where } = await buildQuery({
    adapter: this,
    fields,
    locale,
    tableName,
    where: whereToUse,
  })

  const result = await upsertRow({
    id,
    adapter: this,
    data: versionData,
    db,
    fields,
    operation: 'update',
    tableName,
    where,
  })

  return result
}
