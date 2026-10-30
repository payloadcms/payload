import type { SQL } from 'drizzle-orm'

import { sql } from 'drizzle-orm'
import { APIError } from 'payload'

import { isValidStringID } from './isValidStringID.js'

const isInlinableValue = (value: unknown): boolean =>
  value === null ||
  (typeof value === 'number' && Number.isFinite(value)) ||
  (typeof value === 'string' && isValidStringID(value))

/**
 * Whether `buildInlinedInConstraint` accepts all of the values: numbers, `null` and strings in the
 * format of an ID, which are safe to write into the statement.
 */
export const canInlineValues = (values: unknown[]): boolean => values.every(isInlinableValue)

/**
 * Builds an `IN` / `NOT IN` constraint that writes the values into the statement instead of binding
 * them, for adapters with `limitedBoundParameters` (e.g. Cloudflare D1 allows 100 bound parameters
 * per statement).
 */
export const buildInlinedInConstraint = ({
  column,
  operator,
  values,
}: {
  column: SQL
  operator: 'in' | 'not_in'
  values: unknown[]
}): SQL => {
  if (!canInlineValues(values)) {
    throw new APIError(`Invalid ID value in ${JSON.stringify(values)}`)
  }

  const inlinedValues = values.map((value) => {
    if (value === null) {
      return 'NULL'
    }

    return typeof value === 'string' ? `'${value}'` : String(value as number)
  })

  return sql`${column} ${sql.raw(operator === 'in' ? 'IN' : 'NOT IN')} (${sql.raw(inlinedValues.join(','))})`
}
