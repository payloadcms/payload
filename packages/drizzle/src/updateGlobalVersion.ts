import type {
  PayloadRequest,
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

export async function updateGlobalVersion<T extends TypeWithID>(
  this: DrizzleAdapter,
  {
    id,
    global,
    locale,
    req = {} as PayloadRequest,
    versionData,
    where: whereArg,
  }: UpdateGlobalVersionArgs<T>,
) {
  const db = this.sessions[await req?.transactionID]?.db || this.drizzle
  const globalConfig: SanitizedGlobalConfig = this.payload.globals.config.find(
    ({ slug }) => slug === global,
  )
  const whereToUse = whereArg || { id: { equals: id } }

  const tableName = this.tableNameMap.get(
    `_${toSnakeCase(globalConfig.slug)}${this.versionsSuffix}`,
  )

  const fields = buildVersionGlobalFields(this.payload.config, globalConfig)

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
