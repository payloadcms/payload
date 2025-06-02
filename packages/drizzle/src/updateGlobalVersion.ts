import type {
  SanitizedGlobalConfig,
  TypeWithID,
  TypeWithVersion,
  UpdateGlobalVersionArgs,
} from 'payload'

import { buildVersionGlobalFields } from 'payload'

import type { DrizzleAdapter } from './types.js'

import { buildQuery } from './queries/buildQuery.js'
import { upsertRow } from './upsertRow/index.js'
import { getGlobal } from './utilities/getEntity.js'
import { getTransaction } from './utilities/getTransaction.js'

export async function updateGlobalVersion<T extends TypeWithID>(
  this: DrizzleAdapter,
  {
    id,
    global: globalSlug,
    locale,
    req,
    returning,
    select,
    versionData,
    where: whereArg,
  }: UpdateGlobalVersionArgs<T>,
) {
  const db = await getTransaction(this, req)
  const { globalConfig, tableName } = getGlobal({ adapter: this, globalSlug, versions: true })
  const whereToUse = whereArg || { id: { equals: id } }

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
    ignoreResult: returning === false,
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
