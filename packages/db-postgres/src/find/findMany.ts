import type { FindArgs } from 'payload/database'
import type { Field, PayloadRequest, TypeWithID } from 'payload/types'

import { inArray, sql } from 'drizzle-orm'

import type { PostgresAdapter } from '../types'
import type { ChainedMethods } from './chainMethods'

import buildQuery from '../queries/buildQuery'
import { transform } from '../transform/read'
import { buildFindManyArgs } from './buildFindManyArgs'
import { chainMethods } from './chainMethods'

type Args = Omit<FindArgs, 'collection'> & {
  adapter: PostgresAdapter
  fields: Field[]
  tableName: string,
}

export const findMany = async function find({
  adapter,
  fields,
  limit: limitArg,
  locale,
  page = 1,
  pagination,
  req = {} as PayloadRequest,
  sort,
  tableName,
  where: whereArg,
  }: Args,
) {
  const table = adapter.tables[tableName];

  let limit = limitArg
  let totalDocs: number
  let totalPages: number
  let hasPrevPage: boolean
  let hasNextPage: boolean
  let pagingCounter: number
  let selectDistinctResult

  const { joins, orderBy, selectFields, where } = await buildQuery({
    adapter,
    fields,
    locale,
    sort,
    tableName,
    where: whereArg,
  })

  const db = adapter.sessions?.[req.transactionID] || adapter.db
  const orderedIDMap: Record<number | string, number> = {}

  const selectDistinctMethods: ChainedMethods = []

  if (orderBy?.order && orderBy?.column) {
    selectDistinctMethods.push({
      args: [orderBy.order(orderBy.column)],
      method: 'orderBy',
    })
  }

  const findManyArgs = buildFindManyArgs({
    adapter,
    depth: 0,
    fields,
    tableName,
  })

  // only fetch IDs when a sort or where query is used that needs to be done on join tables, otherwise these can be done directly on the table in findMany
  if (Object.keys(joins).length > 0) {
    if (where) {
      selectDistinctMethods.push({ args: [where], method: 'where' })
    }
    Object.entries(joins).forEach(([joinTable, condition]) => {
      if (joinTable) {
        selectDistinctMethods.push({
          args: [adapter.tables[joinTable], condition],
          method: 'leftJoin',
        })
      }
    })

    selectDistinctMethods.push({ args: [(page - 1) * limit], method: 'offset' })
    selectDistinctMethods.push({ args: [limit === 0 ? undefined : limit], method: 'limit' })

    selectDistinctResult = await chainMethods({
      methods: selectDistinctMethods,
      query: db.selectDistinct(selectFields).from(table),
    })

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
    }
    // set the id in an object for sorting later
    selectDistinctResult.forEach(({ id }, i) => {
      orderedIDMap[id as number | string] = i
    })
    findManyArgs.where = inArray(adapter.tables[tableName].id, Object.keys(orderedIDMap))
  } else {
    findManyArgs.limit = limitArg === 0 ? undefined : limitArg
    findManyArgs.offset = (page - 1) * limitArg
    if (where) {
      findManyArgs.where = where
    }
    findManyArgs.orderBy = orderBy.order(orderBy.column)
  }

  const findPromise = db.query[tableName].findMany(findManyArgs)

  if (pagination !== false || selectDistinctResult?.length > limit) {
    const selectCountMethods: ChainedMethods = []
    Object.entries(joins).forEach(([joinTable, condition]) => {
      if (joinTable) {
        selectCountMethods.push({
          args: [adapter.tables[joinTable], condition],
          method: 'leftJoin',
        })
      }
    })
    const countResult = await chainMethods({
      methods: selectCountMethods,
      query: db
        .select({ count: sql<number>`count(*)` })
        .from(table)
        .where(where),
    })
    totalDocs = Number(countResult[0].count)
    totalPages = typeof limit === 'number' ? Math.ceil(totalDocs / limit) : 1
    hasPrevPage = page > 1
    hasNextPage = totalPages > page
    pagingCounter = (page - 1) * limit + 1
  }

  const rawDocs = await findPromise
  // sort rawDocs from selectQuery
  if (Object.keys(orderedIDMap).length > 0) {
    rawDocs.sort((a, b) => orderedIDMap[a.id] - orderedIDMap[b.id])
  }

  if (pagination === false) {
    totalDocs = rawDocs.length
    limit = totalDocs
    totalPages = 1
    pagingCounter = 1
    hasPrevPage = false
    hasNextPage = false
  }

  const docs = rawDocs.map((data: TypeWithID) => {
    return transform({
      config: adapter.payload.config,
      data,
      fields,
    })
  })

  return {
    docs,
    hasNextPage,
    hasPrevPage,
    limit,
    nextPage: hasNextPage ? page + 1 : null,
    page,
    pagingCounter,
    prevPage: hasPrevPage ? page - 1 : null,
    totalDocs,
    totalPages,
  }
}
