import type { Column, SQL } from 'drizzle-orm'

import { sql } from 'drizzle-orm'

import type { DrizzleAdapter } from '../types.js'

export function jsonAgg(adapter: DrizzleAdapter, expression: SQL) {
  if (adapter.name === 'sqlite') {
    return sql`coalesce(json_group_array(${expression}), '[]')`
  }

  return sql`coalesce(json_agg(${expression}), '[]'::json)`
}

/**
 * @param shape Potential for SQL injections, so you shouldn't allow user-specified key names
 */
export function jsonBuildObject<T extends Record<string, Column | SQL>>(
  adapter: DrizzleAdapter,
  shape: T,
) {
  const chunks: SQL[] = []

  Object.entries(shape).forEach(([key, value]) => {
    if (chunks.length > 0) {
      chunks.push(sql.raw(','))
    }
    chunks.push(sql.raw(`'${key}',`))
    chunks.push(sql`${value}`)
  })

  if (adapter.name === 'sqlite') {
    return sql`json_object(${sql.join(chunks)})`
  }

  return sql`json_build_object(${sql.join(chunks)})`
}

export const jsonAggBuildObject = <T extends Record<string, Column | SQL>>(
  adapter: DrizzleAdapter,
  shape: T,
) => {
  return jsonAgg(adapter, jsonBuildObject(adapter, shape))
}
