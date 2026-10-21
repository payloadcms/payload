import type { Find, TypeWithID } from 'payload'

import { asc, count, eq, getTableName, inArray, max, min, sql } from 'drizzle-orm'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from '../types.js'

import { buildFindManyArgs } from '../find/buildFindManyArgs.js'
import { buildQuery } from '../queries/buildQuery.js'
import { transform } from '../transform/read/index.js'
import { getTransaction } from '../utilities/getTransaction.js'

/** Page selection, raw content, joins and total all share one native statement snapshot. */
export const findProjection: Find = async function (this: DrizzleAdapter, args) {
  const config = this.payload.collections[args.collection].config
  const tableName = this.tableNameMap.get(toSnakeCase(config.slug))
  const table = this.tables[tableName]
  let totalKey = '__payloadBranchReadTotal'

  while (config.flattenedFields.some((field) => field.name === totalKey)) {
    totalKey += '_'
  }

  const page = args.page ?? 1
  const limit = args.limit ?? 0
  const offset = limit ? (page - 1) * limit : 0
  const isPaginationEnabled = args.pagination !== false && limit !== 0
  const { joins, orderBy, where } = buildQuery({
    adapter: this,
    fields: config.flattenedFields,
    locale: args.locale,
    sort: args.sort ?? config.defaultSort,
    tableName,
    where: args.where,
  })
  const db = await getTransaction(this, args.req)
  const relational = buildFindManyArgs({
    adapter: this,
    collectionSlug: config.slug,
    depth: 0,
    draftsEnabled: false,
    fields: config.flattenedFields,
    joinQuery: args.joins,
    locale: args.locale,
    select: args.select,
    tableName,
  })
  const ordering = orderBy.map(({ column, order, projectionAggregate }) =>
    order(
      projectionAggregate ??
        (getTableName(column.table) === tableName
          ? column
          : order === asc
            ? min(column)
            : max(column)),
    ),
  )
  // A single group per logical entity is selected before the page boundary. Window rank
  // preserves native one-to-many sort semantics without transporting IDs through JS.
  let ordered = (db as any)
    .select({
      id: table.id,
      rank: sql`row_number() over (order by ${sql.join(ordering, sql`, `)})`.as('projection_rank'),
    })
    .from(table)
    .where(where)
    .$dynamic()

  if (joins.length) {
    ordered = ordered.groupBy(table.id)
  }

  for (const join of joins) {
    ordered = ordered[join.type ?? 'leftJoin'](join.table, join.condition)
  }

  // Count grouped IDs, rather than joined rows. This is still inside the raw document statement.
  const allIDs = (db as any).$with('projection_all_ids').as(ordered)
  const totalQuery = (db as any).select({ total: count() }).from(allIDs)
  let selectedQuery = (db as any)
    .select({ id: allIDs.id, rank: allIDs.rank })
    .from(allIDs)
    .orderBy(allIDs.rank)
    .$dynamic()

  if (limit) {
    selectedQuery = selectedQuery.limit(limit).offset(offset)
  }

  const selected = (db as any).$with('projection_selected_ids').as(selectedQuery)
  const selectedIDs = (db as any).select({ id: selected.id }).from(selected)
  const rank = (db as any)
    .select({ rank: selected.rank })
    .from(selected)
    .where(eq(selected.id, table.id))

  relational.where = inArray(table.id, selectedIDs)
  relational.orderBy = sql`(${rank})`
  relational.extras = {
    ...(relational.extras ?? {}),
    [totalKey]: sql`(${totalQuery})`.as(totalKey),
  }

  const relationalQuery = db.query[tableName].findMany(relational)
  const originalToSQL = relationalQuery._toSQL.bind(relationalQuery)

  // Preserve Drizzle's relational row mapper while supplying statement-local materialized
  // CTEs. Inlining these relations repeats the complete filter/rank for every scalar use.
  relationalQuery._toSQL = () => {
    const compiled = originalToSQL()
    return {
      ...compiled,
      builtQuery: relationalQuery.dialect.sqlToQuery(
        sql`with ${sql.identifier(allIDs._.alias)} as materialized (${allIDs._.sql}), ${sql.identifier(selected._.alias)} as materialized (${selected._.sql}) ${compiled.query.sql}`,
      ),
    }
  }
  const rawDocs = await relationalQuery
  let totalDocs = Number(rawDocs[0]?.[totalKey] ?? 0)

  if (!rawDocs.length) {
    // An empty page carries no scalar total. It can linearize at this count only if
    // the requested page is also empty there; otherwise the caller must retry.
    totalDocs = Number(
      (await (db as any).with(allIDs).select({ total: count() }).from(allIDs))[0]?.total ?? 0,
    )

    if (totalDocs > offset) {
      const error = new Error('The selected branch content changed during the read operation.')

      Object.assign(error, { code: 'branch-projection-conflict' })
      throw error
    }
  }

  const docs = rawDocs.map((data: Record<string, unknown> & TypeWithID) => {
    delete data[totalKey]

    return transform({
      adapter: this,
      config: this.payload.config,
      data,
      fields: config.flattenedFields,
      joinQuery: args.joins,
      tableName,
    })
  })
  const totalPages = isPaginationEnabled ? Math.ceil(totalDocs / limit) : 1
  const hasNextPage = isPaginationEnabled && totalPages > page
  const hasPrevPage = isPaginationEnabled && page > 1

  return {
    docs,
    hasNextPage,
    hasPrevPage,
    limit,
    nextPage: hasNextPage ? page + 1 : null,
    page,
    pagingCounter: isPaginationEnabled ? offset + 1 : 1,
    prevPage: hasPrevPage ? page - 1 : null,
    totalDocs: isPaginationEnabled ? totalDocs : docs.length,
    totalPages,
  }
}
