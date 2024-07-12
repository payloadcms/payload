import { sql } from 'drizzle-orm'

import type { Execute } from './types.js'

export const execute: Execute<any> = function execute({ db, drizzle, raw, sql: statement }) {
  const executeFrom = db ?? drizzle

  if (raw) {
    // @ts-expect-error drizzle-orm confusing libsql and pgsql types
    return executeFrom.execute(sql.raw(raw))
  } else {
    // @ts-expect-error drizzle-orm confusing libsql and pgsql types
    return executeFrom.execute(sql`${statement}`)
  }
}
