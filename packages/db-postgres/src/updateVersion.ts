import type {
  PayloadRequestWithData,
  SanitizedCollectionConfig,
  TypeWithID,
  TypeWithVersion,
  UpdateVersionArgs,
} from 'payload'

import { buildVersionCollectionFields } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from './types.js'

import buildQuery from './queries/buildQuery.js'
import { upsertRow } from './upsertRow/index.js'

export async function updateVersion<T extends TypeWithID>(
  this: PostgresAdapter,
  {
    id,
    collection,
    locale,
    req = {} as PayloadRequestWithData,
    versionData,
    where: whereArg,
  }: UpdateVersionArgs<T>,
) {
  const db = this.sessions[req.transactionID]?.db || this.drizzle
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config
  const whereToUse = whereArg || { id: { equals: id } }
  const tableName = this.tableNameMap.get(
    `_${toSnakeCase(collectionConfig.slug)}${this.versionsSuffix}`,
  )

  const fields = buildVersionCollectionFields(collectionConfig)

  const { where } = await buildQuery({
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
    operation: 'update',
    req,
    tableName,
    where,
  })

  return result
}
