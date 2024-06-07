import { sql } from 'drizzle-orm'

import type { Execute } from './types.js'

export const execute: Execute = function execute({ db, drizzle, raw, sql: statement }) {
  const executeFrom = db ?? drizzle

  if (raw) {
    return executeFrom.run(sql.raw(raw))
  } else {
    return executeFrom.run(statement)
  }
}
