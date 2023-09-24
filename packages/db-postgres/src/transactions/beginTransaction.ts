import type { BeginTransaction } from 'payload/database'

import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { v4 as uuid } from 'uuid'

import type { PostgresAdapter } from '../types'

export const beginTransaction: BeginTransaction = async function beginTransaction(
  this: PostgresAdapter,
) {
  let id
  try {
    id = uuid()
    this.sessions[id] = drizzle(this.pool, { schema: this.schema })
    await this.sessions[id].execute(sql`BEGIN`)
  } catch (err) {
    this.payload.logger.error(`Error: cannot begin transaction: ${err.message}`, err)
    process.exit(1)
  }

  return id
}
