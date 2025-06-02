import type { FindGlobalVersions } from 'payload'

import { buildVersionGlobalFields } from 'payload'

import type { DrizzleAdapter } from './types.js'

import { findMany } from './find/findMany.js'
import { getGlobal } from './utilities/getEntity.js'

export const findGlobalVersions: FindGlobalVersions = async function findGlobalVersions(
  this: DrizzleAdapter,
  { global: globalSlug, limit, locale, page, pagination, req, select, skip, sort: sortArg, where },
) {
  const { globalConfig, tableName } = getGlobal({ adapter: this, globalSlug, versions: true })
  const sort = sortArg !== undefined && sortArg !== null ? sortArg : '-createdAt'

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
    skip,
    sort,
    tableName,
    where,
  })
}
