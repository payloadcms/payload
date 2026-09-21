import type { SQL } from 'drizzle-orm'

import { sql } from 'drizzle-orm'
import { createArrayFromCommaDelineated, QueryError } from 'payload'

import type { DrizzleAdapter } from '../types.js'

import { escapeSQLValue } from '../utilities/escapeSQLValue.js'

/**
 * Operators that both adapters can express against a `json` sub-path. Negated operators are
 * excluded on purpose: a branch that has no `json` column cannot distinguish "key is absent" from
 * "value does not match", so a negated constraint could widen the access rule it came from.
 */
export const supportedJSONPathOperators = new Set(['contains', 'equals', 'exists', 'in', 'like'])

const sqliteJSONPathOperators: Record<string, { operator: string; wildcard: string }> = {
  contains: { operator: 'like', wildcard: '%' },
  equals: { operator: '=', wildcard: '' },
  in: { operator: 'in', wildcard: '' },
  like: { operator: 'like', wildcard: '%' },
}

type BuildPolymorphicJSONPathConstraintArgs = {
  adapter: DrizzleAdapter
  /** Undefined when the `json` column is absent from the collection being compiled. */
  jsonColumnName: string | undefined
  operator: string
  /** Reported by the thrown `QueryError` when the constraint cannot be compiled. */
  path: string
  /** The `json` column name followed by the segments below it; the first entry is the root. */
  pathSegments: string[]
  value: unknown
}

/**
 * Compiles one `json` sub-path constraint for a single polymorphic join branch, using the same
 * traversal each adapter uses on the non-polymorphic query path. A branch whose target collection
 * has no `json` column at this path reads as SQL NULL, so it resolves to a boolean constant derived
 * from the operator alone rather than borrowing another branch's field.
 *
 * @throws {QueryError} When the operator or value cannot be compiled soundly for every branch.
 */
export const buildPolymorphicJSONPathConstraint = ({
  adapter,
  jsonColumnName,
  operator,
  path,
  pathSegments,
  value,
}: BuildPolymorphicJSONPathConstraintArgs): SQL => {
  if (!supportedJSONPathOperators.has(operator)) {
    throw new QueryError([{ path }])
  }

  if (operator === 'exists') {
    const shouldExist = value === true || value === 'true'

    if (!jsonColumnName) {
      return sql.raw(shouldExist ? 'false' : 'true')
    }

    if (adapter.name === 'postgres') {
      return sql.raw(
        adapter.createJSONQuery({
          column: `"${jsonColumnName}"`,
          operator: 'exists',
          pathSegments,
          value: shouldExist,
        }),
      )
    }

    return sql.raw(
      `"${jsonColumnName}"${getJSONTraversal({ adapter, path, pathSegments })} ${
        shouldExist ? 'is not null' : 'is null'
      }`,
    )
  }

  const queryValue = normalizeJSONPathValue({ operator, path, value })

  if (operator === 'in' && Array.isArray(queryValue) && queryValue.length === 0) {
    return sql.raw('false')
  }

  if (!jsonColumnName) {
    return sql.raw('false')
  }

  if (adapter.name === 'postgres') {
    return sql.raw(
      adapter.createJSONQuery({
        column: `"${jsonColumnName}"`,
        operator,
        pathSegments,
        value: queryValue,
      }),
    )
  }

  const { operator: sqliteOperator, wildcard } = sqliteJSONPathOperators[operator]
  let formattedValue: string

  if (Array.isArray(queryValue)) {
    formattedValue = `(${queryValue
      .map((item) => {
        const escaped = escapeSQLValue(item)

        return typeof item === 'string' ? `'${escaped}'` : String(escaped)
      })
      .join(',')})`
  } else if (operator === 'equals' && typeof queryValue !== 'string') {
    formattedValue = String(queryValue)
  } else {
    formattedValue = `'${wildcard}${escapeSQLValue(queryValue)}${wildcard}'`
  }

  return sql.raw(
    `"${jsonColumnName}"${getJSONTraversal({ adapter, path, pathSegments })} ${sqliteOperator} ${formattedValue}`,
  )
}

const isComparableJSONValue = (value: unknown): value is boolean | number | string =>
  typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string'

const normalizeJSONPathValue = ({
  operator,
  path,
  value,
}: {
  operator: string
  path: string
  value: unknown
}): boolean | number | number[] | string | string[] => {
  if (operator === 'in') {
    const values = typeof value === 'string' ? createArrayFromCommaDelineated(value) : value

    if (!Array.isArray(values)) {
      throw new QueryError([{ path }])
    }

    // Both adapters compare each entry against the same extracted sub-path, so a mixed-type list
    // would compare inconsistently across branches. Require one comparable type.
    if (values.every((item): item is string => typeof item === 'string')) {
      return values
    }

    if (values.every((item): item is number => typeof item === 'number')) {
      return values
    }

    throw new QueryError([{ path }])
  }

  // A null value would have to mean "the key is missing" on a branch that has the column and
  // "always true" on a branch that does not. Reject it instead of guessing.
  if (!isComparableJSONValue(value)) {
    throw new QueryError([{ path }])
  }

  return value
}

const getJSONTraversal = ({
  adapter,
  path,
  pathSegments,
}: {
  adapter: DrizzleAdapter
  path: string
  pathSegments: string[]
}): string => {
  if (!adapter.convertPathToJSONTraversal) {
    throw new QueryError([{ path }])
  }

  return adapter.convertPathToJSONTraversal(pathSegments)
}
