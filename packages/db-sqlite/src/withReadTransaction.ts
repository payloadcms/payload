import type { Client } from '@libsql/client'
import type { DrizzleTransaction } from '@payloadcms/drizzle'

import { drizzle } from 'drizzle-orm/libsql'

import type { SQLiteAdapter } from './types.js'

/** Drizzle's libSQL transaction method ignores the SQLite transaction configuration. */
export const withReadTransaction = async <T>({
  adapter,
  read,
}: {
  adapter: SQLiteAdapter
  read: (args: { db: DrizzleTransaction }) => Promise<T>
}): Promise<T> => {
  const transaction = await adapter.client.transaction('read')
  let result!: T
  let primaryError: unknown
  let hasFailed = false

  try {
    // The read session only needs the transaction's execute and batch methods.
    // Keep the parent client out of its Drizzle session so every query shares this snapshot.
    const db = drizzle(transaction as unknown as Client, {
      logger: adapter.logger || false,
      schema: adapter.schema,
    })
    result = await read({ db: db as unknown as DrizzleTransaction })

    await transaction.commit()
  } catch (error) {
    hasFailed = true
    primaryError = error
    try {
      await transaction.rollback()
    } catch {
      // Preserve the callback or commit error while still attempting to close the session.
    }
  }

  try {
    transaction.close()
  } catch (error) {
    if (!hasFailed) {
      throw error
    }
  }

  if (hasFailed) {
    throw primaryError
  }
  return result
}
