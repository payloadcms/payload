import type {
  PayloadRequestWithData,
  SanitizedGlobalConfig,
  TypeWithID,
  TypeWithVersion,
  UpdateGlobalVersionArgs,
} from 'payload'

import { buildVersionGlobalFields } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from './types.js'

import buildQuery from './queries/buildQuery.js'
import { upsertRow } from './upsertRow/index.js'

export async function updateGlobalVersion<T extends TypeWithID>(
  this: PostgresAdapter,
  {
    id,
    global,
    locale,
    req = {} as PayloadRequestWithData,
    versionData,
    where: whereArg,
  }: UpdateGlobalVersionArgs<T>,
) {
  const db = this.sessions[req.transactionID]?.db || this.drizzle
  const globalConfig: SanitizedGlobalConfig = this.payload.globals.config.find(
    ({ slug }) => slug === global,
  )
  const whereToUse = whereArg || { id: { equals: id } }

  const tableName = this.tableNameMap.get(
    `_${toSnakeCase(globalConfig.slug)}${this.versionsSuffix}`,
  )

  const fields = buildVersionGlobalFields(globalConfig)

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
