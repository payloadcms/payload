import type { PgTableWithColumns } from 'drizzle-orm/pg-core'

import { count, sql } from 'drizzle-orm'

import type { BuildQueryJoinAliases } from '../queries/buildQuery.js'
import { getNameFromDrizzleTable } from '../utilities/getNameFromDrizzleTable.js'
import type { BasePostgresAdapter, CountDistinct } from './types.js'

export const countDistinct: CountDistinct = async function countDistinct(
  this: BasePostgresAdapter,
  { column, db, joins, tableName, where },
) {
  // When we don't have any joins - use a simple COUNT(*) query.
  if (joins.length === 0) {
    const countResult = await db
      .select({
        count: column ? count(sql`DISTINCT ${column}`) : count(),
      })
      .from(this.tables[tableName])
      .where(where)

    return Number(countResult?.[0]?.count ?? 0)
  }

  // When none of the joins can return more than one row per document, every
  // document appears at most once in the joined result, so a plain COUNT(*)
  // is exact and avoids grouping millions of rows just to count them.
  // A distinct column keeps the grouped query below, preserving its
  // existing behavior for findDistinct.
  if (!column && !joins.some((join) => isRowMultiplyingJoin(join))) {
    let fastQuery = db
      .select({
        count: count(),
      })
      .from(this.tables[tableName])
      .where(where)
      .$dynamic()

    joins.forEach(({ type, condition, table }) => {
      fastQuery = fastQuery[type ?? 'leftJoin'](table as PgTableWithColumns<any>, condition)
    })

    const fastCountResult = await fastQuery

    return Number(fastCountResult?.[0]?.count ?? 0)
  }

  let query = db
    .select({
      count: sql`COUNT(1) OVER()`,
    })
    .from(this.tables[tableName])
    .where(where)
    .groupBy(column || this.tables[tableName].id)
    .limit(1)
    .$dynamic()

  joins.forEach(({ type, condition, table }) => {
    query = query[type ?? 'leftJoin'](table as PgTableWithColumns<any>, condition)
  })

  // When we have any joins, we need to count each individual ID only once.
  // COUNT(*) doesn't work for this well in this case, as it also counts joined tables.
  // SELECT (COUNT DISTINCT id) has a very slow performance on large tables.
  // Instead, COUNT (GROUP BY id) can be used which is still slower than COUNT(*) but acceptable.
  const countResult = await query

  return Number(countResult?.[0]?.count ?? 0)
}

// A join multiplies rows when its table holds more than one row per
// document: array, blocks, _locales and _rels tables, and has-many value
// tables (_texts, _numbers, select values). Joins flagged with
// `isOneToMany` at the source are multiplying; aliased tables report a
// generated UUID as their name, so classification also falls back to the
// table's columns, which aliasing preserves: _rels and has-many value
// tables carry `parent` and/or `path` (a non-localized select value table
// carries `parent` but no `path`), blocks and array tables carry
// `_parentID`, and _locales tables carry `_locale`. A table with none of
// these markers is a plain main table behind a has-one join, which is
// what keeps the fast path exact.
const isRowMultiplyingJoin = (join: BuildQueryJoinAliases[number]): boolean => {
  if (join.isOneToMany) {
    return true
  }

  if (join.queryPath?.endsWith('._rels')) {
    return true
  }

  const tableName = getNameFromDrizzleTable(join.table)
  if (
    tableName.includes('_rels') ||
    tableName.includes('_locales') ||
    tableName.includes('_blocks_')
  ) {
    return true
  }

  const table = join.table as Record<string, unknown>
  if (table._parentID !== undefined || table._locale !== undefined) {
    return true
  }

  return table.parent !== undefined || table.path !== undefined
}
