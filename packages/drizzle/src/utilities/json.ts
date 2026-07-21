import type { Column, SQL } from 'drizzle-orm'

import { sql } from 'drizzle-orm'
import { APIError } from 'payload'

import type { DrizzleAdapter } from '../types.js'

const SAFE_KEY_REGEX = /^\w+$/

export function jsonAgg(adapter: DrizzleAdapter, expression: SQL) {
  if (adapter.name === 'sqlite') {
    return sql`coalesce(json_group_array(${expression}), '[]')`
  }

  if (adapter.name === 'mssql') {
    // SQL Server has no json_agg. Concatenate the per-row JSON objects into a JSON array string.
    return sql`coalesce('[' + string_agg(convert(nvarchar(max), ${expression}), ',') + ']', '[]')`
  }

  return sql`coalesce(json_agg(${expression}), '[]'::json)`
}

/**
 * @param shape Keys are interpolated into raw SQL — only use trusted, internally-generated key names
 */
export function jsonBuildObject<T extends Record<string, Column | SQL>>(
  adapter: DrizzleAdapter,
  shape: T,
) {
  const chunks: SQL[] = []

  Object.entries(shape).forEach(([key, value]) => {
    if (!SAFE_KEY_REGEX.test(key)) {
      throw new APIError(
        'Unsafe key passed to jsonBuildObject. Only alphanumeric characters and underscores are allowed.',
        500,
      )
    }
    if (chunks.length > 0) {
      chunks.push(sql.raw(','))
    }
    chunks.push(sql.raw(`'${key}',`))
    chunks.push(sql`${value}`)
  })

  if (adapter.name === 'sqlite') {
    return sql`json_object(${sql.join(chunks)})`
  }

  if (adapter.name === 'mssql') {
    // SQL Server builds JSON objects via `FOR JSON PATH`: `SELECT <value> AS [key], ...`.
    const mssqlChunks: SQL[] = []
    Object.entries(shape).forEach(([key, value]) => {
      if (mssqlChunks.length > 0) {
        mssqlChunks.push(sql.raw(','))
      }
      mssqlChunks.push(sql`${value} AS ${sql.raw(`[${key}]`)}`)
    })
    return sql`(select ${sql.join(mssqlChunks)} for json path, without_array_wrapper, include_null_values)`
  }

  return sql`json_build_object(${sql.join(chunks)})`
}

export const jsonAggBuildObject = <T extends Record<string, Column | SQL>>(
  adapter: DrizzleAdapter,
  shape: T,
) => {
  return jsonAgg(adapter, jsonBuildObject(adapter, shape))
}
