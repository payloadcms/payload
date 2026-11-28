import type { SQL } from 'drizzle-orm'

import { and, isNotNull, isNull, or } from 'drizzle-orm'
import { createArrayFromCommaDelineated, QueryError } from 'payload'

import type { GenericTable } from '../types.js'

type Args = {
  /** The column that holds the related document's ID, for each collection the field relates to. */
  columns: Map<string, string>
  operator: string
  path: string
  table: GenericTable
  value: unknown
}

/**
 * Builds the constraint for a query on the `relationTo` of a polymorphic relationship
 * (`'field.relationTo'`).
 *
 * The relationships table stores one ID column per related collection, so a row relates to a
 * collection when that collection's column is set, and does not when it is null. Documents
 * with no relationship have no row at all: their columns are null through the join, so the
 * negative operators and `exists: false` include them, as the MongoDB adapter does.
 */
export const buildRelationToConstraint = ({ columns, operator, path, table, value }: Args): SQL => {
  if (operator === 'exists') {
    const allColumns = [...columns.values()]

    return value === true || value === 'true'
      ? (or(...allColumns.map((column) => isNotNull(table[column]))) as SQL)
      : (and(...allColumns.map((column) => isNull(table[column]))) as SQL)
  }

  let slugs: unknown[] = [value]

  if (operator === 'in' || operator === 'not_in') {
    if (Array.isArray(value)) {
      slugs = value
    } else if (typeof value === 'string') {
      slugs = createArrayFromCommaDelineated(value)
    }
  }

  const targetColumns = slugs.map((slug) =>
    typeof slug === 'string' ? columns.get(slug) : undefined,
  )

  if (targetColumns.length === 0 || targetColumns.some((column) => !column)) {
    throw new QueryError([{ path }])
  }

  switch (operator) {
    case 'equals':
    case 'in':
      return or(...targetColumns.map((column) => isNotNull(table[column!]))) as SQL

    case 'not_equals':
    case 'not_in':
      return and(...targetColumns.map((column) => isNull(table[column!]))) as SQL

    default:
      throw new QueryError([{ path }])
  }
}
