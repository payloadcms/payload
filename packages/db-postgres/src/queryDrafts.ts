import type { QueryDrafts } from 'payload/database'
import type { PayloadRequest, SanitizedCollectionConfig } from 'payload/types'

import { sql } from 'drizzle-orm'
import { buildVersionCollectionFields } from 'payload/versions'
import toSnakeCase from 'to-snake-case'

import { buildFindManyArgs } from './find/buildFindManyArgs'
import buildQuery from './queries/buildQuery'
import { transform } from './transform/read'

export const queryDrafts: QueryDrafts = async function queryDrafts({
  collection,
  limit: limitArg,
  locale,
  page = 1,
  pagination,
  req = {} as PayloadRequest,
  sort: sortArg,
  where: whereArg,
}) {
  const db = this.sessions?.[req.transactionID] || this.db
  const collectionConfig: SanitizedCollectionConfig = this.payload.collections[collection].config
  const tableName = toSnakeCase(collection)
  const versionsTableName = `_${tableName}_versions`
  const table = this.tables[versionsTableName]
  const limit =
    typeof limitArg === 'number' ? limitArg : collectionConfig.admin.pagination.defaultLimit
  // TODO: use sort
  const sort = typeof sortArg === 'string' ? sortArg : collectionConfig.defaultSort

  let totalDocs
  let totalPages
  let hasPrevPage
  let hasNextPage
  let pagingCounter

  const { where } = await buildQuery({
    adapter: this,
    fields: buildVersionCollectionFields(collectionConfig),
    locale,
    sort,
    tableName: versionsTableName,
    where: whereArg,
  })

  if (pagination !== false) {
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(table)
      .where(where)
    totalDocs = Number(countResult[0].count)
    totalPages = Math.ceil(totalDocs / limit)
    hasPrevPage = page > 1
    hasNextPage = totalPages > page
    pagingCounter = (page - 1) * limit + 1
  }

  const findManyArgs = buildFindManyArgs({
    adapter: this,
    depth: 0,
    fields: collectionConfig.fields,
    tableName,
  })

  findManyArgs.limit = limit === 0 ? undefined : limit
  findManyArgs.offset = (page - 1) * limit
  findManyArgs.where = where

  const rawDocs = await db.query[tableName].findMany(findManyArgs)

  const docs = rawDocs.map((data) => {
    return transform({
      config: this.payload.config,
      data,
      fields: collectionConfig.fields,
    })
  })

  return {
    docs, // : T[]
    hasNextPage, // : boolean
    hasPrevPage, // : boolean
    limit, // : number
    nextPage: hasNextPage ? page + 1 : null, // ?: number | null | undefined
    page, // ?: number
    pagingCounter, // : number
    prevPage: hasPrevPage ? page - 1 : null, // ?: number | null | undefined
    totalDocs, // : number
    totalPages, // : number
  }
}
