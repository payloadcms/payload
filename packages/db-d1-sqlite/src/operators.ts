import type { Operators } from '@payloadcms/drizzle'

import { operatorMap } from '@payloadcms/drizzle'
import { sql } from 'drizzle-orm'

const isJSONArray = (values: unknown): values is unknown[] =>
  Array.isArray(values) &&
  values.length > 0 &&
  values.every((value) => value === null || typeof value !== 'object' || value instanceof Date)

/**
 * D1 allows at most 100 bound parameters per query, and drizzle's `inArray` binds one per value, so
 * large `in` lists fail with "too many SQL variables". This binds the whole list as a single JSON
 * parameter instead. Anything that isn't a plain list of values, such as a subquery, falls back to
 * drizzle's own operator.
 */
export const inJSONArray: Operators['in'] = (column, values) =>
  isJSONArray(values)
    ? sql`${column} IN (SELECT value FROM json_each(${JSON.stringify(values)}))`
    : operatorMap.in(column, values)

/** `NOT IN` counterpart of `inJSONArray`. */
export const notInJSONArray: Operators['not_in'] = (column, values) =>
  isJSONArray(values)
    ? sql`${column} NOT IN (SELECT value FROM json_each(${JSON.stringify(values)}))`
    : operatorMap.not_in(column, values)
