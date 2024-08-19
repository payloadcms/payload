import { sql } from 'drizzle-orm'

import type { Execute } from './types.js'

export const execute: Execute<any> = function execute({ db, drizzle, raw, sql: statement }) {
  const executeFrom = db ?? drizzle

  if (raw) {
    return executeFrom.execute(sql.raw(raw))
  } else {
    return executeFrom.execute(sql`${statement}`)
  }
}
