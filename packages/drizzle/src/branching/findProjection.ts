import type { SQL } from 'drizzle-orm'
import type { Find, TypeWithID } from 'payload'

import {
  aliasedTableColumn,
  asc,
  count,
  countDistinct,
  eq,
  getTableName,
  inArray,
  max,
  min,
  sql,
} from 'drizzle-orm'
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
  // Ordinary collections and related tables can legally use the preferred CTE
  // names. SQLite resolves unqualified sources against CTEs first, including
  // sources inside nested hydration queries, so reserve the full table namespace.
  const statementNames = new Set(
    [
      ...Object.keys(this.tables),
      ...Object.values(this.tables).map((table) => getTableName(table)),
      ...this.tableNameMap.values(),
      ...joins.map(({ table }) => getTableName(table)),
    ].map((name) => name.toLowerCase()),
  )
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
  let statementRelations: SQL[]
  let fallbackCount: PromiseLike<{ total: number }[]>
  const hasRootOrdering = orderBy.every(
    ({ column, projectionAggregate }) =>
      !projectionAggregate && getTableName(column.table) === tableName,
  )
  const canPageRootDirectly = joins.length === 0 && hasRootOrdering

  if (canPageRootDirectly) {
    // Keep page selection on its native ordered index. Counting the same predicate
    // separately in this statement avoids ranking every match before applying LIMIT.
    const countQuery = (db as any)
      .select({ total: count().as('total') })
      .from(table)
      .where(where)
    const total = (db as any)
      .$with(allocateStatementName({ preferredName: 'projection_total', statementNames }))
      .as(countQuery)
    const totalQuery = (db as any).select({ total: total.total }).from(total)

    relational.where = where
    relational.orderBy = orderBy.map(({ column, order }) => order(column))
    if (limit) {
      relational.limit = limit
      relational.offset = offset
    }
    relational.extras = {
      ...(relational.extras ?? {}),
      [totalKey]: sql`(${totalQuery})`.as(totalKey),
    }
    statementRelations = [sql`${sql.identifier(total._.alias)} as materialized (${total._.sql})`]
    fallbackCount = countQuery
  } else if (hasRootOrdering && this.name === 'sqlite') {
    // Filter joins can multiply a root without changing its ordering. IN deduplicates
    // membership; defer distinctness to the count so matching can use filtering indexes.
    // PostgreSQL can repeatedly scan this membership CTE while walking the ordered
    // root index, so keep its joined queries on the grouped, ranked path below.
    let matching = (db as any).select({ id: table.id }).from(table).where(where).$dynamic()

    for (const join of joins) {
      matching = matching[join.type ?? 'leftJoin'](join.table, join.condition)
    }

    const allIDs = (db as any)
      .$with(allocateStatementName({ preferredName: 'projection_all_ids', statementNames }))
      .as(matching)
    const matchingIDs = (db as any).select({ id: allIDs.id }).from(allIDs)
    const totalQuery = (db as any).select({ total: countDistinct(allIDs.id) }).from(allIDs)

    relational.where = inArray(table.id, matchingIDs)
    relational.orderBy = orderBy.map(({ column, order }) => order(column))
    if (limit) {
      relational.limit = limit
      relational.offset = offset
    }
    relational.extras = {
      ...(relational.extras ?? {}),
      [totalKey]: sql`(${totalQuery})`.as(totalKey),
    }
    statementRelations = [sql`${sql.identifier(allIDs._.alias)} as materialized (${allIDs._.sql})`]
    fallbackCount = (db as any)
      .with(allIDs)
      .select({ total: countDistinct(allIDs.id) })
      .from(allIDs)
  } else {
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
        rank: sql`row_number() over (order by ${sql.join(ordering, sql`, `)})`.as(
          'projection_rank',
        ),
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
    const allIDs = (db as any)
      .$with(allocateStatementName({ preferredName: 'projection_all_ids', statementNames }))
      .as(ordered)
    const totalQuery = (db as any).select({ total: count() }).from(allIDs)
    let selectedQuery = (db as any)
      .select({ id: allIDs.id, rank: allIDs.rank })
      .from(allIDs)
      .orderBy(allIDs.rank)
      .$dynamic()

    if (limit) {
      selectedQuery = selectedQuery.limit(limit).offset(offset)
    }

    const selected = (db as any)
      .$with(allocateStatementName({ preferredName: 'projection_selected_ids', statementNames }))
      .as(selectedQuery)
    const selectedIDs = (db as any).select({ id: selected.id }).from(selected)
    const rank = (db as any)
      .select({ rank: selected.rank })
      .from(selected)
      // The nested query is compiled before relational alias rewriting. Correlate with
      // its outer alias explicitly, because a source schema qualifier is invalid there.
      .where(eq(selected.id, aliasedTableColumn(table.id, tableName)))

    relational.where = inArray(table.id, selectedIDs)
    relational.orderBy = sql`(${rank})`
    relational.extras = {
      ...(relational.extras ?? {}),
      [totalKey]: sql`(${totalQuery})`.as(totalKey),
    }
    statementRelations = [
      sql`${sql.identifier(allIDs._.alias)} as materialized (${allIDs._.sql})`,
      sql`${sql.identifier(selected._.alias)} as materialized (${selected._.sql})`,
    ]
    fallbackCount = (db as any).with(allIDs).select({ total: count() }).from(allIDs)
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
        sql`with ${sql.join(statementRelations, sql`, `)} ${compiled.query.sql}`,
      ),
    }
  }
  const rawDocs = await relationalQuery
  let totalDocs = Number(rawDocs[0]?.[totalKey] ?? 0)

  if (!rawDocs.length) {
    // An empty page carries no scalar total. It can linearize at this count only if
    // the requested page is also empty there; otherwise the caller must retry.
    totalDocs = Number((await fallbackCount)[0]?.total ?? 0)

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

const allocateStatementName = ({
  preferredName,
  statementNames,
}: {
  preferredName: string
  statementNames: Set<string>
}): string => {
  let name = preferredName
  let suffix = 0

  while (statementNames.has(name.toLowerCase())) {
    name = `${preferredName}_${++suffix}`
  }

  statementNames.add(name.toLowerCase())
  return name
}
