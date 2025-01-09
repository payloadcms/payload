import type { FindVersions, SanitizedCollectionConfig } from 'payload'

import { buildVersionCollectionFields } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { findMany } from './find/findMany.js'

export const findVersions: FindVersions = async function findVersions(
  this: DrizzleAdapter,
  { collection, limit, locale, page, pagination, req, select, skip, sort: sortArg, where },
) {
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config
  const sort = sortArg !== undefined && sortArg !== null ? sortArg : collectionConfig.defaultSort

  const tableName = this.tableNameMap.get(
    `_${toSnakeCase(collectionConfig.slug)}${this.versionsSuffix}`,
  )

  const fields = buildVersionCollectionFields(this.payload.config, collectionConfig, true)

  return findMany({
    adapter: this,
    fields,
    joins: false,
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
