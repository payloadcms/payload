import type { Client } from '@libsql/client'
import type { DrizzleTransaction } from '@payloadcms/drizzle'

import { LibSQLDatabase } from 'drizzle-orm/libsql'
import { LibSQLSession } from 'drizzle-orm/libsql/session'
import { DefaultLogger } from 'drizzle-orm/logger'
import { SQLiteAsyncDialect } from 'drizzle-orm/sqlite-core'

import type { SQLiteAdapter } from './types.js'

const readDialects = new WeakMap<SQLiteAdapter['drizzle'], SQLiteAsyncDialect>()

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
    const connectedDB = adapter.drizzle
    let dialect = readDialects.get(connectedDB)

    if (!dialect) {
      dialect = new SQLiteAsyncDialect()
      readDialects.set(connectedDB, dialect)
    }
    // Drizzle already extracted every table and relation when the adapter connected.
    // Only the native session and its query builders belong to this read transaction.
    const compiledSchema = connectedDB._
    const schema = compiledSchema.schema
      ? {
          fullSchema: compiledSchema.fullSchema,
          schema: compiledSchema.schema,
          tableNamesMap: compiledSchema.tableNamesMap,
        }
      : undefined
    const logger = adapter.logger === true ? new DefaultLogger() : adapter.logger || undefined
    const session = new LibSQLSession(
      transaction as unknown as Client,
      dialect,
      schema,
      { logger },
      transaction,
    )
    const db = Object.assign(new LibSQLDatabase('async', dialect, session, schema), {
      $client: transaction,
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
