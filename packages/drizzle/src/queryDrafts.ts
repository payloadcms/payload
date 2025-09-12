import type { QueryDrafts, SanitizedCollectionConfig } from 'payload'

import { buildVersionCollectionFields, combineQueries } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { findMany } from './find/findMany.js'

export const queryDrafts: QueryDrafts = async function queryDrafts(
  this: DrizzleAdapter,
  { collection, joins, limit, locale, page = 1, pagination, req, select, sort, where },
) {
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config
  const tableName = this.tableNameMap.get(
    `_${toSnakeCase(collectionConfig.slug)}${this.versionsSuffix}`,
  )
  const fields = buildVersionCollectionFields(this.payload.config, collectionConfig, true)

  const combinedWhere = combineQueries({ latest: { equals: true } }, where)

  const result = await findMany({
    adapter: this,
    collectionSlug: collection,
    fields,
    joins,
    limit,
    locale,
    page,
    pagination,
    req,
    select,
    sort,
    tableName,
    versions: true,
    where: combinedWhere,
  })

  for (let i = 0; i < result.docs.length; i++) {
    const id = result.docs[i].parent
    const localeStatus = result.docs[i].localeStatus || {}
    const localeUpdatedAt = result.docs[i].localeUpdatedAt || {}

    if (locale) {
      if (localeStatus[locale]) {
        result.docs[i].status = localeStatus[locale]
        result.docs[i].version._status = localeStatus[locale]
      }
      if (localeUpdatedAt[locale]) {
        result.docs[i].version.updatedAt = localeUpdatedAt[locale]
      }
    }

    result.docs[i] = result.docs[i].version ?? {}
    result.docs[i].id = id
  }

  return result
}
