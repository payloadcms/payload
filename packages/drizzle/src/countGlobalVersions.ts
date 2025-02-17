import type { CountGlobalVersions, SanitizedGlobalConfig } from 'payload'

import { buildVersionGlobalFields } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import buildQuery from './queries/buildQuery.js'
import { getTransaction } from './utilities/getTransaction.js'

export const countGlobalVersions: CountGlobalVersions = async function countGlobalVersions(
  this: DrizzleAdapter,
  { global, locale, req, where: whereArg },
) {
  const globalConfig: SanitizedGlobalConfig = this.payload.globals.config.find(
    ({ slug }) => slug === global,
  )

  const tableName = this.tableNameMap.get(
    `_${toSnakeCase(globalConfig.slug)}${this.versionsSuffix}`,
  )

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
