import type { Column, SQL } from 'drizzle-orm'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type { FlattenedField } from 'payload'

import { and, eq, exists, notExists, sql } from 'drizzle-orm'
import { createArrayFromCommaDelineated, QueryError } from 'payload'

import type { DrizzleAdapter, GenericTable } from '../types.js'
import type { PolymorphicJoinStorageChain } from './createPolymorphicJoinStorageChain.js'

import { getTableAlias } from '../queries/getTableAlias.js'
import { buildPolymorphicJoinColumnConstraint } from './buildPolymorphicJoinColumnConstraint.js'

type BuildPolymorphicJoinSeparateRowsConstraintArgs = {
  adapter: DrizzleAdapter
  chain: PolymorphicJoinStorageChain
  /** Reported by the thrown `QueryError`, e.g. `items.tags.equals`. */
  errorPath: string
  field: FlattenedField
  locale?: string
  operator: string
  parentTable: GenericTable
  schemaPath: string
  value: unknown
}

/**
 * Compiles one constraint on a localized or separate-row path for a single polymorphic join branch.
 * Each hop becomes a correlated `EXISTS` bound to its parent row, so a constraint can never match
 * rows belonging to another document. Negated operators compile to `NOT EXISTS` around the positive
 * predicate rather than a negation pushed inside it, which would turn "restrict" into "permit".
 *
 * @throws {QueryError} When the operator cannot be compiled soundly for the chain's storage.
 */
export const buildPolymorphicJoinSeparateRowsConstraint = ({
  adapter,
  chain,
  errorPath,
  field,
  locale,
  operator,
  parentTable,
  schemaPath,
  value,
}: BuildPolymorphicJoinSeparateRowsConstraintArgs): SQL => {
  const leaf = resolveLeafOperator({ operator, value })

  // Only a `_locales` hop narrowed to a single locale yields at most one row per parent. On a
  // many-row hop, "no row equals x" and "some row does not equal x" differ, so a negated operator
  // cannot be compiled without changing what the constraint means.
  const isSingleRowChain = locale !== 'all' && chain.hops.every((hop) => hop.isLocalesTable)

  if (leaf.requiresSingleRowChain && !isSingleRowChain) {
    throw new QueryError([{ path: errorPath }])
  }

  const db = adapter.drizzle as LibSQLDatabase
  const hopTables = chain.hops.map((hop) => ({
    hop,
    table: getTableAlias({ adapter, tableName: hop.tableName }).newAliasTable as GenericTable,
  }))
  const leafTable = hopTables[hopTables.length - 1].table
  const leafColumn = leafTable[chain.leafColumnKey] as Column | undefined

  if (!leafColumn) {
    throw new QueryError([{ path: errorPath }])
  }

  let condition = buildPolymorphicJoinColumnConstraint({
    adapter,
    column: leafColumn,
    errorPath,
    field,
    isUUID: leafColumn.columnType === 'PgUUID',
    operator: leaf.operator,
    schemaPath,
    value: leaf.value,
  })

  for (let hopIndex = hopTables.length - 1; hopIndex >= 0; hopIndex--) {
    const { hop, table } = hopTables[hopIndex]
    const parentIDColumn = (hopIndex === 0 ? parentTable : hopTables[hopIndex - 1].table)['id'] as
      | Column
      | undefined
    const parentColumn = table[hop.parentColumnKey] as Column | undefined

    if (!parentIDColumn || !parentColumn) {
      throw new QueryError([{ path: errorPath }])
    }

    const hopConditions: SQL[] = [eq(parentColumn, parentIDColumn)]
    const localeColumn = hop.localeColumnKey
      ? (table[hop.localeColumnKey] as Column | undefined)
      : undefined

    if (localeColumn) {
      if (!locale) {
        throw new QueryError([{ path: errorPath }])
      }

      if (locale !== 'all') {
        hopConditions.push(eq(localeColumn, locale))
      }
    }

    if (hop.pathValue) {
      hopConditions.push(eq(table['_path'] as Column, hop.pathValue))
    }

    hopConditions.push(condition)

    const wrap = hopIndex === 0 && leaf.isNegated ? notExists : exists

    condition = wrap(
      db
        .select({ one: sql`1` })
        .from(table)
        .where(and(...hopConditions)),
    )
  }

  return condition
}

/**
 * Resolves the constraint a path takes on a branch whose target collection has no such field. The
 * value reads as SQL NULL, so the outcome follows from the operator alone — deriving it from
 * another branch's field would let a value sanitized for a different storage shape decide it.
 */
export const buildPolymorphicJoinAbsentPathConstraint = ({
  operator,
  value,
}: {
  operator: string
  value: unknown
}): SQL => {
  const matchesNull = (() => {
    switch (operator) {
      case 'equals':
        return value === null
      case 'exists':
        return !(value === true || value === 'true')
      case 'in': {
        const values = typeof value === 'string' ? createArrayFromCommaDelineated(value) : value

        return Array.isArray(values) && values.includes(null)
      }
      case 'not_equals':
        return value !== null
      // `null not in (...)` and `null not like ...` both evaluate to NULL, so these do not match,
      // matching how an absent scalar column behaves on the same operators.
      default:
        return false
    }
  })()

  return sql.raw(matchesNull ? 'true' : 'false')
}

const resolveLeafOperator = ({
  operator,
  value,
}: {
  operator: string
  value: unknown
}): {
  isNegated: boolean
  operator: string
  requiresSingleRowChain: boolean
  value: unknown
} => {
  if (operator === 'exists') {
    return {
      isNegated: !(value === true || value === 'true'),
      operator: 'exists',
      requiresSingleRowChain: false,
      value: true,
    }
  }

  // "the value is null" and "the value is not null" are absence checks over the whole row set, so
  // they stay sound on a many-row hop.
  if (value === null && (operator === 'equals' || operator === 'not_equals')) {
    return {
      isNegated: operator === 'equals',
      operator: 'exists',
      requiresSingleRowChain: false,
      value: true,
    }
  }

  const negatedOperators: Record<string, string> = {
    not_equals: 'equals',
    not_in: 'in',
    not_like: 'like',
  }

  if (operator in negatedOperators) {
    return {
      isNegated: true,
      operator: negatedOperators[operator],
      requiresSingleRowChain: true,
      value,
    }
  }

  return { isNegated: false, operator, requiresSingleRowChain: false, value }
}
