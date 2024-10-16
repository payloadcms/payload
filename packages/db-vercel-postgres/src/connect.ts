import type { DrizzleAdapter } from '@payloadcms/drizzle/types'
import type { Connect } from 'payload'

import { pushDevSchema } from '@payloadcms/drizzle'
import { sql, VercelPool } from '@vercel/postgres'
import { drizzle } from 'drizzle-orm/node-postgres'

import type { VercelPostgresAdapter } from './types.js'

export const connect: Connect = async function connect(
  this: VercelPostgresAdapter,
  options = {
    hotReload: false,
  },
) {
  const { hotReload } = options

  this.schema = {
    pgSchema: this.pgSchema,
    ...this.tables,
    ...this.relations,
    ...this.enums,
  }

  try {
    const logger = this.logger || false
    // Passed the poolOptions if provided,
    // else have vercel/postgres detect the connection string from the environment
    this.drizzle = drizzle(this.poolOptions ? new VercelPool(this.poolOptions) : sql, {
      logger,
      schema: this.schema,
    })

    if (!hotReload) {
      if (process.env.PAYLOAD_DROP_DATABASE === 'true') {
        this.payload.logger.info(`---- DROPPING TABLES SCHEMA(${this.schemaName || 'public'}) ----`)
        await this.dropDatabase({ adapter: this })
        this.payload.logger.info('---- DROPPED TABLES ----')
      }
    }
  } catch (err) {
    if (err.message?.match(/database .* does not exist/i) && !this.disableCreateDatabase) {
      // capitalize first char of the err msg
      this.payload.logger.info(
        `${err.message.charAt(0).toUpperCase() + err.message.slice(1)}, creating...`,
      )
      const isCreated = await this.createDatabase()

      if (isCreated) {
        await this.connect(options)
        return
      }
    } else {
      this.payload.logger.error({
        err,
        msg: `Error: cannot connect to Postgres. Details: ${err.message}`,
      })
    }

    if (typeof this.rejectInitializing === 'function') {
      this.rejectInitializing()
    }
    process.exit(1)
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
    await this.migrate({ migrations: this.prodMigrations })
  }
}
