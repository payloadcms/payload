import type { DrizzleAdapter } from '@payloadcms/drizzle/types'
import type { Connect, Migration } from 'payload'

import { createClient } from '@libsql/client'
import { pushDevSchema } from '@payloadcms/drizzle'
import { drizzle } from 'drizzle-orm/libsql'

import type { SQLiteAdapter } from './types.js'

export const connect: Connect = async function connect(
  this: SQLiteAdapter,
  options = {
    hotReload: false,
  },
) {
  const { hotReload } = options

  try {
    if (!this.client) {
      this.client = createClient(this.clientConfig)

      if (this.busyTimeout > 0) {
        await this.client.execute(`PRAGMA busy_timeout = ${this.busyTimeout};`)
      }

      if (this.wal) {
        const result = await this.client.execute('PRAGMA journal_mode;')

        if (result.rows[0]?.journal_mode !== 'wal') {
          this.payload.logger.info(
            `[db-sqlite] Enabling WAL mode with journal size limit ${this.wal.journalSizeLimit}.`,
          )
          await this.client.execute(`PRAGMA journal_mode = WAL;`)
          await this.client.execute(`PRAGMA journal_size_limit = ${this.wal.journalSizeLimit};`)
        }

        await this.client.execute(`PRAGMA synchronous = ${this.wal.synchronous};`)
      }
    }

    const logger = this.logger || false
    this.drizzle = drizzle(this.client, { logger, schema: this.schema })

    if (!hotReload) {
      if (process.env.PAYLOAD_DROP_DATABASE === 'true') {
        this.payload.logger.info(`---- DROPPING TABLES ----`)
        await this.dropDatabase({ adapter: this })
        this.payload.logger.info('---- DROPPED TABLES ----')
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    this.payload.logger.error({ err, msg: `Error: cannot connect to SQLite: ${message}` })
    if (typeof this.rejectInitializing === 'function') {
      this.rejectInitializing()
    }
    throw new Error(`Error: cannot connect to SQLite: ${message}`)
  }

  // Only push schema if not in production
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.PAYLOAD_MIGRATING !== 'true' &&
    this.push !== false
  ) {
    await pushDevSchema(this as unknown as DrizzleAdapter)
  }

  if (typeof this.resolveInitializing === 'function') {
    this.resolveInitializing()
  }

  if (process.env.NODE_ENV === 'production' && this.prodMigrations) {
    await this.migrate({ migrations: this.prodMigrations as Migration[] })
  }
}
