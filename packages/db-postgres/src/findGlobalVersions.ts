import type { FindGlobalVersions, PayloadRequestWithData, SanitizedGlobalConfig } from 'payload'

import { buildVersionGlobalFields } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from './types.js'

import { findMany } from './find/findMany.js'

export const findGlobalVersions: FindGlobalVersions = async function findGlobalVersions(
  this: PostgresAdapter,
  {
    global,
    limit,
    locale,
    page,
    pagination,
    req = {} as PayloadRequestWithData,
    skip,
    sort: sortArg,
    where,
  },
) {
  const globalConfig: SanitizedGlobalConfig = this.payload.globals.config.find(
    ({ slug }) => slug === global,
  )
  const sort = typeof sortArg === 'string' ? sortArg : '-createdAt'

  const tableName = this.tableNameMap.get(
    `_${toSnakeCase(globalConfig.slug)}${this.versionsSuffix}`,
  )

  const fields = buildVersionGlobalFields(globalConfig)

  return findMany({
    adapter: this,
    fields,
    limit,
    locale,
    page,
    pagination,
    req,
    skip,
    sort,
    tableName,
    where,
  })
}
