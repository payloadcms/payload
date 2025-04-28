import type { FindArgs, FlattenedField, TypeWithID } from 'payload'

import { inArray } from 'drizzle-orm'

import type { DrizzleAdapter } from '../types.js'

import buildQuery from '../queries/buildQuery.js'
import { selectDistinct } from '../queries/selectDistinct.js'
import { transform } from '../transform/read/index.js'
import { getTransaction } from '../utilities/getTransaction.js'
import { buildFindManyArgs } from './buildFindManyArgs.js'

type Args = {
  adapter: DrizzleAdapter
  collectionSlug?: string
  fields: FlattenedField[]
  tableName: string
  versions?: boolean
} & Omit<FindArgs, 'collection'>

export const findMany = async function find({
  adapter,
  collectionSlug,
  draftsEnabled,
  fields,
  joins: joinQuery,
  limit: limitArg,
  locale,
  page = 1,
  pagination,
  req,
  select,
  skip,
  sort,
  tableName,
  versions,
  where: whereArg,
}: Args) {
  const db = await getTransaction(adapter, req)
  let limit = limitArg
  let totalDocs: number
  let totalPages: number
  let hasPrevPage: boolean
  let hasNextPage: boolean
  let pagingCounter: number
  const offset = skip || (page - 1) * limit

  if (limit === 0) {
    limit = undefined
  }

  const { joins, orderBy, selectFields, where } = buildQuery({
    adapter,
    fields,
    locale,
    sort,
    tableName,
    where: whereArg,
  })

  const orderedIDMap: Record<number | string, number> = {}
  let orderedIDs: (number | string)[]

  const findManyArgs = buildFindManyArgs({
    adapter,
    collectionSlug,
    depth: 0,
    draftsEnabled,
    fields,
    joinQuery,
    joins,
    locale,
    select,
    tableName,
    versions,
  })
  const selectDistinctResult = await selectDistinct({
    adapter,
    db,
    joins,
    query: ({ query }) => {
      if (orderBy) {
        query = query.orderBy(() => orderBy.map(({ column, order }) => order(column)))
      }
      return query.offset(offset).limit(limit)
    },
    selectFields,
    tableName,
    where,
  })

  if (selectDistinctResult) {
    if (selectDistinctResult.length === 0) {
      return {
        docs: [],
        hasNextPage: false,
        hasPrevPage: false,
        limit,
        nextPage: null,
        page: 1,
        pagingCounter: 0,
        prevPage: null,
        totalDocs: 0,
        totalPages: 0,
      }
    } else {
      // set the id in an object for sorting later
      selectDistinctResult.forEach(({ id }, i) => {
        orderedIDMap[id] = i
      })
      orderedIDs = Object.keys(orderedIDMap)
      findManyArgs.where = inArray(adapter.tables[tableName].id, orderedIDs)
    }
  } else {
    findManyArgs.limit = limit
    findManyArgs.offset = offset
    findManyArgs.orderBy = () => orderBy.map(({ column, order }) => order(column))

    if (where) {
      findManyArgs.where = where
    }
  }

  const findPromise = db.query[tableName].findMany(findManyArgs)

  if (pagination !== false && (orderedIDs ? orderedIDs?.length <= limit : true)) {
    totalDocs = await adapter.countDistinct({
      db,
      joins,
      tableName,
      where,
    })

    totalPages = typeof limit === 'number' && limit !== 0 ? Math.ceil(totalDocs / limit) : 1
    hasPrevPage = page > 1
    hasNextPage = totalPages > page
    pagingCounter = (page - 1) * limit + 1
  }

  const rawDocs = await findPromise
  // sort rawDocs from selectQuery
  if (Object.keys(orderedIDMap).length > 0) {
    rawDocs.sort((a, b) => orderedIDMap[a.id] - orderedIDMap[b.id])
  }

  if (pagination === false || !totalDocs) {
    totalDocs = rawDocs.length
    totalPages = 1
    pagingCounter = 1
    hasPrevPage = false
    hasNextPage = false
  }

  const docs = rawDocs.map((data: TypeWithID) => {
    return transform({
      adapter,
      config: adapter.payload.config,
      data,
      fields,
      joinQuery,
      tableName,
    })
  })

  return {
    docs,
    hasNextPage,
    hasPrevPage,
    limit: limitArg,
    nextPage: hasNextPage ? page + 1 : null,
    page,
    pagingCounter,
    prevPage: hasPrevPage ? page - 1 : null,
    totalDocs,
    totalPages,
  }
}
