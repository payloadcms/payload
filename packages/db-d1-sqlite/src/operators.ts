import type { Operators } from '@payloadcms/drizzle'

import { operatorMap } from '@payloadcms/drizzle'
import { isDriverValueEncoder, sql } from 'drizzle-orm'

const isJSONValue = (value: unknown): boolean =>
  value === null || typeof value !== 'object' || value instanceof Date

/**
 * Encodes each value through the column's encoder, like drizzle's `inArray` does when it binds them,
 * so a JSON column compares its stored text instead of the raw value. Returns `undefined` for
 * anything that can't be bound as one JSON array, such as a subquery.
 */
const toJSONArray = (column: unknown, values: unknown): string | undefined => {
  if (!Array.isArray(values) || values.length === 0 || !values.every(isJSONValue)) {
    return undefined
  }

  const encoded = values.map((value) =>
    value !== null && isDriverValueEncoder(column) ? column.mapToDriverValue(value) : value,
  )

  return encoded.every(isJSONValue) ? JSON.stringify(encoded) : undefined
}

/**
 * D1 allows at most 100 bound parameters per query, and drizzle's `inArray` binds one per value, so
 * large `in` lists fail with "too many SQL variables". This binds the whole list as a single JSON
 * parameter instead. Anything that isn't a plain list of values, such as a subquery, falls back to
 * drizzle's own operator.
 */
export const inJSONArray: Operators['in'] = (column, values) => {
  const json = toJSONArray(column, values)

  return json === undefined
    ? operatorMap.in(column, values)
    : sql`${column} IN (SELECT value FROM json_each(${json}))`
}

/** `NOT IN` counterpart of `inJSONArray`. */
export const notInJSONArray: Operators['not_in'] = (column, values) => {
  const json = toJSONArray(column, values)

  return json === undefined
    ? operatorMap.not_in(column, values)
    : sql`${column} NOT IN (SELECT value FROM json_each(${json}))`
}
