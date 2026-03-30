import type { FindArgs, FlattenedField, TypeWithID } from 'payload'

import { asc, desc, inArray, max, min, sql } from 'drizzle-orm'

import type { DrizzleAdapter } from '../types.js'

import { buildQuery } from '../queries/buildQuery.js'
import { selectDistinct } from '../queries/selectDistinct.js'
import { transform } from '../transform/read/index.js'
import { getNameFromDrizzleTable } from '../utilities/getNameFromDrizzleTable.js'
import { getTransaction } from '../utilities/getTransaction.js'
import { jsonAggBuildObject } from '../utilities/json.js'
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
  sort,
  tableName,
  versions,
  where: whereArg,
}: Args) {
  let limit = limitArg
  let totalDocs: number
  let totalPages: number
  let hasPrevPage: boolean
  let hasNextPage: boolean
  let pagingCounter: number
  const offset = (page - 1) * limit

  if (limit === 0) {
    pagination = false
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
    useBatchPolymorphicJoins: true,
    versions,
  })

  if (orderBy) {
    for (const key in selectFields) {
      const column = selectFields[key]
      if (!column || column.primary) {
        continue
      }

      if (
        !orderBy.some(
          (col) =>
            col.column.name === column.name &&
            getNameFromDrizzleTable(col.column.table) === getNameFromDrizzleTable(column.table),
        )
      ) {
        delete selectFields[key]
      }
    }
  }

  const db = await getTransaction(adapter, req)

  const oneToManyJoinedTableNames = new Set(
    joins.filter((j) => j.isOneToMany).map((j) => getNameFromDrizzleTable(j.table)),
  )

  const hasSortOnOneToMany =
    oneToManyJoinedTableNames.size > 0 &&
    orderBy?.some(({ column }) =>
      oneToManyJoinedTableNames.has(getNameFromDrizzleTable(column.table)),
    )

  let selectDistinctResult: { id: number | string }[] | undefined

  // avoid duplicate results by using a group query instead of select distinct when there is a sort on a one-to-many joined table
  if (hasSortOnOneToMany) {
    const mainTable = adapter.tables[tableName]
    let groupQuery = (db as any).select({ id: mainTable.id }).from(mainTable).$dynamic()

    if (where) {
      groupQuery = groupQuery.where(where)
    }

    joins.forEach(({ type, condition, table }) => {
      groupQuery = groupQuery[type ?? 'leftJoin'](table, condition)
    })

    groupQuery = groupQuery.groupBy(mainTable.id)

    groupQuery = groupQuery.orderBy(() =>
      orderBy.map(({ column, order }) => {
        if (oneToManyJoinedTableNames.has(getNameFromDrizzleTable(column.table))) {
          return order === asc ? asc(min(column)) : desc(max(column))
        }
        return order(column)
      }),
    )

    selectDistinctResult = await groupQuery.offset(offset).limit(limit)
  } else {
    selectDistinctResult = await selectDistinct({
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
  }

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

  // Batch-load polymorphic join fields: execute one query per join field for all
  // fetched parents, replacing the N+1 correlated subquery pattern with 2 queries total.
  if (findManyArgs._polymorphicJoins?.length && rawDocs.length > 0) {
    const parentIds = rawDocs.map((doc) => doc.id).filter(Boolean)

    for (const join of findManyArgs._polymorphicJoins) {
      const { columnName, countColumnName, currentQuery, limit, onPath, page, sortDir, sqlWhere } =
        join

      const rankedAlias = `${columnName}_ranked`
      const preAlias = `${columnName}_pre`

      // Compute ROW_NUMBER range from page/limit
      const rnOffset = page && limit !== 0 ? (page - 1) * limit : 0
      const rnStart = rnOffset + 1
      const rnEndSQL = limit !== 0 ? sql` AND "_rn" <= ${rnOffset + limit}` : sql``

      // Use IN (...) rather than = ANY(ARRAY[...]) so PostgreSQL can coerce bind
      // parameter types to match the column type without an explicit cast.
      const parentIdsSql = sql.join(
        parentIds.map((id) => sql`${id}`),
        sql`, `,
      )

      // Apply the join's where filter alongside the parent-ID filter.
      const rankSourceSQL = sql`(
        SELECT * FROM ${sql`${currentQuery.as(preAlias)}`}
        WHERE ${sql.raw(`"${onPath}"`)} IN (${parentIdsSql})${sqlWhere ? sql` AND ${sqlWhere}` : sql``}
      ) AS ${sql.raw(`"${preAlias}_src"`)}`

      // Single query: rank all children for all fetched parents, aggregate per parent.
      // COUNT(*) OVER is placed in the inner (ranking) query so it reflects the total
      // number of matching children per parent — not just the current page's rows.
      const batchResult = await (db as any).execute(sql`
        SELECT
          ${sql.raw(`"${rankedAlias}"."${onPath}"`)} AS "_parent_id",
          ${jsonAggBuildObject(adapter, {
            id: sql.raw(`"${rankedAlias}"."id"`),
            relationTo: sql.raw(`"${rankedAlias}"."relationTo"`),
          })} AS "_result"
          ${countColumnName ? sql`, MAX(${sql.raw(`"${rankedAlias}"."_total_count"`)}) AS "_total_count"` : sql``}
        FROM (
          SELECT *,
            ROW_NUMBER() OVER (
              PARTITION BY ${sql.raw(`"${onPath}"`)}
              ORDER BY "sortPath" ${sql.raw(sortDir)}
            ) AS "_rn"
            ${countColumnName ? sql`, COUNT(*) OVER (PARTITION BY ${sql.raw(`"${onPath}"`)}) AS "_total_count"` : sql``}
          FROM ${rankSourceSQL}
        ) AS ${sql.raw(`"${rankedAlias}"`)}
        WHERE "_rn" >= ${rnStart}${rnEndSQL}
        GROUP BY ${sql.raw(`"${rankedAlias}"."${onPath}"`)}
      `)

      const rows: Array<{ _parent_id: unknown; _result: unknown; _total_count?: number }> =
        batchResult.rows ?? batchResult
      const childMap = new Map(rows.map((r) => [String(r._parent_id), r]))

      for (const doc of rawDocs) {
        const row = childMap.get(String((doc as any).id))
        ;(doc as any)[columnName] = row?._result ?? null
        if (countColumnName) {
          ;(doc as any)[countColumnName] = row?._total_count ?? 0
        }
      }
    }
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
