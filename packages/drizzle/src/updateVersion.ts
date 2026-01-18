import type {
  JsonObject,
  SanitizedCollectionConfig,
  TypeWithVersion,
  UpdateVersionArgs,
} from '@ruya.sa/payload'

import { buildVersionCollectionFields } from '@ruya.sa/payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { buildQuery } from './queries/buildQuery.js'
import { upsertRow } from './upsertRow/index.js'
import { getTransaction } from './utilities/getTransaction.js'

export async function updateVersion<T extends JsonObject = JsonObject>(
  this: DrizzleAdapter,
  {
    id,
    collection,
    locale,
    req,
    returning,
    select,
    versionData,
    where: whereArg,
  }: UpdateVersionArgs<T>,
): Promise<TypeWithVersion<T>> {
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config
  const whereToUse = whereArg || { id: { equals: id } }
  const tableName = this.tableNameMap.get(
    `_${toSnakeCase(collectionConfig.slug)}${this.versionsSuffix}`,
  )

  const fields = buildVersionCollectionFields(this.payload.config, collectionConfig, true)

  const { where } = buildQuery({
    adapter: this,
    fields,
    locale,
    tableName,
    where: whereToUse,
  })

  const db = await getTransaction(this, req)

  const result = await upsertRow<TypeWithVersion<T>>({
    id,
    adapter: this,
    collectionSlug: collection,
    data: versionData,
    db,
    fields,
    ignoreResult: returning === false,
    joinQuery: false,
    operation: 'update',
    req,
    select,
    tableName,
    where,
  })

  if (returning === false) {
    return null
  }

  return result
}
