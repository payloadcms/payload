import type { CountGlobalVersions } from 'payload'

import { buildVersionGlobalFields } from 'payload'

import type { DrizzleAdapter } from './types.js'

import { buildQuery } from './queries/buildQuery.js'
import { getGlobal } from './utilities/getEntity.js'
import { getTransaction } from './utilities/getTransaction.js'

export const countGlobalVersions: CountGlobalVersions = async function countGlobalVersions(
  this: DrizzleAdapter,
  { global: globalSlug, locale, req, where: whereArg = {} },
) {
  const { globalConfig, tableName } = getGlobal({ adapter: this, globalSlug, versions: true })

  const db = await getTransaction(this, req)

  const fields = buildVersionGlobalFields(this.payload.config, globalConfig, true)

  const { joins, where } = buildQuery({
    adapter: this,
    fields,
    locale,
    tableName,
    where: whereArg,
  })

  const countResult = await this.countDistinct({
    db,
    joins,
    tableName,
    where,
  })

  return { totalDocs: countResult }
}
