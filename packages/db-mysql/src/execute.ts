import { sql } from 'drizzle-orm'

import type { Execute } from './types.js'

export const execute: Execute<any> = function execute({ db, drizzle, raw, sql: statement }) {
  const executeFrom = db ?? drizzle

  if (raw) {
    const result = executeFrom.execute(sql.raw(raw))
    return result
  } else {
    const result = executeFrom.execute(statement)
    return result
  }
}
