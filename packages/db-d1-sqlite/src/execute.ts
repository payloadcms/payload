import type { Execute } from '@payloadcms/drizzle'
import type { SQLiteRaw } from 'drizzle-orm/sqlite-core/query-builders/raw'

import { sql } from 'drizzle-orm'

interface D1Meta {
  changed_db: boolean
  changes: number
  duration: number
  last_row_id: number
  rows_read: number
  rows_written: number
  /**
   * True if-and-only-if the database instance that executed the query was the primary.
   */
  served_by_primary?: boolean
  /**
   * The region of the database instance that executed the query.
   */
  served_by_region?: string
  size_after: number
  timings?: {
    /**
     * The duration of the SQL query execution by the database instance. It doesn't include any network time.
     */
    sql_duration_ms: number
  }
}

interface D1Response {
  error?: never
  meta: D1Meta & Record<string, unknown>
  success: true
}

type D1Result<T = unknown> = {
  results: T[]
} & D1Response

export const execute: Execute<any> = function execute({ db, drizzle, raw, sql: statement }) {
  const executeFrom: any = (db ?? drizzle)!
  const mapToLibSql = (query: SQLiteRaw<D1Result<unknown>>): any => {
    const execute = query.execute
    query.execute = async () => {
      const result: D1Result = await execute()
      const resultLibSQL = {
        columns: undefined,
        columnTypes: undefined,
        lastInsertRowid: BigInt(result.meta.last_row_id),
        rows: result.results as any[],
        rowsAffected: result.meta.rows_written,
      }

      return Object.assign(result, resultLibSQL)
    }

    return query
  }

  if (raw) {
    const result = mapToLibSql(executeFrom.run(sql.raw(raw)))
    return result
  } else {
    const result = mapToLibSql(executeFrom.run(statement))
    return result
  }
}
