import { sql } from 'drizzle-orm'

import type { Execute } from './types.js'

export const execute: Execute<any> = async function execute({ db, drizzle, raw, sql: statement }) {
  const executeFrom = db ?? drizzle

  const result = raw
    ? await executeFrom.execute(sql.raw(raw))
    : await executeFrom.execute(statement)

  // The node-mssql driver returns an `IResult` ({ recordset, rowsAffected, ... }). Normalize it to
  // the `{ rows }` shape that the shared drizzle utilities expect (matching Postgres/SQLite).
  return { ...result, rows: (result as { recordset?: unknown[] }).recordset ?? [] }
}
