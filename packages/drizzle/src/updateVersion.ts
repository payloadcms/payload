import type {
  PayloadRequest,
  SanitizedCollectionConfig,
  TypeWithID,
  TypeWithVersion,
  UpdateVersionArgs,
} from 'payload'

import { buildVersionCollectionFields } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import buildQuery from './queries/buildQuery.js'
import { upsertRow } from './upsertRow/index.js'

export async function updateVersion<T extends TypeWithID>(
  this: DrizzleAdapter,
  {
    id,
    collection,
    locale,
    req = {} as PayloadRequest,
    versionData,
    where: whereArg,
  }: UpdateVersionArgs<T>,
) {
  const db = this.sessions[await req?.transactionID]?.db || this.drizzle
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config
  const whereToUse = whereArg || { id: { equals: id } }
  const tableName = this.tableNameMap.get(
    `_${toSnakeCase(collectionConfig.slug)}${this.versionsSuffix}`,
  )

  const fields = buildVersionCollectionFields(this.payload.config, collectionConfig)

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
    operation: 'update',
    req,
    tableName,
    where,
  })

  if ('createdAt' in result.version) {
    result.createdAt = result.version.createdAt as string
  }

  return result
}
