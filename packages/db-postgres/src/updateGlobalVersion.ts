import type { TypeWithVersion } from 'payload/database'
import type { UpdateGlobalVersionArgs } from 'payload/database'
import type { PayloadRequest, SanitizedGlobalConfig, TypeWithID } from 'payload/types'

import { buildVersionGlobalFields } from 'payload/versions'
import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from './types'

import buildQuery from './queries/buildQuery'
import { upsertRow } from './upsertRow'

export async function updateGlobalVersion<T extends TypeWithID>(
  this: PostgresAdapter,
  {
    id,
    global,
    locale,
    req = {} as PayloadRequest,
    versionData,
    where: whereArg,
  }: UpdateGlobalVersionArgs<T>,
) {
  const db = this.sessions[req.transactionID] || this.db
  const globalConfig: SanitizedGlobalConfig = this.payload.globals.config.find(
    ({ slug }) => slug === global,
  )
  const whereToUse = whereArg || { id: { equals: id } }
  const tableName = `_${toSnakeCase(global)}_v`
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
    tableName,
    where,
  })

  return result
}
