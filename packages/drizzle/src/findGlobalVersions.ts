import type { FindGlobalVersions, SanitizedGlobalConfig } from 'payload'

import { buildVersionGlobalFields, resolveBranchGlobalVersionQuery } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { findMany } from './find/findMany.js'

export const findGlobalVersions: FindGlobalVersions = async function findGlobalVersions(
  this: DrizzleAdapter,
  { branch, global, limit, locale, page, pagination, req, select, sort: sortArg, where },
) {
  const globalConfig: SanitizedGlobalConfig = this.payload.globals.config.find(
    ({ slug }) => slug === global,
  )
  const sort = sortArg !== undefined && sortArg !== null ? sortArg : '-createdAt'

  const tableName = this.tableNameMap.get(
    `_${toSnakeCase(globalConfig.slug)}${this.versionsSuffix}`,
  )

  const fields = buildVersionGlobalFields(this.payload.config, globalConfig, true)

  return findMany({
    adapter: this,
    fields,
    limit,
    locale,
    page,
    pagination,
    req,
    select,
    sort,
    tableName,
    where: resolveBranchGlobalVersionQuery({ branch, globalSlug: global, req, where }),
  })
}
