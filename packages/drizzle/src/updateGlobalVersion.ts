import type {
  SanitizedGlobalConfig,
  TypeWithID,
  TypeWithVersion,
  UpdateGlobalVersionArgs,
} from 'payload'

import { buildVersionGlobalFields } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import buildQuery from './queries/buildQuery.js'
import { upsertRow } from './upsertRow/index.js'
import { getTransaction } from './utilities/getTransaction.js'

export async function updateGlobalVersion<T extends TypeWithID>(
  this: DrizzleAdapter,
  {
    id,
    global,
    locale,
    req,
    select,
    versionData,
    where: whereArg,
    returning,
  }: UpdateGlobalVersionArgs<T>,
) {
  const db = await getTransaction(this, req)
  const globalConfig: SanitizedGlobalConfig = this.payload.globals.config.find(
    ({ slug }) => slug === global,
  )
  const whereToUse = whereArg || { id: { equals: id } }

  const tableName = this.tableNameMap.get(
    `_${toSnakeCase(globalConfig.slug)}${this.versionsSuffix}`,
  )

  const fields = buildVersionGlobalFields(this.payload.config, globalConfig, true)

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
    select,
    tableName,
    where,
    ignoreResult: returning === false,
  })

  if (returning === false) {
    return null
  }

  return result
}
