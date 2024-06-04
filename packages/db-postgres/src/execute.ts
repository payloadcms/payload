import { sql } from 'drizzle-orm'

import type { PostgresAdapter } from './types.js'

export const execute: PostgresAdapter['execute'] = function execute({
  db,
  drizzle,
  raw,
  sql: statement,
}) {
  const executeFrom = db ?? drizzle

  if (raw) {
    return executeFrom.execute(sql.raw(raw))
  } else {
    return executeFrom.execute(statement)
  }
}
